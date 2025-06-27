'use client';

import { Building, Clock, Globe, Lightbulb, MapPin, Star, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type TennisCourt = {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  numberOfCourts: number;
  surfaceType: string;
  isIndoor: boolean;
  isLighted: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

type Review = {
  id: number;
  courtId: number;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
};

export default function CourtDetailPage() {
  const params = useParams();
  const courtId = params.id as string;
  const [court, setCourt] = useState<TennisCourt | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourtData = async () => {
      try {
        const response = await fetch(`/en/api/tennis-courts/${courtId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch court data');
        }
        const data = await response.json();
        setCourt(data);

        // For now, we'll use mock reviews until we implement the reviews API
        setReviews([
          {
            id: 1,
            courtId: Number.parseInt(courtId),
            rating: 4.5,
            comment: 'Great courts with good lighting. Surface is well-maintained.',
            author: 'Tennis Player',
            createdAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 2,
            courtId: Number.parseInt(courtId),
            rating: 4.0,
            comment: 'Nice public courts. Can get busy during peak hours.',
            author: 'Local Resident',
            createdAt: '2024-01-10T14:20:00Z',
          },
        ]);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading court details...</div>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-lg">
          Error:
          {error || 'Court not found'}
        </div>
      </div>
    );
  }

  let averageRating = 0;
  if (reviews.length > 0) {
    averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{court.name}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>
                  {court.address}
                  ,
                  {' '}
                  {court.city}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-gray-500 ml-1">
                    (
                    {reviews.length}
                    {' '}
                    reviews)
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-gray-600">{court.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">About this location</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Facility Type</p>
                      <p className="text-gray-600">{court.isIndoor ? 'Indoor Tennis Facility' : 'Outdoor Tennis Courts'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Access</p>
                      <p className="text-gray-600">{court.isPublic ? 'Public - Open to everyone' : 'Private - Membership required'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Number of Courts</p>
                      <p className="text-gray-600">
                        {court.numberOfCourts}
                        {' '}
                        court
                        {court.numberOfCourts !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Surface Type</p>
                      <p className="text-gray-600">{court.surfaceType}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Lighting</p>
                      <p className="text-gray-600">{court.isLighted ? 'Available for evening play' : 'Daytime play only'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Map will be displayed here</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium">
                      {averageRating.toFixed(1)}
                      /5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews</span>
                    <span className="font-medium">{reviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Courts</span>
                    <span className="font-medium">{court.numberOfCourts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Surface</span>
                    <span className="font-medium">{court.surfaceType}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm">Address</p>
                    <p className="font-medium">{court.address}</p>
                    <p className="font-medium">{court.city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Reviews Tab */
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Reviews</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Write a Review
                </button>
              </div>
            </div>

            <div className="p-6">
              {reviews.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet. Be the first to review this court!</p>
                </div>
              )}
              {reviews.length > 0 && (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b pb-6 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex items-center mr-3">
                            {[...Array.from({ length: 5 })].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{review.author}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
