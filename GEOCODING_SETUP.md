# Geocoding Setup Guide

The court suggestion feature automatically converts addresses to GPS coordinates using Google Maps Geocoding API. This guide explains how to set it up and migrate from the previous OpenStreetMap implementation.

## 🚀 Current Configuration (Google Maps)

The app now uses **Google Maps Geocoding API** which provides:
- ✅ **High accuracy** - Industry-leading geocoding results
- ✅ **Reliable service** - Enterprise-grade infrastructure
- ✅ **Server/client support** - Works in both browser and server environments
- ⚠️ **Requires API key** - Free tier includes $200/month credit

**Setup required**: You need to configure your Google Maps API key (see below).

## 🛠️ Setup Instructions

### 1. Get Your Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Geocoding API** and **Places API**
4. Create credentials (API key)
5. Restrict the API key to your domain for security

### 2. Configure Environment Variables

Add your API key to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
```

### 3. Enable Required APIs

Make sure these APIs are enabled in your Google Cloud project:
- ✅ **Geocoding API** - For address-to-coordinates conversion
- ✅ **Places API** - For address autocomplete
- ✅ **Maps JavaScript API** - For map display

## 🔄 How It Works

The geocoding service automatically:

1. **Detects environment**: Uses REST API on server, JavaScript SDK in browser
2. **High accuracy**: Google's industry-leading geocoding results
3. **Address autocomplete**: Powered by Google Places API
4. **Error handling**: Graceful fallbacks and detailed error logging

## 💰 Pricing

Google Maps provides generous free tiers:

| API | Free Tier | Price After |
|-----|-----------|-------------|
| **Geocoding API** | 40,000 requests/month | $5 per 1,000 requests |
| **Places API** | 100,000 requests/month | $17 per 1,000 requests |
| **Maps JavaScript API** | Unlimited map loads | $7 per 1,000 loads |

Most small to medium apps stay within the free tier limits.

## 🚨 Migration from OpenStreetMap

If you were using the previous OpenStreetMap/Nominatim setup:

1. **Set up Google Maps API key** (see instructions above)
2. **Remove old environment variables** (if any):
   - `LOCATIONIQ_API_KEY`
   - `GEOCODE_MAPS_API_KEY`
   - `OPENCAGE_API_KEY`
3. **That's it!** The app now uses Google Maps for all geocoding

Your existing court data remains unchanged.

## 🔍 Testing

To test geocoding in development:

```bash
# Start your development server
npm run dev

# Try adding a new court via admin panel
# Check browser/server console logs for any errors
```

## 💡 Pro Tips

1. **Enable billing**: Set up billing in Google Cloud to avoid service interruptions
2. **Monitor usage**: Check Google Cloud Console for API usage statistics
3. **Restrict API keys**: Limit API key usage to your domains for security
4. **Cache results**: The app stores coordinates in database, reducing API calls
5. **Test addresses**: Try various address formats to ensure good coverage

## ❓ Troubleshooting

**Geocoding not working?**
- Verify your Google Maps API key is set in `.env.local`
- Check that Geocoding API is enabled in Google Cloud Console
- Look for error messages in browser/server console logs
- Ensure your API key has proper permissions

**"Unable to determine coordinates" error?**
- The address might be too vague or incorrect
- Try a more specific address format
- Check API key quotas in Google Cloud Console
- Verify billing is set up (required for some APIs)

**Address autocomplete not working?**
- Ensure Places API is enabled in Google Cloud Console
- Check that your API key has Places API permissions
- Verify the component is running in browser environment
- Try refreshing the page or clearing browser cache
