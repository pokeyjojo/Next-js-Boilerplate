'use client';

import { CheckCircle, Clock, User, XCircle } from 'lucide-react';
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

type AllSuggestionsDisplayProps = {
  courtId: string;
  currentUserId?: string;
  onSuggestionUpdated?: () => void;
};

export default function AllSuggestionsDisplay({ courtId, currentUserId, onSuggestionUpdated: _onSuggestionUpdated }: AllSuggestionsDisplayProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOwnSuggestions, setShowOwnSuggestions] = useState(false);

  const fetchAllSuggestions = async () => {
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions`);
      if (response.ok) {
        const data = await response.json();
        // Sort suggestions from newest to oldest
        const sortedData = data.sort((a: Suggestion, b: Suggestion) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setSuggestions(sortedData);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSuggestions();
  }, [courtId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  // Filter suggestions based on checkbox state
  const filteredSuggestions = showOwnSuggestions
    ? suggestions
    : suggestions.filter(suggestion => suggestion.suggestedBy !== currentUserId);

  if (loading) {
    return <div className="text-gray-500">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Suggestion History</h3>
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

      {filteredSuggestions.length === 0
        ? (
            <div className="text-gray-500 text-center py-4">
              {showOwnSuggestions ? 'No suggestion history found.' : 'No suggestion history from other users.'}
            </div>
          )
        : (
            filteredSuggestions.map(suggestion => (
              <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(suggestion.status)}
                    <span className="font-medium text-gray-900">
                      {getStatusText(suggestion.status)}
                    </span>
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

                  {suggestion.reviewNote && (
                    <p className="text-sm text-gray-600">
                      <strong>Review Note:</strong>
                      {' '}
                      {suggestion.reviewNote}
                    </p>
                  )}

                  {suggestion.reviewedByUserName && (
                    <p className="text-sm text-gray-600">
                      <strong>Reviewed by:</strong>
                      {' '}
                      {suggestion.reviewedByUserName}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Submitted on
                  {' '}
                  {new Date(suggestion.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
    </div>
  );
}
