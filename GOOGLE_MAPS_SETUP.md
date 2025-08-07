# Google Maps Setup Guide

This application has been updated to use Google Maps instead of Leaflet. Follow these steps to set up Google Maps API.

## 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API key)
5. Restrict the API key to your domain(s) for security

## 2. Configure Environment Variables

Add the following environment variable to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

## 3. API Key Restrictions (Important for Security)

For production, restrict your API key:

1. **Application restrictions**: Set to "HTTP referrers" and add your domain(s)
2. **API restrictions**: Limit to only the APIs you need:
   - Maps JavaScript API
   - Places API  
   - Geocoding API

## 4. Features Implemented

### Map View
- Google Maps instead of Leaflet
- Custom styled map using the Gladiator color palette
- Custom markers for public/private courts
- Zoom controls and map interactions

### Address Autocomplete
- Google Places Autocomplete for address input
- Works in:
  - New Court Suggestion Form
  - Court Edit Suggestion Form  
  - Admin Add Court Form
- Restricted to Illinois addresses
- Returns detailed address components

### Geocoding
- Google Geocoding API for converting addresses to coordinates
- Used when creating new courts or suggestions

## 5. Migration Notes

### What Changed
- Replaced `react-leaflet` with Google Maps JavaScript API
- Updated all map components to use Google Maps equivalents
- Changed address autocomplete from Nominatim to Google Places API
- Updated geocoding service to use Google Geocoding API

### Compatibility
- All existing functionality preserved
- Same component interfaces
- Database schema unchanged
- No changes to court data structure

## 6. Cost Considerations

Google Maps APIs have usage-based pricing. For typical court finder usage:

- **Maps JavaScript API**: ~$7 per 1,000 map loads
- **Places API**: ~$17 per 1,000 requests  
- **Geocoding API**: ~$5 per 1,000 requests

Google provides $200 monthly free credit which covers moderate usage.

## 7. Fallback

The old Leaflet components and Nominatim geocoding are preserved in:
- `src/libs/GeocodingService.ts` (old implementation)

To revert if needed, you can switch the imports back to the old service.


