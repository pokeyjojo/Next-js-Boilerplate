'use client';

import { useUser } from '@clerk/nextjs';
import { Edit3, Flag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type CourtPhoto = {
  id: string;
  photoUrl: string;
  uploadedBy: string;
  uploadedByUserName: string;
  caption?: string;
  createdAt: string;
};

type CourtPhotoGalleryProps = {
  photos: CourtPhoto[];
  courtId: string;
  onPhotoDelete?: (photoId: string) => void;
  onPhotoEdit?: (photoId: string, caption: string) => void;
  onPhotoReport?: (photoId: string, reason: string) => void;
  isAdmin?: boolean;
  currentUserId?: string;
};

export default function CourtPhotoGallery({
  photos,
  courtId,
  onPhotoDelete,
  onPhotoEdit,
  onPhotoReport: _onPhotoReport,
  isAdmin = false,
  currentUserId,
}: CourtPhotoGalleryProps) {
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerPhotos, setPhotoViewerPhotos] = useState<string[]>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPhotoId, setReportingPhotoId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState('');
  const { isSignedIn } = useUser();

  const openPhotoViewer = (photos: string[], index: number) => {
    setPhotoViewerPhotos(photos);
    setPhotoViewerIndex(index);
    setPhotoViewerOpen(true);
  };

  // Hide/show profile icons when photo viewer opens/closes
  useEffect(() => {
    if (photoViewerOpen) {
      // Hide profile icons
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = 'none';
      });
    } else {
      // Show profile icons again
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    }

    return () => {
      // Show profile icons again on cleanup
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    };
  }, [photoViewerOpen]);

  // Hide/show profile icons when report modal opens/closes
  useEffect(() => {
    if (reportModalOpen) {
      // Hide profile icons
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = 'none';
      });
    } else {
      // Show profile icons again
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    }

    return () => {
      // Show profile icons again on cleanup
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    };
  }, [reportModalOpen]);

  // Hide/show profile icons when edit modal opens/closes
  useEffect(() => {
    if (editingPhotoId) {
      // Hide profile icons
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = 'none';
      });
    } else {
      // Show profile icons again
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    }

    return () => {
      // Show profile icons again on cleanup
      const profileIcons = document.querySelectorAll('.fixed.top-3.right-3, .fixed.top-20.right-4');
      profileIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });
    };
  }, [editingPhotoId]);

  const handleReportPhoto = async () => {
    if (!reportingPhotoId || !reportReason.trim()) {
      return;
    }

    setReportLoading(true);
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/photos/${reportingPhotoId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });

      if (response.ok) {
        setReportModalOpen(false);
        setReportingPhotoId(null);
        setReportReason('');
        // eslint-disable-next-line no-alert
        alert('Photo reported successfully');
      } else {
        const error = await response.json();
        // eslint-disable-next-line no-alert
        alert(`Failed to report photo: ${error.error}`);
      }
    } catch (error) {
      console.error('Error reporting photo:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to report photo');
    } finally {
      setReportLoading(false);
    }
  };

  const handleEditPhoto = async () => {
    if (!editingPhotoId) {
      return;
    }

    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: editingPhotoId, caption: editingCaption }),
      });

      if (response.ok) {
        setEditingPhotoId(null);
        setEditingCaption('');
        onPhotoEdit?.(editingPhotoId, editingCaption);
      } else {
        const error = await response.json();
        // eslint-disable-next-line no-alert
        alert(`Failed to update photo: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating photo:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to update photo');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });

      if (response.ok) {
        onPhotoDelete?.(photoId);
      } else {
        const error = await response.json();
        // eslint-disable-next-line no-alert
        alert(`Failed to delete photo: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to delete photo');
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-white mb-2">No photos yet</h3>
        <p className="text-[#BFC3C7]">Be the first to share photos of this court!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {photos.map((photo, index) => (
          <div key={photo.id} className="bg-[#011B2E] rounded-lg shadow-md overflow-hidden border border-[#BFC3C7]">
            <div className="relative group">
              <button
                type="button"
                className="w-full aspect-[4/3] overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#69F0FD]"
                onClick={() => openPhotoViewer(photos.map(p => p.photoUrl), index)}
                aria-label={`View photo ${index + 1}`}
              >
                <img
                  src={photo.photoUrl}
                  alt={photo.caption || `Court photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Action buttons */}
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {isSignedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      setReportingPhotoId(photo.id);
                      setReportModalOpen(true);
                    }}
                    className="bg-[#EC0037] text-white w-6 h-6 rounded-full hover:bg-[#4A1C23] transition-colors shadow-sm flex items-center justify-center"
                    aria-label="Report photo"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                )}

                {(isAdmin || photo.uploadedBy === currentUserId) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPhotoId(photo.id);
                        setEditingCaption(photo.caption || '');
                      }}
                      className="bg-[#002C4D] text-white w-6 h-6 rounded-full hover:bg-[#00487E] transition-colors shadow-sm flex items-center justify-center"
                      aria-label="Edit photo"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="bg-[#EC0037] text-white w-6 h-6 rounded-full hover:bg-[#4A1C23] transition-colors shadow-sm flex items-center justify-center"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-3">
              {photo.caption && (
                <p className="text-sm text-[#BFC3C7] mb-2">{photo.caption}</p>
              )}
              <div className="flex items-center justify-between text-xs text-[#BFC3C7]">
                <span>
                  By
                  {' '}
                  {photo.uploadedByUserName}
                </span>
                <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Viewer Modal */}
      {photoViewerOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-95">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              type="button"
              onClick={() => setPhotoViewerOpen(false)}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Close photo viewer"
            >
              ×
            </button>

            {/* Photo counter */}
            {photoViewerPhotos.length > 1 && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {photoViewerIndex + 1}
                {' '}
                /
                {photoViewerPhotos.length}
              </div>
            )}

            <img
              src={photoViewerPhotos[photoViewerIndex]}
              alt={`${photoViewerIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {photoViewerPhotos.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                <button
                  type="button"
                  onClick={() => setPhotoViewerIndex(prev => (prev > 0 ? prev - 1 : photoViewerPhotos.length - 1))}
                  className="bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-colors pointer-events-auto"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoViewerIndex(prev => (prev < photoViewerPhotos.length - 1 ? prev + 1 : 0))}
                  className="bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-colors pointer-events-auto"
                  aria-label="Next photo"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-[#002C4D] rounded-lg shadow-lg p-6 w-full max-w-md relative border border-[#BFC3C7]">
            <button
              type="button"
              onClick={() => {
                setReportModalOpen(false);
                setReportingPhotoId(null);
                setReportReason('');
              }}
              className="absolute top-2 right-2 text-[#BFC3C7] hover:text-white transition-colors"
              aria-label="Close report modal"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4 text-white">Report Photo</h3>
            <textarea
              className="w-full bg-[#00487E] text-white placeholder-[#7F8B95] border border-[#BFC3C7] rounded-lg p-2 mb-4 min-h-[80px] focus:outline-none focus:border-2 focus:border-[#69F0FD] focus:shadow-[0_0_15px_rgba(105,240,253,0.6),0_0_0_2px_#69F0FD] transition-all"
              placeholder="Please explain why you're reporting this photo..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  setReportingPhotoId(null);
                  setReportReason('');
                }}
                className="px-4 py-2 bg-[#EBEDEE] text-[#27131D] rounded-lg font-semibold hover:bg-[#BFC3C7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportPhoto}
                disabled={reportLoading || !reportReason.trim()}
                className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] disabled:opacity-50 transition-colors"
              >
                {reportLoading ? 'Reporting...' : 'Report Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPhotoId && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-[#002C4D] rounded-lg shadow-lg p-6 w-full max-w-md relative border border-[#BFC3C7]">
            <button
              type="button"
              onClick={() => {
                setEditingPhotoId(null);
                setEditingCaption('');
              }}
              className="absolute top-2 right-2 text-[#BFC3C7] hover:text-white transition-colors"
              aria-label="Close edit modal"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4 text-white">Edit Photo Caption</h3>
            <textarea
              className="w-full bg-[#00487E] text-white placeholder-[#7F8B95] border border-[#BFC3C7] rounded-lg p-2 mb-4 min-h-[80px] focus:outline-none focus:border-2 focus:border-[#69F0FD] focus:shadow-[0_0_15px_rgba(105,240,253,0.6),0_0_0_2px_#69F0FD] transition-all"
              placeholder="Add a caption for this photo..."
              value={editingCaption}
              onChange={e => setEditingCaption(e.target.value)}
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingPhotoId(null);
                  setEditingCaption('');
                }}
                className="px-4 py-2 bg-[#EBEDEE] text-[#27131D] rounded-lg font-semibold hover:bg-[#BFC3C7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditPhoto}
                className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
