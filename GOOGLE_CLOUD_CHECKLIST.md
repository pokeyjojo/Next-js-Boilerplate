# Google Cloud Setup Checklist

## ✅ Quick Verification Steps

### 1. Check APIs are Enabled
Go to [Google Cloud Console APIs](https://console.cloud.google.com/apis/library) and verify these are **enabled**:

- ✅ **Geocoding API** 
- ✅ **Places API**
- ✅ **Maps JavaScript API**

### 2. Verify Billing is Set Up
- Go to [Billing](https://console.cloud.google.com/billing)
- ✅ **Billing account must be linked** to your project (even for free tier)
- ✅ **Payment method must be added**

### 3. Check API Key Configuration
Go to [Credentials](https://console.cloud.google.com/apis/credentials):

- ✅ **API key exists**
- ✅ **API key has no domain restrictions** (for testing)
- ✅ **API key can access required APIs**

### 4. Test API Key Directly
Open this URL in your browser (replace YOUR_API_KEY):
```
https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY
```

**Expected successful response:**
```json
{
  "results": [...],
  "status": "OK"
}
```

**Common error responses:**
- `"status": "REQUEST_DENIED"` = API not enabled or billing issues
- `"status": "INVALID_REQUEST"` = Bad API key
- `"status": "OVER_QUERY_LIMIT"` = Quota exceeded

### 5. Environment Variable Check
Verify your `.env.local` file:
```bash
# Should be exactly this format (no quotes, no spaces)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚨 Common Issues

1. **Billing Not Enabled**: Most common issue - Google requires billing even for free tier
2. **Wrong Project**: Make sure APIs are enabled in the same project as your API key
3. **API Restrictions**: Remove all restrictions during testing
4. **Wrong Environment File**: Use `.env.local` not `.env`


