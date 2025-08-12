# 🔒 Production Google Maps Setup

## 🎯 Overview

This app now uses **two separate API keys** for maximum security:

- **🌐 Client-Side Key**: For browser use (Maps, Places autocomplete)
- **🖥️ Server-Side Key**: For backend use (Geocoding API)

## 📋 Setup Steps

### 1. Create Client-Side API Key

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Click on the new key to configure it
4. **Name**: "Client-Side Maps Key"
5. **Application restrictions**: **"HTTP referrers (web sites)"**
6. **Website restrictions**:
   ```
   localhost:3000/*
   your-domain.com/*
   *.your-domain.com/*
   ```
7. **API restrictions**: **"Restrict key"** and enable:
   - ✅ **Maps JavaScript API**
   - ✅ **Places API**

### 2. Create Server-Side API Key

1. Create another API key
2. **Name**: "Server-Side Geocoding Key"
3. **Application restrictions**: **"IP addresses"**
4. **IP addresses**:
   ```
   # For development (REMOVE in production!)
   0.0.0.0/0
   
   # For production (replace with your actual server IPs)
   YOUR_SERVER_IP/32
   YOUR_LOAD_BALANCER_IP/32
   ```
5. **API restrictions**: **"Restrict key"** and enable:
   - ✅ **Geocoding API**

### 3. Environment Variables

Add both keys to your `.env.local`:

```bash
# Client-side key (browser use)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...your-client-key

# Server-side key (backend use)  
GOOGLE_MAPS_SERVER_API_KEY=AIzaSyB...your-server-key
```

### 4. Deployment Configuration

#### **Vercel:**
```bash
# Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel env add GOOGLE_MAPS_SERVER_API_KEY
```

#### **DigitalOcean Apps:**
```yaml
# In your app spec
envs:
  - key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    value: your-client-key
  - key: GOOGLE_MAPS_SERVER_API_KEY
    value: your-server-key
```

#### **Docker:**
```dockerfile
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-client-key
ENV GOOGLE_MAPS_SERVER_API_KEY=your-server-key
```

## 🔍 Testing Production Setup

1. **Test endpoint**: `GET /api/test-geocoding`
2. **Expected response**:
   ```json
   {
     "success": true,
     "serverApiKeyPreview": "AIzaSyB...",
     "clientApiKeyPreview": "AIzaSyD...",
     "results": [...]
   }
   ```

## 🛡️ Security Best Practices

### **API Key Restrictions**

✅ **DO:**
- Use separate keys for client vs server
- Restrict client keys to your domains only
- Restrict server keys to your server IPs only
- Enable only required APIs per key
- Monitor usage in Google Cloud Console

❌ **DON'T:**
- Use unrestricted keys in production
- Share keys between different environments
- Commit API keys to version control
- Use client keys for server-side operations

### **IP Address Configuration**

**Development:**
```
0.0.0.0/0  # Allows all IPs (development only!)
```

**Production:**
```
203.0.113.1/32     # Your server IP
203.0.113.0/24     # Your server subnet
10.0.1.0/24        # Your private network
```

### **Domain Configuration**

**Development:**
```
localhost:3000/*
127.0.0.1:3000/*
```

**Production:**
```
your-domain.com/*
*.your-domain.com/*
www.your-domain.com/*
```

## 📊 Monitoring

Monitor your API usage at:
- [Google Cloud Console - APIs](https://console.cloud.google.com/apis/dashboard)
- [Google Cloud Console - Billing](https://console.cloud.google.com/billing)

Set up billing alerts to avoid unexpected charges!

## 🚨 Emergency Procedures

**If API key is compromised:**
1. **Immediately** delete the compromised key in Google Cloud Console
2. Generate a new key with proper restrictions
3. Update environment variables in all deployments
4. Monitor usage for any abuse

**If hitting quotas:**
1. Check [Google Cloud Console - Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. Request quota increases if needed
3. Implement caching to reduce API calls
4. Consider upgrading your billing plan

