import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type PhotoUploadProps = {
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  className?: string;
  initialPhotos?: string[];
  onPhotoClick?: (photoUrl: string, index: number) => void;
};

export default function PhotoUpload({ onPhotosChange, maxPhotos = 5, className = '', initialPhotos = [], onPhotoClick }: PhotoUploadProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setUploadedPhotos(initialPhotos);
  }, [initialPhotos]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedPhotos.length + acceptedFiles.length > maxPhotos) {
      // eslint-disable-next-line no-alert
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { urls } = await response.json();
      const newPhotos = [...uploadedPhotos, ...urls];
      setUploadedPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } catch (error) {
      console.error('Upload error:', error);
      // eslint-disable-next-line no-alert
      alert(`Failed to upload photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  }, [uploadedPhotos, maxPhotos, onPhotosChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
  });

  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {isUploading
          ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2">Uploading...</span>
              </div>
            )
          : (
              <div>
                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">
                  {isDragActive ? 'Drop photos here' : 'Drag & drop photos here, or click to select'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Max
                  {' '}
                  {maxPhotos}
                  {' '}
                  photos, 5MB each
                </p>
              </div>
            )}
      </div>

      {uploadedPhotos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {uploadedPhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <button
                onClick={() => onPhotoClick?.(photo, index)}
                className="w-full h-24 block focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`View photo ${index + 1}`}
              >
                <img
                  src={photo}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              </button>
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
