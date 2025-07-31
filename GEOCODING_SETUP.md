# Geocoding Setup Guide

The court suggestion feature automatically converts addresses to GPS coordinates using geocoding services. This guide explains the available options and how to configure them.

## 🆓 Default Configuration (No Setup Required)

By default, the app uses **Nominatim** (OpenStreetMap's official geocoding service) which is:
- ✅ **Completely FREE** - no API key required
- ✅ **No registration** needed
- ✅ **Perfect integration** with your OpenStreetMap data
- ⚠️ **Rate limited** to 1 request per second (~2,500/day)

**You don't need to do anything!** The court suggestion feature works out of the box.

## 🚀 Optional Paid Services (Better Performance)

For higher volume or better reliability, you can add API keys for these services in your `.env` file:

### LocationIQ (Recommended for Production)
- 🆓 **5,000 free requests/day**
- 💰 **$39/month for 3 million requests** (vs Google's $5 per 1,000!)
- 🎯 **Designed specifically** for OpenStreetMap/Leaflet apps
- 📖 **Sign up**: https://locationiq.com/

```bash
LOCATIONIQ_API_KEY="your_api_key_here"
```

### Geocode.maps.co
- 🆓 **5,000 free requests/day**
- 💰 **Very affordable paid plans**
- 📖 **Sign up**: https://geocode.maps.co/

```bash
GEOCODE_MAPS_API_KEY="your_api_key_here"
```

### OpenCage (Premium Quality)
- 🆓 **2,500 free requests/day**
- 🎯 **High-quality results** (combines multiple sources)
- 📖 **Sign up**: https://opencagedata.com/

```bash
OPENCAGE_API_KEY="your_api_key_here"
```

## 🔄 How It Works

The geocoding service automatically:

1. **Tries providers in order**: Free services first, then paid
2. **Respects rate limits**: Waits between requests to avoid blocking
3. **Fallback support**: If one service fails, tries the next
4. **No vendor lock-in**: Easy to switch providers anytime

## 📊 Provider Comparison

| Provider | Free Requests/Day | Rate Limit | Paid Plans | Data Source |
|----------|-------------------|------------|------------|-------------|
| **Nominatim** | ~2,500 | 1/sec | None | OpenStreetMap |
| **LocationIQ** | 5,000 | 1/sec | $39/month for 3M | OpenStreetMap |
| **Geocode.maps.co** | 5,000 | 1/sec | Very affordable | OpenStreetMap |
| **OpenCage** | 2,500 | 1/sec | Premium plans | Multiple sources |

## 🛠️ Configuration

Add any of these to your `.env` file (all are optional):

```bash
# LocationIQ (recommended for production)
LOCATIONIQ_API_KEY="pk.your_actual_api_key_here"

# Geocode.maps.co (good free alternative)
GEOCODE_MAPS_API_KEY="your_api_key_here"

# OpenCage (premium quality)
OPENCAGE_API_KEY="your_api_key_here"
```

## 🚨 Migration from Google Maps

If you were using Google Maps Geocoding API before, you can simply:

1. **Remove** `GOOGLE_MAPS_API_KEY` from your environment
2. **That's it!** The app now uses free OpenStreetMap geocoding

Your existing court suggestions will continue to work perfectly.

## 🔍 Testing

To test geocoding in development:

```bash
# Start your development server
npm run dev

# Try suggesting a new court - the geocoding happens automatically
# Check the console logs to see which provider was used
```

## 💡 Pro Tips

1. **Start with free**: Nominatim is perfect for most use cases
2. **Add LocationIQ** if you need higher volume or better reliability
3. **Monitor usage**: Check your API dashboards to track request volume
4. **Cache results**: The app automatically stores coordinates, reducing API calls
5. **Test addresses**: Try various address formats to ensure good coverage

## ❓ Troubleshooting

**Geocoding not working?**
- Check your `.env` file syntax
- Verify API keys are correct
- Check console logs for error messages
- Try a simpler address format

**Rate limit errors?**
- The app automatically handles rate limiting
- Add a paid service for higher limits
- Check your API usage on provider dashboards

**Poor geocoding results?**
- OpenStreetMap coverage varies by region
- Consider adding OpenCage for better accuracy
- Use full addresses with city, state, zip code
