'use client';

import { Clock, User } from 'lucide-react';
import { useEffect, useState } from 'react';

type Suggestion = {
  id: string;
  reason: string;
  suggestedName?: string;
  suggestedAddress?: string;
  suggestedCity?: string;
  suggestedState?: string;
  suggestedZip?: string;
  suggestedCourtType?: string;
  suggestedNumberOfCourts?: number;
  suggestedSurface?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  reviewedByUserName?: string;
  suggestedBy?: string;
  suggestedByUserName?: string;
  createdAt: string;
  updatedAt: string;
};

type PendingSuggestionsReviewProps = {
  courtId: string;
  currentUserId: string;
  onSuggestionReviewed?: () => void;
};

export default function PendingSuggestionsReview({ courtId, currentUserId, onSuggestionReviewed }: PendingSuggestionsReviewProps) {
  const [pendingSuggestions, setPendingSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingSuggestion, setReviewingSuggestion] = useState<Suggestion | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOwnSuggestions, setShowOwnSuggestions] = useState(false);

  const fetchPendingSuggestions = async () => {
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions?status=pending`);
      if (response.ok) {
        const suggestions = await response.json();
        setPendingSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching pending suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSuggestions();
  }, [courtId]);

  // Filter suggestions based on checkbox state
  const filteredSuggestions = showOwnSuggestions
    ? pendingSuggestions
    : pendingSuggestions.filter((suggestion: Suggestion) =>
        suggestion.suggestedBy !== currentUserId,
      );

  const handleReview = async (suggestion: Suggestion, status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNote: reviewNote.trim() || undefined,
        }),
      });

      if (response.ok) {
        setReviewingSuggestion(null);
        setReviewNote('');
        await fetchPendingSuggestions();
        onSuggestionReviewed?.();
      } else {
        const error = await response.json();
        console.error('Failed to review suggestion:', error.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading pending suggestions...</div>;
  }

  if (filteredSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Pending Suggestions to Review</h3>
        {currentUserId && (
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showOwnSuggestions}
              onChange={e => setShowOwnSuggestions(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show my suggestions</span>
          </label>
        )}
      </div>

      {showOwnSuggestions && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡
            {' '}
            <strong>Note:</strong>
            {' '}
            You cannot review your own suggestions. Your suggestions are shown for reference only.
          </p>
        </div>
      )}

      {filteredSuggestions.map(suggestion => (
        <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-gray-900">Pending Review</span>
              {suggestion.suggestedBy === currentUserId && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Your suggestion
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>{suggestion.suggestedByUserName || 'Unknown User'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Reason:</strong>
              {' '}
              {suggestion.reason}
            </p>

            {suggestion.suggestedName && (
              <p className="text-sm text-gray-600">
                <strong>Name:</strong>
                {' '}
                {suggestion.suggestedName}
              </p>
            )}

            {suggestion.suggestedAddress && (
              <p className="text-sm text-gray-600">
                <strong>Address:</strong>
                {' '}
                {suggestion.suggestedAddress}
              </p>
            )}

            {suggestion.suggestedCity && (
              <p className="text-sm text-gray-600">
                <strong>City:</strong>
                {' '}
                {suggestion.suggestedCity}
              </p>
            )}

            {suggestion.suggestedNumberOfCourts && suggestion.suggestedNumberOfCourts > 0 && (
              <p className="text-sm text-gray-600">
                <strong>Number of Courts:</strong>
                {' '}
                {suggestion.suggestedNumberOfCourts}
              </p>
            )}
            {(!suggestion.suggestedNumberOfCourts || suggestion.suggestedNumberOfCourts === 0) && (
              <p className="text-sm text-gray-600">
                <strong>Number of Courts:</strong>
                {' '}
                Unknown
              </p>
            )}

            {suggestion.suggestedSurface && (
              <p className="text-sm text-gray-600">
                <strong>Surface:</strong>
                {' '}
                {suggestion.suggestedSurface}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Submitted on
            {' '}
            {new Date(suggestion.createdAt).toLocaleDateString()}
          </p>

          <div className="mt-4 flex space-x-3">
            {suggestion.suggestedBy === currentUserId
              ? (
                  <div className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                    Your suggestion - cannot review
                  </div>
                )
              : (
                  <button
                    onClick={() => setReviewingSuggestion(suggestion)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review Suggestion
                  </button>
                )}
          </div>
        </div>
      ))}

      {/* Review Modal */}
      {reviewingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Review Suggestion</h2>
              <button
                onClick={() => {
                  setReviewingSuggestion(null);
                  setReviewNote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
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
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setReviewingSuggestion(null);
                    setReviewNote('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview(reviewingSuggestion, 'rejected')}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleReview(reviewingSuggestion, 'approved')}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
