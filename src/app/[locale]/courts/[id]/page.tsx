'use client';

import { useUser } from '@clerk/nextjs';
import { Building, Camera, Clock, Globe, Lightbulb, MapPin, Star, Trash2, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import AdminCourtEdit from '@/components/AdminCourtEdit';
import CourtEditSuggestion from '@/components/CourtEditSuggestion';
import CourtEditSuggestionReview from '@/components/CourtEditSuggestionReview';
import CourtPhotoGallery from '@/components/CourtPhotoGallery';
import CourtPhotoUpload from '@/components/CourtPhotoUpload';
import { useUserBanStatus } from '@/hooks/useUserBanStatus';

type TennisCourt = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  numberOfCourts: number;
  surfaceType: string;
  courtCondition?: string;
  isIndoor: boolean;
  isLighted: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

type Review = {
  id: string;
  courtId: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
};

type CourtPhoto = {
  id: string;
  photoUrl: string;
  uploadedBy: string;
  uploadedByUserName: string;
  caption?: string;
  createdAt: string;
};

export default function CourtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id as string;
  const [court, setCourt] = useState<TennisCourt | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<CourtPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'photos'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userSuggestionsRefreshKey, setUserSuggestionsRefreshKey] = useState(0);
  const { isSignedIn, user } = useUser();
  const { isBanned } = useUserBanStatus();

  // Lazy loading states
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isSignedIn) {
        try {
          const response = await fetch('/api/admin/check');
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };

    checkAdminStatus();
  }, [isSignedIn]);

  // Function to refresh court data
  const refreshCourtData = useCallback(async () => {
    try {
      const response = await fetch(`/en/api/tennis-courts/${courtId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch court data');
      }
      const data = await response.json();
      setCourt(data);
    } catch (err) {
      console.error('Error refreshing court data:', err);
    }
  }, [courtId]);

  // Function to refresh user suggestions
  const refreshUserSuggestions = useCallback(() => {
    setUserSuggestionsRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchCourtData = async () => {
      try {
        const response = await fetch(`/en/api/tennis-courts/${courtId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch court data');
        }
        const data = await response.json();
        setCourt(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (courtId) {
      fetchCourtData();
    }
  }, [courtId]);

  // Lazy load reviews when tab is first accessed
  const fetchReviews = useCallback(async () => {
    if (reviewsLoaded || loadingReviews) {
      return;
    }

    setLoadingReviews(true);
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/reviews`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setReviews(
        Array.isArray(data)
          ? data.map((r: any) => ({
              id: r.id,
              courtId: r.courtId,
              rating: r.rating,
              comment: r.text,
              author: r.userName,
              createdAt: r.createdAt,
            }))
          : [],
      );
      setReviewsLoaded(true);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [courtId, reviewsLoaded, loadingReviews]);

  // Lazy load photos when tab is first accessed
  const fetchPhotos = useCallback(async () => {
    if (photosLoaded || loadingPhotos) {
      return;
    }

    setLoadingPhotos(true);
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/photos`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      const data = await response.json();
      setPhotos(Array.isArray(data) ? data : []);
      setPhotosLoaded(true);
    } catch {
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }, [courtId, photosLoaded, loadingPhotos]);

  // Fetch data when tabs are accessed
  useEffect(() => {
    if (activeTab === 'reviews' && courtId) {
      fetchReviews();
    } else if (activeTab === 'photos' && courtId) {
      fetchPhotos();
    }
  }, [activeTab, courtId, fetchReviews, fetchPhotos]);

  // Refresh reviews after submitting a new review
  useEffect(() => {
    if (submitting === false && reviewsLoaded) {
      setReviewsLoaded(false); // Force reload
      if (activeTab === 'reviews') {
        fetchReviews();
      }
    }
  }, [submitting, reviewsLoaded, activeTab, fetchReviews]);

  let averageRating = 0;
  if (reviews.length > 0) {
    averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }

  useEffect(() => {
    if (activeTab === 'reviews') {
      console.warn('DEBUG: Rendering Reviews tab', { averageRating, reviewsLength: reviews.length });
    }
  }, [activeTab, averageRating, reviews.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#002C4D]">
        <div className="text-lg text-[#BFC3C7]">Loading court details...</div>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#002C4D]">
        <div className="text-[#EC0037] text-lg">
          Error:
          {error || 'Court not found'}
        </div>
      </div>
    );
  }

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewText) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tennis-courts/${courtId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, text: reviewText }),
      });
      if (!res.ok) {
        throw new Error('Failed to submit review');
      }
      setShowReviewModal(false);
      setReviewText('');
      setReviewRating(0);
    } catch {
      // Optionally show error
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPhotos = async () => {
    if (selectedPhotos.length === 0) {
      return;
    }
    setUploadingPhotos(true);
    try {
      for (const photoUrl of selectedPhotos) {
        const res = await fetch(`/api/tennis-courts/${courtId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl, caption: photoCaption }),
        });
        if (!res.ok) {
          throw new Error('Failed to submit photo');
        }
      }
      setShowPhotoUploadModal(false);
      setSelectedPhotos([]);
      setPhotoCaption('');
      // Refresh photos
      const response = await fetch(`/api/tennis-courts/${courtId}/photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error submitting photos:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to submit photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const res = await fetch(`/api/tennis-courts/${courtId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        setPhotos(photos.filter(photo => photo.id !== photoId));
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handlePhotoEdit = async (photoId: string, caption: string) => {
    try {
      const res = await fetch(`/api/tennis-courts/${courtId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, caption }),
      });
      if (res.ok) {
        setPhotos(photos.map(photo =>
          photo.id === photoId ? { ...photo, caption } : photo,
        ));
      }
    } catch (error) {
      console.error('Error editing photo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#002C4D]">
      {/* Header */}
      <div className="bg-[#011B2E] shadow-sm border-b border-[#BFC3C7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{court.name}</h1>
              <div className="flex items-center text-[#BFC3C7] mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>
                  {court.address}
                  ,
                  {' '}
                  {court.city}
                </span>
              </div>
              {isSignedIn && (
                <div className="flex items-center space-x-3 mb-4">
                  <CourtEditSuggestion
                    court={court}
                    userId={user?.id}
                    isBanned={isBanned}
                    onSuggestionSubmitted={refreshCourtData}
                    onSuggestionCreated={refreshUserSuggestions}
                    refreshKey={userSuggestionsRefreshKey}
                  />
                  {isAdmin && (
                    <>
                      <AdminCourtEdit
                        court={court}
                        onCourtUpdated={(updatedCourt) => {
                          // Merge the updated fields with the existing court data
                          setCourt(prev => prev
                            ? {
                                ...prev,
                                name: updatedCourt.name,
                                address: updatedCourt.address,
                                city: updatedCourt.city,
                                numberOfCourts: updatedCourt.numberOfCourts,
                                surfaceType: updatedCourt.surfaceType,
                              }
                            : null);
                        }}
                      />
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#EC0037] text-white rounded-lg hover:bg-[#4A1C23] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Court</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-[#69F0FD] mr-1" />
                  <span className="font-semibold text-white">{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
                  <span className="text-[#BFC3C7] ml-1">
                    (
                    {reviews.length}
                    {' '}
                    reviews)
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-[#BFC3C7] mr-1" />
                  <span className="text-[#BFC3C7]">{court.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <div className="flex items-center">
                  <Camera className="w-4 h-4 text-[#BFC3C7] mr-1" />
                  <span className="text-[#BFC3C7]">
                    {photos.length}
                    {' '}
                    photos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#011B2E] border-b border-[#BFC3C7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#69F0FD] text-[#69F0FD]'
                  : 'border-transparent text-[#BFC3C7] hover:text-white hover:border-[#BFC3C7]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'photos'
                  ? 'border-[#69F0FD] text-[#69F0FD]'
                  : 'border-transparent text-[#BFC3C7] hover:text-white hover:border-[#BFC3C7]'
              }`}
            >
              Photos (
              {photos.length}
              )
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reviews'
                  ? 'border-[#69F0FD] text-[#69F0FD]'
                  : 'border-transparent text-[#BFC3C7] hover:text-white hover:border-[#BFC3C7]'
              }`}
            >
              Reviews (
              {reviews.length}
              )
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-[#011B2E] rounded-lg shadow-sm border border-[#BFC3C7] p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-white">About this location</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-[#69F0FD] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Facility Type</p>
                      <p className="text-[#BFC3C7]">
                        {court.isIndoor
                          ? 'Indoor Tennis Facility'
                          : 'Outdoor Tennis Courts'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-[#69F0FD] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Access</p>
                      <p className="text-[#BFC3C7]">
                        {court.isPublic
                          ? 'Public - Open to everyone'
                          : 'Private - Membership required'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-[#69F0FD] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Number of Courts</p>
                      <p className="text-[#BFC3C7]">
                        {court.numberOfCourts}
                        {' '}
                        court
                        {court.numberOfCourts !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Globe className="w-5 h-5 text-[#69F0FD] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Surface Type</p>
                      <p className="text-[#BFC3C7]">{court.surfaceType}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-[#69F0FD] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Lighting</p>
                      <p className="text-[#BFC3C7]">
                        {court.isLighted
                          ? 'Available for evening play'
                          : 'Daytime play only'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-[#011B2E] rounded-lg shadow-sm border border-[#BFC3C7] p-6">
                <h2 className="text-xl font-semibold mb-4 text-white">Location</h2>
                <div className="h-64 bg-[#00487E] rounded-lg flex items-center justify-center border border-[#BFC3C7]">
                  <p className="text-[#BFC3C7]">Map will be displayed here</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-[#011B2E] rounded-lg shadow-sm border border-[#BFC3C7] p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#BFC3C7]">Rating</span>
                    <span className="font-medium text-white">
                      {averageRating ? averageRating.toFixed(1) : '0.0'}
                      /5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#BFC3C7]">Reviews</span>
                    <span className="font-medium text-white">{reviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#BFC3C7]">Photos</span>
                    <span className="font-medium text-white">{photos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#BFC3C7]">Courts</span>
                    <span className="font-medium text-white">{court.numberOfCourts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#BFC3C7]">Surface</span>
                    <span className="font-medium text-white">{court.surfaceType}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-[#011B2E] rounded-lg shadow-sm border border-[#BFC3C7] p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[#BFC3C7] text-sm">Address</p>
                    <p className="font-medium text-white">{court.address}</p>
                    <p className="font-medium text-white">{court.city}</p>
                  </div>
                </div>
              </div>

              {/* Edit Suggestions */}
              {isSignedIn && (
                <div className="bg-[#011B2E] rounded-lg shadow-sm border border-[#BFC3C7] p-6">
                  <CourtEditSuggestionReview
                    courtId={courtId}
                    currentUserId={user?.id || ''}
                  />
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'photos' ? (
          /* Photos Tab */
          <div className="bg-[#011B2E] rounded-lg shadow-sm border border-[#BFC3C7]">
            <div className="p-6 border-b border-[#BFC3C7]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Photos</h2>
                {isSignedIn && !isBanned && (
                  <button
                    className="bg-[#EC0037] text-white px-4 py-2 rounded-lg hover:bg-[#4A1C23] transition-colors"
                    onClick={() => setShowPhotoUploadModal(true)}
                  >
                    Add Photos
                  </button>
                )}
                {isSignedIn && isBanned && (
                  <div className="text-[#EC0037] text-sm">
                    You are banned from submitting content
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <CourtPhotoGallery
                photos={photos}
                courtId={courtId}
                onPhotoDelete={handlePhotoDelete}
                onPhotoEdit={handlePhotoEdit}
                isAdmin={isAdmin}
                currentUserId={user?.id}
              />
            </div>
            {/* Photo Upload Modal */}
            {showPhotoUploadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-[#002C4D] rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-[#BFC3C7]">
                  <button
                    className="absolute top-2 right-2 text-[#BFC3C7] hover:text-white transition-colors"
                    onClick={() => setShowPhotoUploadModal(false)}
                  >
                    &times;
                  </button>
                  <h3 className="text-lg font-bold mb-4 text-white">Add Photos</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white mb-2">
                      Photo Caption (optional)
                    </label>
                    <textarea
                      className="w-full border border-[#BFC3C7] rounded-lg p-2 bg-[#00487E] text-white placeholder-[#7F8B95] focus:outline-none focus:border-2 focus:border-[#69F0FD] focus:shadow-[0_0_15px_rgba(105,240,253,0.6),0_0_0_2px_#69F0FD] transition-all"
                      placeholder="Add a caption for your photos..."
                      value={photoCaption}
                      onChange={e => setPhotoCaption(e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                  </div>

                  <CourtPhotoUpload
                    onPhotosChange={setSelectedPhotos}
                    maxPhotos={10}
                    className="mb-4"
                    courtId={courtId}
                  />

                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-4 py-2 bg-[#00487E] text-white rounded-lg font-semibold hover:bg-[#69F0FD] hover:text-[#27131D] transition-colors border border-[#BFC3C7]"
                      onClick={() => setShowPhotoUploadModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-[#EC0037] text-white rounded-lg font-semibold hover:bg-[#4A1C23] disabled:opacity-60 transition-colors"
                      onClick={handleSubmitPhotos}
                      disabled={uploadingPhotos || selectedPhotos.length === 0}
                    >
                      {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Reviews Tab */
          <div className="bg-[#011B2E] rounded-lg shadow-sm border border-[#BFC3C7]">
            <div className="p-6 border-b border-[#BFC3C7]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Reviews</h2>
                {isSignedIn && !isBanned && (
                  <button
                    className="bg-[#EC0037] text-white px-4 py-2 rounded-lg hover:bg-[#4A1C23] transition-colors"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Write a Review
                  </button>
                )}
                {isSignedIn && isBanned && (
                  <div className="text-[#EC0037] text-sm">
                    You are banned from submitting content
                  </div>
                )}
              </div>
            </div>
            {/* Average Rating Display */}
            <div className="p-6 pt-4 pb-0">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {[...Array.from({ length: 5 })].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-[#69F0FD]' : 'text-[#50394D]'}`}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold text-white">{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
                <span className="text-[#BFC3C7] text-lg">/ 5</span>
                <span className="text-[#BFC3C7] ml-2">
                  (
                  {reviews.length}
                  {' '}
                  review
                  {reviews.length !== 1 ? 's' : ''}
                  )
                </span>
              </div>
            </div>
            <div className="p-6">
              {reviews.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[#BFC3C7]">No reviews yet. Be the first to review this court!</p>
                </div>
              )}
              {reviews.length > 0 && (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-[#BFC3C7] pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex items-center mr-3">
                            {[...Array.from({ length: 5 })].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-[#69F0FD]' : 'text-[#50394D]'}`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-white">{review.author}</span>
                        </div>
                        <span className="text-sm text-[#BFC3C7]">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[#BFC3C7]">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Review Modal */}
            {showReviewModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-[#002C4D] rounded-lg shadow-lg p-6 w-full max-w-md relative border border-[#BFC3C7]">
                  <button
                    className="absolute top-2 right-2 text-[#BFC3C7] hover:text-white transition-colors"
                    onClick={() => setShowReviewModal(false)}
                  >
                    &times;
                  </button>
                  <h3 className="text-lg font-bold mb-4 text-white">Leave a Review</h3>
                  <div className="mb-4 flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`text-2xl ${reviewRating >= star ? 'text-[#69F0FD]' : 'text-[#50394D]'} hover:text-[#69F0FD] transition-colors`}
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        disabled={submitting}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full border border-[#BFC3C7] rounded-lg p-2 mb-4 min-h-[80px] bg-[#00487E] text-white placeholder-[#7F8B95] focus:outline-none focus:border-2 focus:border-[#69F0FD] focus:shadow-[0_0_15px_rgba(105,240,253,0.6),0_0_0_2px_#69F0FD] transition-all"
                    placeholder="Share your experience..."
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    maxLength={2000}
                    disabled={submitting}
                  />
                  <button
                    className="w-full bg-[#EC0037] text-white py-2 rounded-lg font-semibold hover:bg-[#4A1C23] transition-colors disabled:opacity-60"
                    onClick={handleSubmitReview}
                    disabled={submitting || reviewRating < 1 || !reviewText}
                  >
                    {submitting ? 'Saving...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
