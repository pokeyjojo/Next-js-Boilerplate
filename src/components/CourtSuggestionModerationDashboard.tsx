'use client';

import { Check, Clock, MapPin, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

type CourtSuggestion = {
  id: string;
  suggestedBy: string;
  suggestedByUserName: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByUserName?: string;
  reviewNote?: string;
  reviewedAt?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: string;
  longitude?: string;
  courtType?: string;
  numberOfCourts?: number;
  surface?: string;
  courtCondition?: string;
  hittingWall?: boolean;
  lighted?: boolean;
  membershipRequired?: boolean;
  parking?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function CourtSuggestionModerationDashboard() {
  const [suggestions, setSuggestions] = useState<CourtSuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<CourtSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewingSuggestion, setReviewingSuggestion] = useState<CourtSuggestion | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/court-suggestions?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setFilteredSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching court suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleReview = async (suggestionId: string, action: 'approve' | 'reject') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/court-suggestions/${suggestionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reviewNote: reviewNote.trim() || null,
        }),
      });

      if (response.ok) {
        setReviewingSuggestion(null);
        setReviewNote('');
        await fetchSuggestions();
      } else {
        console.error('Failed to review suggestion');
      }
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-5 h-5 text-[#69F0FD]" />;
      case 'rejected':
        return <X className="w-5 h-5 text-[#EC0037]" />;
      default:
        return <Clock className="w-5 h-5 text-[#918AB5]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-[#69F0FD] text-[#27131D]';
      case 'rejected':
        return 'bg-[#EC0037] text-white';
      default:
        return 'bg-[#918AB5] text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EC0037]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Court Suggestions</h1>
        <div className="flex space-x-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow ${
                filter === status
                  ? 'bg-[#EC0037] text-white'
                  : 'bg-[#EBEDEE] text-[#27131D] hover:bg-[#BFC3C7]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-white bg-opacity-20 rounded-full">
                  {suggestions.filter(s => s.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredSuggestions.length === 0
        ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
              <p className="text-gray-600">
                {filter === 'pending'
                  ? 'No pending court suggestions at the moment.'
                  : `No ${filter} court suggestions found.`}
              </p>
            </div>
          )
        : (
            <div className="space-y-4">
              {filteredSuggestions.map(suggestion => (
                <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{suggestion.name}</h3>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(suggestion.status)}`}>
                          {getStatusIcon(suggestion.status)}
                          <span className="capitalize">{suggestion.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {suggestion.address}
                          ,
                          {' '}
                          {suggestion.city}
                          ,
                          {' '}
                          {suggestion.state}
                          {' '}
                          {suggestion.zip}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Suggested by
                        {' '}
                        {suggestion.suggestedByUserName}
                        {' '}
                        on
                        {' '}
                        {formatDate(suggestion.createdAt)}
                      </p>
                    </div>

                    {suggestion.status === 'pending' && (
                      <button
                        onClick={() => setReviewingSuggestion(suggestion)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    {suggestion.courtType && (
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-1 text-gray-600">{suggestion.courtType}</span>
                      </div>
                    )}
                    {suggestion.numberOfCourts && (
                      <div>
                        <span className="font-medium text-gray-700">Courts:</span>
                        <span className="ml-1 text-gray-600">{suggestion.numberOfCourts}</span>
                      </div>
                    )}
                    {suggestion.surface && (
                      <div>
                        <span className="font-medium text-gray-700">Surface:</span>
                        <span className="ml-1 text-gray-600">{suggestion.surface}</span>
                      </div>
                    )}
                    {suggestion.courtCondition && (
                      <div>
                        <span className="font-medium text-gray-700">Condition:</span>
                        <span className="ml-1 text-gray-600">{suggestion.courtCondition}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {suggestion.lighted && (
                      <span className="px-2 py-1 bg-[#69F0FD] text-[#27131D] text-xs rounded-full shadow">Lighted</span>
                    )}
                    {suggestion.hittingWall && (
                      <span className="px-2 py-1 bg-[#69F0FD] text-[#27131D] text-xs rounded-full shadow">Hitting Wall</span>
                    )}
                    {suggestion.membershipRequired && (
                      <span className="px-2 py-1 bg-[#EC0037] text-white text-xs rounded-full shadow">Membership Required</span>
                    )}
                    {suggestion.parking && (
                      <span className="px-2 py-1 bg-[#002C4D] text-white text-xs rounded-full shadow">Parking Available</span>
                    )}
                  </div>

                  {suggestion.status !== 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">
                          {suggestion.status === 'approved' ? 'Approved' : 'Rejected'}
                          {' '}
                          by
                          {suggestion.reviewedByUserName}
                        </span>
                        {suggestion.reviewedAt && (
                          <span className="ml-2">
                            on
                            {formatDate(suggestion.reviewedAt)}
                          </span>
                        )}
                      </p>
                      {suggestion.reviewNote && (
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Note:</span>
                          {' '}
                          {suggestion.reviewNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

      {reviewingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Review Court Suggestion</h3>
              <button
                onClick={() => setReviewingSuggestion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="font-medium text-gray-900">{reviewingSuggestion.name}</p>
              <p className="text-sm text-gray-600">
                {reviewingSuggestion.address}
                ,
                {reviewingSuggestion.city}
                ,
                {reviewingSuggestion.state}
                {' '}
                {reviewingSuggestion.zip}
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="reviewNote" className="block text-sm font-medium text-gray-700 mb-2">
                Review Note (Optional)
              </label>
              <textarea
                id="reviewNote"
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a note about your decision..."
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {reviewNote.length}
                /500 characters
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleReview(reviewingSuggestion.id, 'reject')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleReview(reviewingSuggestion.id, 'approve')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
