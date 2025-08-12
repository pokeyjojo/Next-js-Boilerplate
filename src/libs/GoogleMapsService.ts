import { Loader } from '@googlemaps/js-api-loader';
import { Env } from '@/libs/Env';

export type GeocodingResult = {
  latitude: number;
  longitude: number;
};

export type AddressSuggestion = {
  display_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
  place_id?: string;
};

class GoogleMapsService {
  private loader: Loader;
  private mapsLoaded = false;
  private geocoder: google.maps.Geocoder | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private autocompleteService: google.maps.places.AutocompleteService | null = null;

  constructor() {
    // Use client-side key for browser-based Google Maps loader
    const clientApiKey = Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    this.loader = new Loader({
      apiKey: clientApiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
  }

  async loadMaps(): Promise<void> {
    if (this.mapsLoaded) {
      return;
    }

    try {
      await this.loader.load();
      this.geocoder = new google.maps.Geocoder();
      
      // Create a temporary div for places service initialization
      const tempDiv = document.createElement('div');
      const tempMap = new google.maps.Map(tempDiv);
      this.placesService = new google.maps.places.PlacesService(tempMap);
      this.autocompleteService = new google.maps.places.AutocompleteService();
      
      this.mapsLoaded = true;
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      throw error;
    }
  }

  async geocodeAddress(
    address: string,
    city: string,
    state: string,
    zip: string
  ): Promise<GeocodingResult | null> {
    // Check if we're running in a browser environment
    if (typeof window !== 'undefined') {
      // Browser environment - use the JavaScript SDK
      await this.loadMaps();
      
      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }

      const fullAddress = `${address}, ${city}, ${state} ${zip}`;

      return new Promise((resolve) => {
        this.geocoder!.geocode({ address: fullAddress }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              latitude: location.lat(),
              longitude: location.lng(),
            });
          } else {
            console.error('Geocoding failed:', status);
            resolve(null);
          }
        });
      });
    } else {
      // Server environment - use the REST API
      return this.geocodeAddressServer(address, city, state, zip);
    }
  }

  private async geocodeAddressServer(
    address: string,
    city: string,
    state: string,
    zip: string
  ): Promise<GeocodingResult | null> {
    // Use server-side key for geocoding API
    const apiKey = Env.GOOGLE_MAPS_SERVER_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps server API key not found');
      return null;
    }

    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Google Maps Geocoding API request failed:', response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const result = {
          latitude: location.lat,
          longitude: location.lng,
        };
        return result;
      } else {
        console.error('Google Maps Geocoding failed:', {
          status: data.status,
          error_message: data.error_message,
          results_count: data.results?.length || 0,
          address: fullAddress
        });
        return null;
      }
    } catch (error) {
      console.error('Error calling Google Maps Geocoding API:', error);
      return null;
    }
  }

  async searchAddresses(query: string): Promise<AddressSuggestion[]> {
    if (!query || query.length < 3) {
      return [];
    }

    await this.loadMaps();
    
    if (!this.autocompleteService) {
      throw new Error('Autocomplete service not initialized');
    }

    return new Promise((resolve) => {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'us' },
        types: ['address'],
      };

      this.autocompleteService!.getPlacePredictions(request, async (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }

        // Get detailed information for each prediction
        const suggestions: AddressSuggestion[] = [];
        
        for (const prediction of predictions.slice(0, 5)) {
          try {
            const details = await this.getPlaceDetails(prediction.place_id);
            if (details) {
              suggestions.push(details);
            }
          } catch (error) {
            console.error('Error getting place details:', error);
          }
        }

        resolve(suggestions);
      });
    });
  }

  private async getPlaceDetails(placeId: string): Promise<AddressSuggestion | null> {
    if (!this.placesService) {
      return null;
    }

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['formatted_address', 'address_components', 'geometry'],
      };

      this.placesService!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = place.address_components || [];
          
          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let zip = '';

          addressComponents.forEach((component) => {
            const types = component.types;
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            } else if (types.includes('postal_code')) {
              zip = component.long_name;
            }
          });

          const address = streetNumber && route ? `${streetNumber} ${route}` : route;
          
          // Only return results for Illinois
          if (state === 'IL') {
            resolve({
              display_name: place.formatted_address || '',
              address,
              city,
              state,
              zip,
              lat: place.geometry?.location?.lat() || 0,
              lon: place.geometry?.location?.lng() || 0,
              place_id: placeId,
            });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  createMap(container: HTMLElement, options: google.maps.MapOptions): google.maps.Map {
    if (!this.mapsLoaded) {
      throw new Error('Google Maps not loaded yet');
    }
    if (!container) {
      throw new Error('Map container element is null or undefined');
    }
    return new google.maps.Map(container, options);
  }

  createMarker(options: google.maps.MarkerOptions): google.maps.Marker {
    if (!this.mapsLoaded) {
      throw new Error('Google Maps not loaded yet');
    }
    return new google.maps.Marker(options);
  }

  createInfoWindow(options?: google.maps.InfoWindowOptions): google.maps.InfoWindow {
    if (!this.mapsLoaded) {
      throw new Error('Google Maps not loaded yet');
    }
    return new google.maps.InfoWindow(options);
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();

// Export functions for backward compatibility with existing code
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<{ latitude: number; longitude: number } | null> {
  return googleMapsService.geocodeAddress(address, city, state, zip);
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  return googleMapsService.searchAddresses(query);
}
