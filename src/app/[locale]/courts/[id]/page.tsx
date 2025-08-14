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
import ReviewStatistics from '@/components/ReviewStatistics';
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
  text?: string | null;
  comment: string;
  author: string;
  userName: string;
  userId: string;
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
              text: r.text,
              comment: r.text,
              author: r.userName,
              userName: r.userName,
              userId: r.userId,
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
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F6]">
        <div className="text-lg text-[#7F8B9F]">Loading court details...</div>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F6]">
        <div className="text-[#7F8B9F] text-lg">
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

  const handleDeleteReview = async (reviewId: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const res = await fetch(`/api/tennis-courts/${courtId}/reviews`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete review');
      }

      // Refresh reviews
      setReviewsLoaded(false);
      if (activeTab === 'reviews') {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to delete review. Please try again.');
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
    <div className="min-h-screen bg-[#F4F5F6]">
      {/* Header */}
      <div className="bg-[#F4F5F6] shadow-sm border-b border-[#BFC37C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{court.name}</h1>
              <div className="flex items-center text-[#7F8B9F] mb-4">
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
                        className="flex items-center space-x-2 px-4 py-2 bg-[#BFC37C] text-[#7F8B9F] rounded-lg transition-colors border border-[#BFC37C]"
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
                  <Star className="w-5 h-5 text-[#7F8B9F] mr-1" />
                  <span className="font-semibold text-[#7F8B9F]">{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
                  <span className="text-[#7F8B9F] ml-1">
                    (
                    {reviews.length}
                    {' '}
                    reviews)
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-[#7F8B9F] mr-1" />
                  <span className="text-[#7F8B9F]">{court.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <div className="flex items-center">
                  <Camera className="w-4 h-4 text-[#7F8B9F] mr-1" />
                  <span className="text-[#7F8B9F]">
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
      <div className="bg-[#F4F5F6] border-b border-[#BFC37C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#BFC37C] text-[#7F8B9F]'
                  : 'border-transparent text-[#7F8B9F]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'photos'
                  ? 'border-[#BFC37C] text-[#7F8B9F]'
                  : 'border-transparent text-[#7F8B9F]'
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
                  ? 'border-[#BFC37C] text-[#7F8B9F]'
                  : 'border-transparent text-[#7F8B9F]'
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
              <div className="bg-[#F4F5F6] rounded-lg shadow-sm border border-[#BFC37C] p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-white">About this location</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-[#7F8B9F] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#7F8B9F]">Facility Type</p>
                      <p className="text-[#7F8B9F]">
                        {court.isIndoor
                          ? 'Indoor Tennis Facility'
                          : 'Outdoor Tennis Courts'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-[#7F8B9F] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#7F8B9F]">Access</p>
                      <p className="text-[#7F8B9F]">
                        {court.isPublic
                          ? 'Public - Open to everyone'
                          : 'Private - Membership required'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-[#7F8B9F] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#7F8B9F]">Number of Courts</p>
                      <p className="text-[#7F8B9F]">
                        {court.numberOfCourts}
                        {' '}
                        court
                        {court.numberOfCourts !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Globe className="w-5 h-5 text-[#7F8B9F] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#7F8B9F]">Surface Type</p>
                      <p className="text-[#7F8B9F]">{court.surfaceType}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-[#7F8B9F] mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#7F8B9F]">Lighting</p>
                      <p className="text-[#7F8B9F]">
                        {court.isLighted
                          ? 'Available for evening play'
                          : 'Daytime play only'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-[#F4F5F6] rounded-lg shadow-sm border border-[#BFC37C] p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#7F8B9F]">Location</h2>
                <div className="h-64 bg-[#F4F5F6] rounded-lg flex items-center justify-center border border-[#BFC37C]">
                  <p className="text-[#7F8B9F]">Map will be displayed here</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-[#F4F5F6] rounded-lg shadow-sm border border-[#BFC37C] p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#7F8B9F]">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#7F8B9F]">Rating</span>
                    <span className="font-medium text-[#7F8B9F]">
                      {averageRating ? averageRating.toFixed(1) : '0.0'}
                      /5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7F8B9F]">Reviews</span>
                    <span className="font-medium text-[#7F8B9F]">{reviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7F8B9F]">Photos</span>
                    <span className="font-medium text-[#7F8B9F]">{photos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7F8B9F]">Courts</span>
                    <span className="font-medium text-[#7F8B9F]">{court.numberOfCourts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7F8B9F]">Surface</span>
                    <span className="font-medium text-[#7F8B9F]">{court.surfaceType}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-[#F4F5F6] rounded-lg shadow-sm border border-[#BFC37C] p-6">
                <h3 className="text-lg font-semibold mb-4 text-[#7F8B9F]">Contact</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[#7F8B9F] text-sm">Address</p>
                    <p className="font-medium text-[#7F8B9F]">{court.address}</p>
                    <p className="font-medium text-[#7F8B9F]">{court.city}</p>
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
          <div className="bg-[#F4F5F6] rounded-lg shadow-sm border border-[#BFC37C]">
            <div className="p-6 border-b border-[#BFC37C]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#7F8B9F]">Photos</h2>
                {isSignedIn && !isBanned && (
                  <button
                    className="bg-[#BFC37C] text-[#7F8B9F] px-4 py-2 rounded-lg transition-colors border border-[#BFC37C]"
                    onClick={() => setShowPhotoUploadModal(true)}
                  >
                    Add Photos
                  </button>
                )}
                {isSignedIn && isBanned && (
                  <div className="text-[#7F8B9F] text-sm">
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
                <div className="bg-[#F4F5F6] rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-[#BFC37C]">
                  <button
                    className="absolute top-2 right-2 text-[#7F8B9F] transition-colors"
                    onClick={() => setShowPhotoUploadModal(false)}
                  >
                    &times;
                  </button>
                  <h3 className="text-lg font-bold mb-4 text-[#7F8B9F]">Add Photos</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#7F8B9F] mb-2">
                      Photo Caption (optional)
                    </label>
                    <textarea
                      className="w-full border border-[#BFC37C] rounded-lg p-2 bg-[#F4F5F6] text-[#7F8B9F] placeholder-[#7F8B9F] focus:outline-none focus:border-2 focus:border-[#011B2E] transition-all"
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
                      className="px-4 py-2 bg-[#F4F5F6] text-[#7F8B9F] rounded-lg font-semibold transition-colors border border-[#BFC37C]"
                      onClick={() => setShowPhotoUploadModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-[#BFC37C] text-[#7F8B9F] rounded-lg font-semibold disabled:opacity-60 transition-colors border border-[#BFC37C]"
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
          <div className="bg-[#F4F5F6] rounded-lg shadow-sm border border-[#BFC37C]">
            <div className="p-6 border-b border-[#BFC37C]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#7F8B9F]">Reviews</h2>
                {isSignedIn && !isBanned && (
                  <button
                    className="bg-[#BFC37C] text-[#7F8B9F] px-4 py-2 rounded-lg transition-colors border border-[#BFC37C]"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Write a Review
                  </button>
                )}
                {isSignedIn && isBanned && (
                  <div className="text-[#7F8B9F] text-sm">
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
                      className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-[#7F8B9F]' : 'text-[#7F8B9F]'}`}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold text-[#7F8B9F]">{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
                <span className="text-[#7F8B9F] text-lg">/ 5</span>
                <span className="text-[#7F8B9F] ml-2">
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
                  <p className="text-[#7F8B9F]">No reviews yet. Be the first to review this court!</p>
                </div>
              )}
              {reviews.length > 0 && (
                <>
                  {/* Review Statistics Graph */}
                  <ReviewStatistics
                    reviews={reviews}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    onDeleteReview={handleDeleteReview}
                  />

                  {/* Text Reviews Section */}
                  <div className="bg-[#F4F5F6] rounded-lg p-4 border border-[#BFC37C]">
                    <h3 className="text-md font-semibold text-[#7F8B9F] mb-3">
                      Written Reviews (
                      {reviews.filter(r => r.text && r.text.trim()).length}
                      )
                    </h3>

                    {reviews.filter(r => r.text && r.text.trim()).length === 0
                      ? (
                          <div className="text-center py-4">
                            <p className="text-[#7F8B9F] text-sm">No written reviews yet. Be the first to share your experience!</p>
                          </div>
                        )
                      : (
                          <div className="space-y-4 max-h-60 overflow-y-auto">
                            {reviews
                              .filter(review => review.text && review.text.trim())
                              .map(review => (
                                <div key={review.id} className="border-b border-[#BFC37C] pb-3 last:border-b-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <div className="flex items-center mr-2">
                                        {[...Array.from({ length: 5 })].map((_, i) => (
                                          <Star
                                            key={`star-${review.id}-${i}`}
                                            className={`w-3 h-3 ${i < review.rating ? 'text-[#7F8B9F] fill-current' : 'text-[#7F8B9F]'}`}
                                          />
                                        ))}
                                      </div>
                                      <span className="font-medium text-[#7F8B9F] text-sm">{review.author}</span>
                                    </div>
                                    <span className="text-xs text-[#7F8B9F]">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-[#7F8B9F] text-sm leading-relaxed whitespace-pre-line">{review.text}</p>
                                </div>
                              ))}
                          </div>
                        )}
                  </div>
                </>
              )}
            </div>
            {/* Review Modal */}
            {showReviewModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-[#F4F5F6] rounded-lg shadow-lg p-6 w-full max-w-md relative border border-[#BFC37C]">
                  <button
                    className="absolute top-2 right-2 text-[#7F8B9F] transition-colors"
                    onClick={() => setShowReviewModal(false)}
                  >
                    &times;
                  </button>
                  <h3 className="text-lg font-bold mb-4 text-[#7F8B9F]">Leave a Review</h3>
                  <div className="mb-4 flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`text-2xl ${reviewRating >= star ? 'text-[#7F8B9F]' : 'text-[#7F8B9F]'} transition-colors`}
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        disabled={submitting}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full border border-[#BFC37C] rounded-lg p-2 mb-4 min-h-[80px] bg-[#F4F5F6] text-[#7F8B9F] placeholder-[#7F8B9F] focus:outline-none focus:border-2 focus:border-[#011B2E] transition-all"
                    placeholder="Share your experience..."
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    maxLength={2000}
                    disabled={submitting}
                  />
                  <button
                    className="w-full bg-[#BFC37C] text-[#7F8B9F] py-2 rounded-lg font-semibold disabled:opacity-60 border border-[#BFC37C]"
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
