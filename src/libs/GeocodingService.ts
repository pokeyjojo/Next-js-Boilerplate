// Geocoding service with multiple providers and rate limiting

type GeocodingResult = {
  latitude: number;
  longitude: number;
};

type GeocodingProvider = {
  name: string;
  geocode: (address: string, city: string, state: string, zip: string) => Promise<GeocodingResult | null>;
  rateLimit: number; // milliseconds between requests
};

// Rate limiter to avoid overwhelming free services
class RateLimiter {
  private lastRequest: number = 0;
  private delay: number;

  constructor(delayMs: number) {
    this.delay = delayMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.delay) {
      const waitTime = this.delay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequest = Date.now();
  }
}

// Nominatim - Free, no API key required
const nominatimProvider: GeocodingProvider = {
  name: 'Nominatim',
  rateLimit: 1000, // 1 second between requests (respectful usage)
  geocode: async (address: string, city: string, state: string, zip: string) => {
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    const encodedAddress = encodeURIComponent(fullAddress);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'Tennis Court Finder App (development)', // Required by Nominatim
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: Number.parseFloat(result.lat),
        longitude: Number.parseFloat(result.lon),
      };
    }

    return null;
  },
};

// Geocoding service that manages providers
class GeocodingService {
  private providers: GeocodingProvider[];
  private rateLimiters: Map<string, RateLimiter>;

  constructor() {
    // Only use the free Nominatim service for now
    this.providers = [
      nominatimProvider,
    ];

    this.rateLimiters = new Map();
    this.providers.forEach((provider) => {
      this.rateLimiters.set(provider.name, new RateLimiter(provider.rateLimit));
    });
  }

  async geocodeAddress(address: string, city: string, state: string, zip: string): Promise<GeocodingResult | null> {
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;

    for (const provider of this.providers) {
      try {
        // Respect rate limits
        const rateLimiter = this.rateLimiters.get(provider.name);
        if (rateLimiter) {
          await rateLimiter.wait();
        }

        const result = await provider.geocode(address, city, state, zip);

        if (result) {
          return result;
        }

        // If result is null, provider either doesn't have API key or no results found
        // Continue to next provider silently
      } catch (error) {
        console.error(`Error with ${provider.name}:`, error);
        // Continue to next provider
      }
    }

    console.error('All geocoding providers failed for address:', fullAddress);
    return null;
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();

// Simple function for backward compatibility
export async function geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ latitude: number; longitude: number } | null> {
  return geocodingService.geocodeAddress(address, city, state, zip);
}

// Address autocomplete function using Nominatim
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    // Add Illinois to the query to make it more specific and faster
    const searchQuery = `${query}, Illinois`;

    const params = new URLSearchParams({
      'q': searchQuery,
      'format': 'json',
      'addressdetails': '1',
      'countrycodes': 'us',
      'limit': '5',
      'accept-language': 'en',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'TennisCourtFinder/1.0',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Nominatim search failed: ${response.status}`);
    }

    const results = await response.json();

    // If no results with bounding box, try without it
    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

    return results.map((result: any) => ({
      display_name: result.display_name,
      address: result.address?.house_number && result.address?.road
        ? `${result.address.house_number} ${result.address.road}`
        : result.address?.road || result.display_name.split(',')[0],
      city: result.address?.city || result.address?.town || result.address?.village || '',
      state: result.address?.state || '',
      zip: result.address?.postcode || '',
      lat: Number.parseFloat(result.lat),
      lon: Number.parseFloat(result.lon),
    })).filter((suggestion: AddressSuggestion) =>
      suggestion.address
      && suggestion.city
      && suggestion.state
      && suggestion.state === 'Illinois', // Filter to Illinois only since state is hardcoded
    );
  } catch (error) {
    console.error('Address search failed:', error);
    return [];
  }
}

export type AddressSuggestion = {
  display_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
};
