'use client';

import { useEffect, useState } from 'react';

type PhotoViewerProps = {
  photos: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
};

export default function PhotoViewer({ photos, initialIndex = 0, isOpen, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('photo-viewer-open');

      // Directly hide profile icons
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = 'none';
      });
    } else {
      document.body.classList.remove('photo-viewer-open');

      // Show profile icons again
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    }

    return () => {
      document.body.classList.remove('photo-viewer-open');

      // Show profile icons again on cleanup
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, photos.length]);

  if (!isOpen || photos.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 lg:top-6 lg:right-6 z-10 p-2 lg:p-3 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
        aria-label="Close photo viewer"
      >
        <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 lg:left-6 top-1/2 transform -translate-y-1/2 z-10 p-2 lg:p-3 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
            aria-label="Previous photo"
          >
            <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 lg:right-6 top-1/2 transform -translate-y-1/2 z-10 p-2 lg:p-3 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
            aria-label="Next photo"
          >
            <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Photo counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-4 lg:top-6 lg:left-6 z-10 text-white text-sm lg:text-lg font-semibold bg-black bg-opacity-50 px-2 py-1 lg:px-3 lg:py-2 rounded-lg">
          {currentIndex + 1}
          {' '}
          /
          {photos.length}
        </div>
      )}

      {/* Main image */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img
          src={photos[currentIndex]}
          alt={`${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Click outside to close */}
      <button
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close photo viewer"
        type="button"
      />
    </div>
  );
}
