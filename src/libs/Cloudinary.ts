import type { Buffer } from 'node:buffer';
import { v2 as cloudinary } from 'cloudinary';

// Use environment variables directly to avoid deprecated url.parse()
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.config(config);

export default cloudinary;

export const uploadImage = async (file: Buffer, folder: string = 'tennis-courts'): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error('Cloudinary configuration missing'));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      },
    );

    uploadStream.end(file);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, _result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const deletePhotosFromUrls = async (photoUrls: string[]): Promise<void> => {
  for (const photoUrl of photoUrls) {
    try {
      // Extract public ID from Cloudinary URL
      const urlParts = photoUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      if (publicIdWithExtension) {
        const publicId = publicIdWithExtension.split('.')[0];
        const folder = 'tennis-courts';
        const fullPublicId = `${folder}/${publicId}`;

        await deleteImage(fullPublicId);
      }
    } catch (error) {
      console.error(`Error deleting photo ${photoUrl}:`, error);
      // Continue with other photos even if one fails
    }
  }
};
