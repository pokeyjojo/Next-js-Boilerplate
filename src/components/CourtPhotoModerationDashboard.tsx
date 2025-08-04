'use client';

import { useCallback, useEffect, useState } from 'react';

type ReportedCourtPhotoRecord = {
  id: string;
  photoUrl: string;
  reportId: string;
  reportReason: string;
  reportedBy: string;
  reportedByUserName: string;
  reportCreatedAt: string;
  uploadedBy: string;
  uploadedByUserName: string;
  caption?: string;
  courtName: string;
  courtAddress: string;
  createdAt: string;
  reportCount?: number;
  allReports?: Array<{
    reportId: string;
    reportReason: string;
    reportedBy: string;
    reportedByUserName: string;
    reportCreatedAt: string;
  }>;
};

export default function CourtPhotoModerationDashboard() {
  const [reportedPhotos, setReportedPhotos] = useState<ReportedCourtPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent'>('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [clearingReports, setClearingReports] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const deletePhoto = async (photoId: string, reason: string) => {
    try {
      setDeleting(photoId);
      const response = await fetch('/api/admin/court-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId, action: 'delete_photo', reason }),
      });

      if (response.ok) {
        // Remove the deleted photo from the list
        setReportedPhotos(prev => prev.filter(photo => photo.id !== photoId));
        setShowSuccessMessage('Photo deleted successfully');
        setTimeout(() => setShowSuccessMessage(null), 3000);
      } else {
        console.error('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeleting(null);
    }
  };

  const dismissReport = async (reportId: string, reason: string) => {
    try {
      setDismissing(reportId);
      const response = await fetch('/api/admin/court-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, action: 'dismiss_report', reason }),
      });

      if (response.ok) {
        // Remove the dismissed report from the list
        setReportedPhotos(prev => prev.filter(photo => photo.reportId !== reportId));
        setShowSuccessMessage('Report dismissed successfully');
        setTimeout(() => setShowSuccessMessage(null), 3000);
      } else {
        console.error('Failed to dismiss report');
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
    } finally {
      setDismissing(null);
    }
  };

  const handleDeleteClick = (photoId: string) => {
    // eslint-disable-next-line no-alert
    const reason = prompt('Enter reason for deletion (optional):');
    if (reason !== null) {
      deletePhoto(photoId, reason);
    }
  };

  const handleDismissClick = (reportId: string) => {
    // eslint-disable-next-line no-alert
    const reason = prompt('Enter reason for dismissal (optional):');
    if (reason !== null) {
      dismissReport(reportId, reason);
    }
  };

  const clearAllReports = async () => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to clear all court photo reports? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingReports(true);
      const response = await fetch('/api/admin/clear-reports', {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowSuccessMessage('All court photo reports cleared successfully');
        setReportedPhotos([]);
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

  const fetchReportedPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/court-photos');
      if (response.ok) {
        const data = await response.json();
        setReportedPhotos(data);
      } else {
        console.error('Failed to fetch reported court photos');
      }
    } catch (error) {
      console.error('Error fetching reported court photos:', error);
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
          Court Photo Management
        </h1>
        <p className="text-gray-600">
          Manage court photos that have been reported by users. You can delete inappropriate photos.
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
          className={`px-4 py-2 rounded-lg font-medium transition-colors shadow ${
            filter === 'all'
              ? 'bg-[#EC0037] text-white'
              : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
          }`}
        >
          All Reports (
          {reportedPhotos.length}
          )
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors shadow ${
            filter === 'recent'
              ? 'bg-[#EC0037] text-white'
              : 'bg-[#00487E] text-white hover:bg-[#69F0FD] hover:text-[#27131D] border border-[#BFC3C7]'
          }`}
        >
          Recent Reports (
          {recentCount}
          )
        </button>
        <button
          onClick={clearAllReports}
          disabled={clearingReports}
          className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#EC0037] text-white hover:bg-[#4A1C23] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {clearingReports ? 'Clearing...' : 'Clear All Reports'}
        </button>
        <button
          onClick={fetchReportedPhotos}
          disabled={loading}
          className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-10 bg-[#69F0FD] text-[#27131D] hover:bg-[#4DADE3] border-2 border-[#002C4D] shadow-lg"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {filteredPhotos.length === 0
        ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === 'all' ? 'No reported court photos' : 'No recent reports'}
              </h3>
              <p className="text-gray-500">
                {filter === 'all'
                  ? 'No court photos have been reported yet.'
                  : 'No court photos have been reported in the last 7 days.'}
              </p>
            </div>
          )
        : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPhotos.map(photo => (
                <div key={photo.reportId} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative">
                    <img
                      src={photo.photoUrl}
                      alt="Reported content"
                      className="w-full h-48 object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 mb-1">{photo.courtName}</h3>
                      <p className="text-sm text-gray-600">{photo.courtAddress}</p>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Uploaded by:</span>
                        <span className="text-sm text-gray-600">{photo.uploadedByUserName}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Reported by:</span>
                        <span className="text-sm text-gray-600">{photo.reportedByUserName}</span>
                      </div>
                      {photo.reportCount && photo.reportCount > 1 && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Total Reports:</span>
                          <span className="text-sm text-red-600 font-semibold">{photo.reportCount}</span>
                        </div>
                      )}
                    </div>

                    {photo.caption && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">{photo.caption}</p>
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

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDismissClick(photo.reportId)}
                        disabled={dismissing === photo.reportId}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {dismissing === photo.reportId ? 'Dismissing...' : 'Dismiss Report'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(photo.id)}
                        disabled={deleting === photo.id}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {deleting === photo.id ? 'Deleting...' : 'Delete Photo'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}
