'use client';

import { CheckCircle, Clock, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { capitalizeFirstLetter } from '@/utils/Helpers';

// TruncatableText component for handling long text with expand/collapse functionality
function TruncatableText({ text, maxLength = 100 }: { text: string; maxLength?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return (
      <div className="mt-1 break-words whitespace-pre-wrap overflow-hidden w-full">
        {text}
      </div>
    );
  }

  return (
    <div className="mt-1 w-full">
      <div className="break-words whitespace-pre-wrap overflow-hidden w-full">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-800 text-xs mt-1 underline"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

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
  suggestedCondition?: string;
  suggestedType?: string;
  suggestedHittingWall?: boolean;
  suggestedLights?: boolean;
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
              <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-4 overflow-hidden">
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
                  <div className="text-sm text-gray-600 w-full">
                    <strong>Reason:</strong>
                    <TruncatableText text={suggestion.reason} />
                  </div>

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

                  {suggestion.suggestedCondition && (
                    <p className="text-sm text-gray-600">
                      <strong>Condition:</strong>
                      {' '}
                      {capitalizeFirstLetter(suggestion.suggestedCondition)}
                    </p>
                  )}

                  {suggestion.suggestedType && (
                    <p className="text-sm text-gray-600">
                      <strong>Type:</strong>
                      {' '}
                      {suggestion.suggestedType}
                    </p>
                  )}

                  {suggestion.suggestedHittingWall !== undefined && (
                    <p className="text-sm text-gray-600">
                      <strong>Hitting Wall:</strong>
                      {' '}
                      {suggestion.suggestedHittingWall ? 'Yes' : 'No'}
                    </p>
                  )}

                  {suggestion.suggestedLights !== undefined && (
                    <p className="text-sm text-gray-600">
                      <strong>Lights:</strong>
                      {' '}
                      {suggestion.suggestedLights ? 'Yes' : 'No'}
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
