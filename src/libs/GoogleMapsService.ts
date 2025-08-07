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
    const apiKey = Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log('GoogleMapsService: Initializing with API key:', apiKey ? `${apiKey.slice(0, 10)}...` : 'NOT SET');
    
    this.loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
  }

  async loadMaps(): Promise<void> {
    if (this.mapsLoaded) {
      console.log('GoogleMapsService: Maps already loaded');
      return;
    }

    try {
      console.log('GoogleMapsService: Loading Google Maps...');
      await this.loader.load();
      this.geocoder = new google.maps.Geocoder();
      
      // Create a temporary div for places service initialization
      const tempDiv = document.createElement('div');
      const tempMap = new google.maps.Map(tempDiv);
      this.placesService = new google.maps.places.PlacesService(tempMap);
      this.autocompleteService = new google.maps.places.AutocompleteService();
      
      this.mapsLoaded = true;
      console.log('GoogleMapsService: Google Maps successfully loaded');
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
