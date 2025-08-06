'use client';

import { CheckCircle, Clock, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import BanButton from '@/components/BanButton';
import { capitalizeFirstLetter } from '@/utils/Helpers';

// TruncatableText component for handling long text with expand/collapse functionality
function TruncatableText({ text, maxLength = 100 }: { text: string; maxLength?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return (
      <div className="mt-1 break-words whitespace-pre-wrap overflow-hidden w-full text-[#BFC3C7]">
        {text}
      </div>
    );
  }

  return (
    <div className="mt-1 w-full">
      <div className="break-words whitespace-pre-wrap overflow-hidden w-full text-[#BFC3C7]">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[#69F0FD] hover:text-white text-xs mt-1 underline transition-colors"
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
  suggestedIsPublic?: boolean;
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
  isAdmin?: boolean;
  onSuggestionUpdated?: () => void;
};

export default function AllSuggestionsDisplay({ courtId, currentUserId, isAdmin = false, onSuggestionUpdated: _onSuggestionUpdated }: AllSuggestionsDisplayProps) {
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
        return <Clock className="w-4 h-4 text-[#918AB5]" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-[#69F0FD]" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-[#EC0037]" />;
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
    return <div className="text-[#BFC3C7]">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Suggestion History</h3>
        {currentUserId && (
          <label className="flex items-center space-x-2 text-sm text-[#BFC3C7]">
            <input
              type="checkbox"
              checked={showOwnSuggestions}
              onChange={e => setShowOwnSuggestions(e.target.checked)}
              className="rounded border-[#BFC3C7] bg-[#00487E] text-[#69F0FD] focus:ring-[#69F0FD] focus:ring-2"
            />
            <span>Show my suggestions</span>
          </label>
        )}
      </div>

      {filteredSuggestions.length === 0
        ? (
            <div className="text-[#BFC3C7] text-center py-4">
              {showOwnSuggestions ? 'No suggestion history found.' : 'No suggestion history from other users.'}
            </div>
          )
        : (
            filteredSuggestions.map(suggestion => (
              <div key={suggestion.id} className="bg-[#011B2E] border border-[#BFC3C7] rounded-lg p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(suggestion.status)}
                    <span className="font-medium text-white">
                      {getStatusText(suggestion.status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-[#BFC3C7]">
                    <User className="w-4 h-4" />
                    <span>{suggestion.suggestedByUserName || 'Unknown User'}</span>
                    {isAdmin && suggestion.suggestedBy && suggestion.suggestedBy !== currentUserId && (
                      <BanButton
                        userId={suggestion.suggestedBy}
                        userName={suggestion.suggestedByUserName || 'Unknown User'}
                        banType="suggestions"
                        size="sm"
                        variant="icon"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {suggestion.suggestedName && (
                    <p className="text-sm text-white">
                      <strong>Name:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedName}</span>
                    </p>
                  )}

                  {suggestion.suggestedAddress && (
                    <p className="text-sm text-white">
                      <strong>Address:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedAddress}</span>
                    </p>
                  )}

                  {suggestion.suggestedCity && (
                    <p className="text-sm text-white">
                      <strong>City:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedCity}</span>
                    </p>
                  )}

                  {suggestion.suggestedZip && suggestion.suggestedZip !== '00000' && (
                    <p className="text-sm text-white">
                      <strong>Zip Code:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedZip}</span>
                    </p>
                  )}

                  {suggestion.suggestedNumberOfCourts && suggestion.suggestedNumberOfCourts > 0 && (
                    <p className="text-sm text-white">
                      <strong>Number of Courts:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedNumberOfCourts}</span>
                    </p>
                  )}
                  {(!suggestion.suggestedNumberOfCourts || suggestion.suggestedNumberOfCourts === 0) && (
                    <p className="text-sm text-white">
                      <strong>Number of Courts:</strong>
                      <span className="text-[#BFC3C7] ml-1">Unknown</span>
                    </p>
                  )}

                  {suggestion.suggestedSurface && (
                    <p className="text-sm text-white">
                      <strong>Surface:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedSurface}</span>
                    </p>
                  )}

                  {suggestion.suggestedCondition && (
                    <p className="text-sm text-white">
                      <strong>Condition:</strong>
                      <span className="text-[#BFC3C7] ml-1">{capitalizeFirstLetter(suggestion.suggestedCondition)}</span>
                    </p>
                  )}

                  {suggestion.suggestedType && (
                    <p className="text-sm text-white">
                      <strong>Type:</strong>
                      <span className="text-[#BFC3C7] ml-1">{capitalizeFirstLetter(suggestion.suggestedType)}</span>
                    </p>
                  )}

                  {suggestion.suggestedHittingWall !== undefined && (
                    <p className="text-sm text-white">
                      <strong>Hitting Wall:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedHittingWall ? 'Yes' : 'No'}</span>
                    </p>
                  )}

                  {suggestion.suggestedLights !== undefined && (
                    <p className="text-sm text-white">
                      <strong>Lights:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedLights ? 'Yes' : 'No'}</span>
                    </p>
                  )}

                  {suggestion.suggestedIsPublic !== undefined && (
                    <p className="text-sm text-white">
                      <strong>Court Access:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.suggestedIsPublic ? 'Public' : 'Private'}</span>
                    </p>
                  )}

                  {suggestion.reviewNote && (
                    <p className="text-sm text-white">
                      <strong>Review Note:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.reviewNote}</span>
                    </p>
                  )}

                  {suggestion.reviewedByUserName && (
                    <p className="text-sm text-white">
                      <strong>Reviewed by:</strong>
                      <span className="text-[#BFC3C7] ml-1">{suggestion.reviewedByUserName}</span>
                    </p>
                  )}
                </div>

                {suggestion.reason && suggestion.reason.trim() && (
                  <div className="text-sm text-white w-full mt-3 pt-2 border-t border-[#BFC3C7]">
                    <strong>Additional Notes:</strong>
                    <div className="mt-1">
                      <TruncatableText text={suggestion.reason} />
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#BFC3C7] mt-3">
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
