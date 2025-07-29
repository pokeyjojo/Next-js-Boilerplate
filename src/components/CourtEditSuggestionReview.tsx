'use client';

import { AlertCircle, Check, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type CourtEditSuggestion = {
  id: string;
  courtId: string;
  suggestedBy: string;
  suggestedByUserName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  suggestedName?: string;
  suggestedAddress?: string;
  suggestedCity?: string;
  suggestedNumberOfCourts?: number;
  suggestedSurface?: string;
  createdAt: string;
};

type CourtEditSuggestionReviewProps = {
  courtId: string;
  currentUserId: string;
};

export default function CourtEditSuggestionReview({ courtId, currentUserId }: CourtEditSuggestionReviewProps) {
  const [suggestions, setSuggestions] = useState<CourtEditSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [courtId]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions?status=pending`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (suggestionId: string, status: 'approved' | 'rejected', reviewNote: string) => {
    setReviewing(suggestionId);
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions/${suggestionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reviewNote }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to review suggestion');
      }

      // Remove the reviewed suggestion from the list
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
      alert(error instanceof Error ? error.message : 'Failed to review suggestion');
    } finally {
      setReviewing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No pending edit suggestions for this court.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Pending Edit Suggestions</h3>
      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(suggestion.status)}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(suggestion.status)}`}>
                {suggestion.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(suggestion.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Suggested by:</strong>
              {' '}
              {suggestion.suggestedByUserName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Reason:</strong>
              {' '}
              {suggestion.reason}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {suggestion.suggestedName && (
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-600">{suggestion.suggestedName}</p>
              </div>
            )}
            {suggestion.suggestedAddress && (
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{suggestion.suggestedAddress}</p>
              </div>
            )}
            {suggestion.suggestedCity && (
              <div>
                <p className="text-sm font-medium text-gray-700">City</p>
                <p className="text-sm text-gray-600">{suggestion.suggestedCity}</p>
              </div>
            )}
            {suggestion.suggestedNumberOfCourts && (
              <div>
                <p className="text-sm font-medium text-gray-700">Number of Courts</p>
                <p className="text-sm text-gray-600">{suggestion.suggestedNumberOfCourts}</p>
              </div>
            )}
            {suggestion.suggestedSurface && (
              <div>
                <p className="text-sm font-medium text-gray-700">Surface Type</p>
                <p className="text-sm text-gray-600">{suggestion.suggestedSurface}</p>
              </div>
            )}
          </div>

          {suggestion.suggestedBy !== currentUserId && suggestion.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const note = prompt('Add a note (optional):');
                  handleReview(suggestion.id, 'approved', note || '');
                }}
                disabled={reviewing === suggestion.id}
                className="flex-1 px-3 py-2 text-sm text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reviewing === suggestion.id ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  const note = prompt('Add a note (optional):');
                  handleReview(suggestion.id, 'rejected', note || '');
                }}
                disabled={reviewing === suggestion.id}
                className="flex-1 px-3 py-2 text-sm text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reviewing === suggestion.id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}

          {suggestion.suggestedBy === currentUserId && (
            <p className="text-sm text-gray-500 italic">
              You cannot review your own suggestion.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
