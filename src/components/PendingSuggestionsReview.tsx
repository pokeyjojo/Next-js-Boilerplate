'use client';

import React, { useEffect, useState } from 'react';
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
  suggestedIsPublic?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  reviewedByUserName?: string;
  suggestedBy?: string;
  suggestedByUserName?: string;
  createdAt: string;
  updatedAt: string;
};

type Court = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  court_type: string;
  number_of_courts: number;
  surface: string;
  court_condition?: string;
  hitting_wall?: boolean;
  lighted?: boolean;
  is_public?: boolean;
};

type PendingSuggestionsReviewProps = {
  courtId: string;
  currentUserId: string;
  currentCourt: Court;
  onSuggestionReviewed?: () => void;
};

export default function PendingSuggestionsReview({
  courtId,
  currentUserId,
  currentCourt,
  onSuggestionReviewed,
}: PendingSuggestionsReviewProps) {
  const [pendingSuggestions, setPendingSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingField, setReviewingField] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const fetchPendingSuggestions = async () => {
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions?status=pending`);
      if (response.ok) {
        const data = await response.json();
        setPendingSuggestions(data.filter((suggestion: Suggestion) => suggestion.suggestedBy !== currentUserId));
      }
    } catch (error) {
      console.error('Error fetching pending suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSuggestions();
  }, [courtId, currentUserId]);

  const handleFieldReview = async (suggestion: Suggestion, field: string, status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions/${suggestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNote: reviewNote || undefined,
          field, // Only approve/reject the specific field
        }),
      });

      if (response.ok) {
        setReviewingField(null);
        setReviewNote('');
        await fetchPendingSuggestions();
        onSuggestionReviewed?.();
      } else {
        console.error('Failed to review suggestion');
      }
    } catch (error) {
      console.error('Error reviewing suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldSuggestions = (field: string) => {
    return pendingSuggestions.filter((suggestion) => {
      const suggestedField = `suggested${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const value = suggestion[suggestedField as keyof Suggestion];

      // For boolean fields, check if the value is not null and not undefined
      if (field === 'hittingWall' || field === 'lights' || field === 'isPublic') {
        return value !== null && value !== undefined;
      }

      // For other fields, check if the value exists
      return value;
    });
  };

  const renderFieldWithSuggestions = (field: string, currentValue: any, label: string) => {
    const fieldSuggestions = getFieldSuggestions(field);

    // Capitalize condition values for better display
    const displayValue = field === 'condition' ? capitalizeFirstLetter(currentValue) : currentValue;

    if (fieldSuggestions.length === 0) {
      return (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>
              {label}
              :
            </strong>
            {' '}
            {displayValue || 'Not specified'}
          </p>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <strong>
            {label}
            :
          </strong>
          {' '}
          {displayValue || 'Not specified'}
        </p>
        {fieldSuggestions.map((suggestion) => {
          const suggestedField = `suggested${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof Suggestion;
          const suggestedValue = suggestion[suggestedField];

          // For boolean fields, check for null/undefined specifically
          if (field === 'hittingWall' || field === 'lights' || field === 'isPublic') {
            if (suggestedValue === null || suggestedValue === undefined) {
              return null;
            }
          } else {
            // For non-boolean fields, use the original truthy check
            if (!suggestedValue) {
              return null;
            }
          }

          return (
            <div key={suggestion.id} className="ml-4 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <strong>
                      Suggested
                      {label}
                      :
                    </strong>
                    {' '}
                    {field === 'condition'
                      ? capitalizeFirstLetter(String(suggestedValue))
                      : field === 'hittingWall' || field === 'lights'
                        ? (suggestedValue ? 'Yes' : 'No')
                        : field === 'isPublic'
                          ? (suggestedValue ? 'Public' : 'Private')
                          : suggestedValue}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested by
                    {' '}
                    {suggestion.suggestedByUserName}
                    {' '}
                    on
                    {' '}
                    {new Date(suggestion.createdAt).toLocaleDateString()}
                  </p>
                  {suggestion.reason && suggestion.reason.trim() && (
                    <div className="text-xs text-gray-600 mt-1 w-full">
                      <strong>Additional Notes:</strong>
                      <TruncatableText text={suggestion.reason} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setReviewingField(`${suggestion.id}-${field}`)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>

              {reviewingField === `${suggestion.id}-${field}` && (
                <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Add a review note (optional)..."
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                    rows={2}
                    maxLength={100}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFieldReview(suggestion, field, 'approved')}
                      disabled={isSubmitting}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleFieldReview(suggestion, field, 'rejected')}
                      disabled={isSubmitting}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => {
                        setReviewingField(null);
                        setReviewNote('');
                      }}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading suggestions...</div>;
  }

  const hasPendingSuggestions = pendingSuggestions.some(suggestion =>
    suggestion.suggestedName || suggestion.suggestedAddress || suggestion.suggestedCity
    || suggestion.suggestedState || suggestion.suggestedZip || suggestion.suggestedCourtType
    || suggestion.suggestedNumberOfCourts || suggestion.suggestedSurface || suggestion.suggestedCondition
    || suggestion.suggestedType || (suggestion.suggestedHittingWall !== null && suggestion.suggestedHittingWall !== undefined) || (suggestion.suggestedLights !== null && suggestion.suggestedLights !== undefined) || (suggestion.suggestedIsPublic !== null && suggestion.suggestedIsPublic !== undefined),
  );

  if (!hasPendingSuggestions) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Pending Suggestions to Review</h3>
      <div className="space-y-4">
        {renderFieldWithSuggestions('name', currentCourt.name, 'Name')}
        {renderFieldWithSuggestions('address', currentCourt.address, 'Address')}
        {renderFieldWithSuggestions('zip', currentCourt.zip, 'Zip Code')}
        {renderFieldWithSuggestions('city', currentCourt.city, 'City')}
        {renderFieldWithSuggestions('state', currentCourt.state, 'State')}
        {renderFieldWithSuggestions('courtType', currentCourt.court_type, 'Court Type')}
        {renderFieldWithSuggestions('numberOfCourts', currentCourt.number_of_courts, 'Number of Courts')}
        {renderFieldWithSuggestions('surface', currentCourt.surface, 'Surface')}
        {renderFieldWithSuggestions('condition', currentCourt.court_condition, 'Condition')}
        {renderFieldWithSuggestions('hittingWall', currentCourt.hitting_wall, 'Hitting Wall')}
        {renderFieldWithSuggestions('lights', currentCourt.lighted, 'Lights')}
        {renderFieldWithSuggestions('isPublic', currentCourt.is_public, 'Court Access')}
      </div>
    </div>
  );
}
