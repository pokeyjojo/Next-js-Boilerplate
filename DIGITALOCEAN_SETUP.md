# DigitalOcean Spaces Setup Guide

This guide explains how to configure DigitalOcean Spaces for image hosting in your tennis court application.

## Prerequisites

1. A DigitalOcean account
2. A DigitalOcean Spaces bucket created
3. API keys for DigitalOcean Spaces

## Step 1: Create a DigitalOcean Spaces Bucket

1. **Log in to DigitalOcean** and navigate to the Spaces section
2. **Create a new Space**:
   - Choose a region close to your users
   - Give it a unique name (e.g., `tennis-courts-images`)
   - Set it to **Public** (so images can be accessed via URLs)
   - Click "Create a Space"

## Step 2: Generate API Keys

1. **Go to API section** in your DigitalOcean dashboard
2. **Generate a new API key**:
   - Click "Generate New Token"
   - Give it a name (e.g., "Tennis Courts App")
   - Select "Write" scope for full access
   - Copy the **Access Key ID** and **Secret Access Key**

## Step 3: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# DigitalOcean Spaces Configuration
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_ACCESS_KEY_ID=your-access-key-id
DO_SPACES_SECRET_ACCESS_KEY=your-secret-access-key
```

### Endpoint URLs by Region:

- **New York**: `https://nyc3.digitaloceanspaces.com`
- **San Francisco**: `https://sfo3.digitaloceanspaces.com`
- **Amsterdam**: `https://ams3.digitaloceanspaces.com`
- **Singapore**: `https://sgp1.digitaloceanspaces.com`
- **London**: `https://lon1.digitaloceanspaces.com`
- **Frankfurt**: `https://fra1.digitaloceanspaces.com`
- **Toronto**: `https://tor1.digitaloceanspaces.com`

Replace `nyc3` with your chosen region.

## Step 4: Configure CORS (Optional)

If you need to upload directly from the browser, configure CORS on your Space:

1. **Go to your Space settings**
2. **Add CORS rule**:
   ```json
   {
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }
   ```

## Step 5: Test the Configuration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test image upload** by uploading a photo through your application

3. **Check the uploaded image** in your DigitalOcean Spaces bucket

## Features

### What's Included:

- **Automatic Image Upload**: Images are uploaded to DigitalOcean Spaces when users submit reviews
- **Public URLs**: Images are accessible via direct URLs
- **Automatic Deletion**: When photos are deleted by admins, they're removed from DigitalOcean Spaces
- **Caching**: Images are cached for 1 year for better performance
- **Unique Filenames**: Each image gets a unique timestamp-based filename

### File Structure:

Images are stored in the following structure:
```
your-bucket/
├── tennis-courts/
│   ├── 1703123456789-abc123def456.jpg
│   ├── 1703123456790-xyz789ghi012.jpg
│   └── ...
```

## Troubleshooting

### Common Issues:

1. **"DigitalOcean Spaces configuration missing"**
   - Check that all environment variables are set correctly
   - Restart your development server after adding environment variables

2. **"Access Denied" errors**
   - Verify your API keys are correct
   - Ensure your Space is set to public
   - Check that your API key has write permissions

3. **Images not displaying**
   - Verify the Space is public
   - Check the image URLs in your browser's developer tools
   - Ensure CORS is configured if uploading from browser

4. **Upload failures**
   - Check file size limits (5MB max)
   - Verify file type is an image
   - Check network connectivity

### Testing Your Setup:

1. **Test the upload endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "files=@test-image.jpg"
   ```

2. **Check the response** for the uploaded image URL

3. **Verify the image** is accessible via the returned URL

## Migration from Cloudinary

If you're migrating from Cloudinary:

1. **Existing images** will continue to work (they're stored as URLs in the database)
2. **New uploads** will go to DigitalOcean Spaces
3. **Deletion** will work for both old Cloudinary and new DigitalOcean Spaces images

## Cost Considerations

- **Storage**: $0.02 per GB per month
- **Bandwidth**: $0.01 per GB for outbound transfer
- **Requests**: $0.005 per 10,000 requests

For a typical tennis court application, costs should be minimal.

## Security Best Practices

1. **Use environment variables** for all sensitive configuration
2. **Limit API key permissions** to only what's necessary
3. **Regularly rotate API keys**
4. **Monitor usage** in your DigitalOcean dashboard
5. **Set up alerts** for unusual activity

## Support

For issues with DigitalOcean Spaces:
- Check the [DigitalOcean Spaces documentation](https://docs.digitalocean.com/products/spaces/)
- Contact DigitalOcean support
- Check your application logs for detailed error messages
