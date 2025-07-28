'use client';

import { useCallback, useEffect, useState } from 'react';

type ReportedReviewRecord = {
  reportId: string;
  reportReason: string;
  reportedBy: string;
  reportedByUserName: string;
  reportCreatedAt: string;
  reviewId: string;
  reviewText: string;
  reviewRating: number;
  reviewUserId: string;
  reviewUserName: string;
  reviewPhotos: string[];
  reviewCreatedAt: string;
  courtName: string;
  courtAddress: string;
};

export default function ReportModerationDashboard() {
  const [reportedReviews, setReportedReviews] = useState<ReportedReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent'>('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [clearingReports, setClearingReports] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const resolveReport = async (reportId: string, action: 'dismiss' | 'delete_review', resolutionNote?: string) => {
    try {
      setResolving(reportId);
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          action,
          resolutionNote,
          deleteReview: action === 'delete_review',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowSuccessMessage(data.message);
        // Remove the resolved report from the list
        setReportedReviews(prev => prev.filter(report => report.reportId !== reportId));

        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccessMessage(null), 3000);
      } else {
        console.error('Failed to resolve report');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
    } finally {
      setResolving(null);
    }
  };

  const handleDismiss = (reportId: string) => {
    const resolutionNote = prompt('Enter reason for dismissal (optional):');
    if (resolutionNote !== null) {
      resolveReport(reportId, 'dismiss', resolutionNote);
    }
  };

  const handleDeleteReview = (reportId: string) => {
    const resolutionNote = prompt('Enter reason for deletion (optional):');
    if (resolutionNote !== null) {
      resolveReport(reportId, 'delete_review', resolutionNote);
    }
  };

  const clearAllReports = async () => {
    if (!confirm('Are you sure you want to clear all reports? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingReports(true);
      const response = await fetch('/api/admin/clear-reports', {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowSuccessMessage('All reports cleared successfully');
        setReportedReviews([]);
        setTimeout(() => setShowSuccessMessage(null), 3000);
      } else {
        console.error('Failed to clear reports');
      }
    } catch (error) {
      console.error('Error clearing reports:', error);
    } finally {
      setClearingReports(false);
    }
  };

  const openImageViewer = (images: string[], startIndex: number = 0) => {
    setImageViewerImages(images);
    setImageViewerIndex(startIndex);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageViewerImages([]);
    setImageViewerIndex(0);
  };

  const nextImage = () => {
    setImageViewerIndex(prev => (prev + 1) % imageViewerImages.length);
  };

  const prevImage = () => {
    setImageViewerIndex(prev => (prev - 1 + imageViewerImages.length) % imageViewerImages.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!imageViewerOpen) {
      return;
    }

    switch (e.key) {
      case 'Escape':
        closeImageViewer();
        break;
      case 'ArrowLeft':
        if (imageViewerImages.length > 1) {
          prevImage();
        }
        break;
      case 'ArrowRight':
        if (imageViewerImages.length > 1) {
          nextImage();
        }
        break;
    }
  };

  const fetchReportedReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reports');
      if (response.ok) {
        const data = await response.json();
        setReportedReviews(data);
      } else {
        console.error('Failed to fetch reported reviews');
      }
    } catch (error) {
      console.error('Error fetching reported reviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportedReviews();
  }, [fetchReportedReviews]);

  useEffect(() => {
    if (imageViewerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [imageViewerOpen, imageViewerImages.length]);

  const filteredReviews = reportedReviews.filter((review) => {
    if (filter === 'recent') {
      const reportDate = new Date(review.reportCreatedAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return reportDate >= oneWeekAgo;
    }
    return true;
  });

  const recentCount = reportedReviews.filter((review) => {
    const reportDate = new Date(review.reportCreatedAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return reportDate >= oneWeekAgo;
  }).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reported Reviews Management
        </h1>
        <p className="text-gray-600">
          Manage reviews that have been reported by users. You can dismiss reports or delete inappropriate reviews.
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{showSuccessMessage}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Reports (
          {reportedReviews.length}
          )
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'recent'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Recent Reports (
          {recentCount}
          )
        </button>
        <button
          onClick={clearAllReports}
          disabled={clearingReports}
          className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearingReports ? 'Clearing...' : 'Clear All Reports'}
        </button>
        <button
          onClick={fetchReportedReviews}
          disabled={loading}
          className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: '2px solid #047857',
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {filter === 'all' ? 'No reported reviews' : 'No recent reports'}
          </h3>
          <p className="text-gray-500">
            {filter === 'all'
              ? 'No reviews have been reported yet.'
              : 'No reviews have been reported in the last 7 days.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map(review => (
            <div key={review.reportId} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Review Photos */}
              {review.reviewPhotos.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => openImageViewer(review.reviewPhotos, 0)}
                    className="w-full h-48 block focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="View review images"
                  >
                    <img
                      src={review.reviewPhotos[0]}
                      alt="Review content"
                      className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                    />
                  </button>
                  {review.reviewPhotos.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      +
                      {review.reviewPhotos.length - 1}
                      {' '}
                      more
                    </div>
                  )}
                </div>
              )}

              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-1">{review.courtName}</h3>
                  <p className="text-sm text-gray-600">{review.courtAddress}</p>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Review by:</span>
                    <span className="text-sm text-gray-600">{review.reviewUserName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Rating:</span>
                    <span className="text-sm text-gray-600">
                      {review.reviewRating}
                      /5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Reported by:</span>
                    <span className="text-sm text-gray-600">{review.reportedByUserName}</span>
                  </div>
                </div>

                {review.reviewText && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Review Content:</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{review.reviewText}</p>
                  </div>
                )}

                <div className="mb-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Report Reason:</p>
                  <p className="text-sm text-red-700">{review.reportReason}</p>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  <div>
                    Review posted:
                    {new Date(review.reviewCreatedAt).toLocaleDateString()}
                  </div>
                  <div>
                    Reported on:
                    {new Date(review.reportCreatedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismiss(review.reportId)}
                    disabled={resolving === review.reportId}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === review.reportId ? 'Processing...' : 'Dismiss Report'}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.reportId)}
                    disabled={resolving === review.reportId}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resolving === review.reportId ? 'Processing...' : 'Delete Review'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-Screen Image Viewer */}
      {imageViewerOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeImageViewer}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>

            {/* Previous button */}
            {imageViewerImages.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
              >
                ‹
              </button>
            )}

            {/* Next button */}
            {imageViewerImages.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
              >
                ›
              </button>
            )}

            {/* Image counter */}
            {imageViewerImages.length > 1 && (
              <div className="absolute top-4 left-4 z-10 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm">
                {imageViewerIndex + 1}
                {' '}
                /
                {imageViewerImages.length}
              </div>
            )}

            {/* Main image */}
            <img
              src={imageViewerImages[imageViewerIndex]}
              alt={`Review ${imageViewerIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
