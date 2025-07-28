'use client';

import { useCallback, useEffect, useState } from 'react';

type ReportedPhotoRecord = {
  id: string;
  photoUrl: string;
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
  courtName: string;
  courtAddress: string;
  createdAt: string;
};

export default function PhotoModerationDashboard() {
  const [reportedPhotos, setReportedPhotos] = useState<ReportedPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent'>('all');

  const deletePhoto = async (photoId: string, reason: string) => {
    try {
      setDeleting(photoId);
      const response = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId, reason }),
      });

      if (response.ok) {
        // Remove the deleted photo from the list
        setReportedPhotos(prev => prev.filter(photo => photo.id !== photoId));
      } else {
        console.error('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteClick = (photoId: string) => {
    // eslint-disable-next-line no-alert
    const reason = prompt('Enter reason for deletion (optional):');
    if (reason !== null) {
      deletePhoto(photoId, reason);
    }
  };

  const fetchReportedPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/photos');
      if (response.ok) {
        const data = await response.json();
        setReportedPhotos(data);
      } else {
        console.error('Failed to fetch reported photos');
      }
    } catch (error) {
      console.error('Error fetching reported photos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportedPhotos();
  }, [fetchReportedPhotos]);

  const filteredPhotos = reportedPhotos.filter((photo) => {
    if (filter === 'recent') {
      const reportDate = new Date(photo.reportCreatedAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return reportDate >= oneWeekAgo;
    }
    return true;
  });

  const recentCount = reportedPhotos.filter((photo) => {
    const reportDate = new Date(photo.reportCreatedAt);
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
          Reported Content Management
        </h1>
        <p className="text-gray-600">
          Manage photos from reviews that have been reported by users. You can delete inappropriate photos.
        </p>
      </div>

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
          {reportedPhotos.length}
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
      </div>

      {filteredPhotos.length === 0
        ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No reported content' : 'No recent reports'}
              </h3>
              <p className="text-gray-500">
                {filter === 'all'
                  ? 'No reviews have been reported yet.'
                  : 'No reviews have been reported in the last 7 days.'}
              </p>
            </div>
          )
        : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPhotos.map(photo => (
                <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative">
                    <img
                      src={photo.photoUrl}
                      alt="Reported content"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                      Reported
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 mb-1">{photo.courtName}</h3>
                      <p className="text-sm text-gray-600">{photo.courtAddress}</p>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Review by:</span>
                        <span className="text-sm text-gray-600">{photo.reviewUserName}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Rating:</span>
                        <span className="text-sm text-gray-600">
                          {photo.reviewRating}
                          /5
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Reported by:</span>
                        <span className="text-sm text-gray-600">{photo.reportedByUserName}</span>
                      </div>
                    </div>

                    {photo.reviewText && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">{photo.reviewText}</p>
                      </div>
                    )}

                    <div className="mb-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">Report Reason:</p>
                      <p className="text-sm text-red-700">{photo.reportReason}</p>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      Reported on:
                      {' '}
                      {new Date(photo.reportCreatedAt).toLocaleDateString()}
                    </div>

                    <button
                      onClick={() => handleDeleteClick(photo.id)}
                      disabled={deleting === photo.id}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deleting === photo.id ? 'Deleting...' : 'Delete Photo'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}
