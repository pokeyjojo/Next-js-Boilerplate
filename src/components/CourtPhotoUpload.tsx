import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type CourtPhotoUploadProps = {
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  className?: string;
  initialPhotos?: string[];
  onPhotoClick?: (photoUrl: string, index: number) => void;
  courtId: string;
};

export default function CourtPhotoUpload({
  onPhotosChange,
  maxPhotos = 10,
  className = '',
  initialPhotos = [],
  onPhotoClick,
  courtId: _courtId,
}: CourtPhotoUploadProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);

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
          isDragActive ? 'border-[#69F0FD] bg-[#00487E]' : 'border-[#BFC3C7] hover:border-[#69F0FD] bg-[#011B2E]'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {isUploading
          ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#69F0FD] mr-2"></div>
                <span className="text-[#BFC3C7]">Uploading...</span>
              </div>
            )
          : (
              <div>
                <p className="text-[#BFC3C7] mb-1">
                  {isDragActive ? 'Drop photos here' : 'Drag & drop photos here, or click to select'}
                </p>
                <p className="text-sm text-[#7F8B95]">
                  Maximum
                  {' '}
                  {maxPhotos}
                  {' '}
                  photos, 5MB each
                </p>
              </div>
            )}
      </div>

      {uploadedPhotos.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-white mb-2">Uploaded Photos:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uploadedPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <button
                  type="button"
                  className="w-full h-24 overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => onPhotoClick?.(photo, index)}
                  aria-label={`View photo ${index + 1}`}
                >
                  <img
                    src={photo}
                    alt={`${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
