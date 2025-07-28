import type { Buffer } from 'node:buffer';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Function to get DigitalOcean Spaces configuration
const getSpacesConfig = () => {
  const spacesEndpoint = process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
  const bucketName = process.env.DO_SPACES_BUCKET || 'your-bucket-name';
  const accessKeyId = process.env.DO_SPACES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.DO_SPACES_SECRET_ACCESS_KEY;

  return {
    spacesEndpoint,
    bucketName,
    accessKeyId,
    secretAccessKey,
  };
};

// Function to create S3 client
const createS3Client = () => {
  const config = getSpacesConfig();

  return new S3Client({
    endpoint: config.spacesEndpoint,
    region: 'us-east-1', // DigitalOcean Spaces uses us-east-1 regardless of actual region
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  });
};

export const uploadImage = async (file: Buffer, folder: string = 'tennis-courts'): Promise<string> => {
  const config = getSpacesConfig();

  // Check if DigitalOcean Spaces is configured
  if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    throw new Error('DigitalOcean Spaces configuration missing');
  }

  const s3Client = createS3Client();

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = 'jpg'; // We'll convert all images to JPEG
  const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

  // Upload file to DigitalOcean Spaces
  const uploadCommand = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: fileName,
    Body: file,
    ContentType: 'image/jpeg',
    ACL: 'public-read', // Make the file publicly accessible
    CacheControl: 'max-age=31536000', // Cache for 1 year
  });

  try {
    await s3Client.send(uploadCommand);

    // Return the public URL
    const publicUrl = `${config.spacesEndpoint}/${config.bucketName}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('DigitalOcean Spaces upload error:', error);
    throw error;
  }
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  const config = getSpacesConfig();
  const s3Client = createS3Client();

  try {
    // Extract the key from the URL
    const urlParts = imageUrl.replace(`${config.spacesEndpoint}/${config.bucketName}/`, '');
    const key = decodeURIComponent(urlParts);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await s3Client.send(deleteCommand);
  } catch (error) {
    console.error('DigitalOcean Spaces delete error:', error);
    throw error;
  }
};

export const deletePhotosFromUrls = async (photoUrls: string[]): Promise<void> => {
  for (const photoUrl of photoUrls) {
    try {
      await deleteImage(photoUrl);
    } catch (error) {
      console.error(`Error deleting photo ${photoUrl}:`, error);
      // Continue with other photos even if one fails
    }
  }
};

// Optional: Generate presigned URLs for private files (if needed in the future)
export const generatePresignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const config = getSpacesConfig();
  const s3Client = createS3Client();

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};
