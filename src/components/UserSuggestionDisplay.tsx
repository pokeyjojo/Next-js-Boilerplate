'use client';

import { CheckCircle, Clock, Edit, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { type Suggestion, useCourtSuggestions } from '@/hooks/useCourtSuggestions';
import { capitalizeFirstLetter } from '@/utils/Helpers';

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

type UserSuggestionDisplayProps = {
  courtId: string;
  currentUserId: string;
  onSuggestionUpdated?: () => void;
};

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

export default function UserSuggestionDisplay({ courtId, currentUserId, onSuggestionUpdated }: UserSuggestionDisplayProps) {
  // Use the centralized hook instead of direct API calls
  const { getUserSuggestions, loading, refreshSuggestions } = useCourtSuggestions(courtId, currentUserId);
  const suggestions = getUserSuggestions().slice(0, 1); // Only keep the most recent one

  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
  };

  const handleDelete = async (suggestionId: string) => {
    setShowDeleteConfirm(suggestionId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) {
      return;
    }

    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions/${showDeleteConfirm}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSuggestions();
        onSuggestionUpdated?.();
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete suggestion');
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      setError('Failed to delete suggestion');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSuggestion) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const updateData = {
        reason: formData.get('reason') as string,
        suggestedName: formData.get('suggestedName') as string,
        suggestedAddress: formData.get('suggestedAddress') as string,
        suggestedCity: formData.get('suggestedCity') as string,
        suggestedState: formData.get('suggestedState') as string,
        suggestedZip: formData.get('suggestedZip') as string,
        suggestedCourtType: formData.get('suggestedCourtType') as string,
        suggestedNumberOfCourts: Number.parseInt(formData.get('suggestedNumberOfCourts') as string) || undefined,
        suggestedSurface: formData.get('suggestedSurface') as string,
        suggestedCondition: formData.get('suggestedCondition') as string,
      };

      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions/${editingSuggestion.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setEditingSuggestion(null);
        await fetchSuggestions();
        onSuggestionUpdated?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update suggestion');
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
      setError('Failed to update suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (loading) {
    return <div className="text-[#BFC3C7]">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-[#002C4D] border border-[#EC0037] rounded-md p-3">
          <p className="text-white text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-[#EC0037] hover:text-[#4A1C23] text-xs mt-1 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="bg-[#002C4D] border border-[#BFC3C7] rounded-md p-3">
          <p className="text-white text-sm">Are you sure you want to delete this suggestion?</p>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={confirmDelete}
              className="bg-[#EC0037] text-white px-3 py-1 rounded text-xs hover:bg-[#4A1C23] transition-colors"
            >
              Delete
            </button>
            <button
              onClick={cancelDelete}
              className="bg-[#00487E] text-white px-3 py-1 rounded text-xs hover:bg-[#69F0FD] hover:text-[#27131D] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white">Your Suggestion</h3>
        <p className="text-sm text-[#BFC3C7] mt-1">
          Your most recent suggestion for this court
        </p>
      </div>

      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="bg-[#011B2E] border border-[#BFC3C7] rounded-lg p-4 overflow-hidden w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(suggestion.status)}
              <span className="font-medium text-white">
                {getStatusText(suggestion.status)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {suggestion.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleEdit(suggestion)}
                    className="text-[#69F0FD] hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(suggestion.id)}
                    className="text-[#EC0037] hover:text-[#4A1C23] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
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
              <div className="mt-1 text-[#BFC3C7]">
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
      ))}

      {/* Edit Modal */}
      {editingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#002C4D] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#BFC3C7]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Suggestion</h2>
              <button
                onClick={() => setEditingSuggestion(null)}
                className="text-[#BFC3C7] hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor="editReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Changes *
                </label>
                <textarea
                  id="editReason"
                  name="reason"
                  required
                  defaultValue={editingSuggestion.reason}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why you're suggesting these changes..."
                  rows={3}
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-2">
                    Court Name
                  </label>
                  <input
                    id="editName"
                    name="suggestedName"
                    type="text"
                    defaultValue={editingSuggestion.suggestedName || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Court name"
                  />
                </div>

                <div>
                  <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    id="editAddress"
                    name="suggestedAddress"
                    type="text"
                    defaultValue={editingSuggestion.suggestedAddress || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Court address"
                  />
                </div>

                <div>
                  <label htmlFor="editCity" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    id="editCity"
                    name="suggestedCity"
                    type="text"
                    defaultValue={editingSuggestion.suggestedCity || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label htmlFor="editNumberOfCourts" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Courts
                  </label>
                  <input
                    id="editNumberOfCourts"
                    name="suggestedNumberOfCourts"
                    type="number"
                    min="1"
                    defaultValue={editingSuggestion.suggestedNumberOfCourts || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of courts"
                  />
                </div>

                <div>
                  <label htmlFor="editSurface" className="block text-sm font-medium text-gray-700 mb-2">
                    Surface Type
                  </label>
                  <select
                    id="editSurface"
                    name="suggestedSurface"
                    defaultValue={editingSuggestion.suggestedSurface || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select surface type</option>
                    <option value="Hard">Hard</option>
                    <option value="Clay">Clay</option>
                    <option value="Grass">Grass</option>
                    <option value="Carpet">Carpet</option>
                    <option value="Artificial Grass">Artificial Grass</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Asphalt">Asphalt</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="editCondition" className="block text-sm font-medium text-gray-700 mb-2">
                    Court Condition
                  </label>
                  <select
                    id="editCondition"
                    name="suggestedCondition"
                    defaultValue={editingSuggestion.suggestedCondition || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select condition</option>
                    <option value="unknown">Unknown</option>
                    <option value="new">New (resurfaced in the last year)</option>
                    <option value="like new">Like new (resurfaced in the last 2-3 years)</option>
                    <option value="showing signs of wear">Showing signs of wear (some courts have minor cracks)</option>
                    <option value="rough shape">Rough shape (some courts are unplayable)</option>
                    <option value="terrible">Terrible (all courts are unplayable)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="editType" className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    id="editType"
                    name="suggestedType"
                    defaultValue={editingSuggestion.suggestedType || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="editHittingWall" className="block text-sm font-medium text-gray-700 mb-2">
                    Hitting Wall
                  </label>
                  <select
                    id="editHittingWall"
                    name="suggestedHittingWall"
                    defaultValue={editingSuggestion.suggestedHittingWall ? 'true' : 'false'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="editLights" className="block text-sm font-medium text-gray-700 mb-2">
                    Lights
                  </label>
                  <select
                    id="editLights"
                    name="suggestedLights"
                    defaultValue={editingSuggestion.suggestedLights ? 'true' : 'false'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSuggestion(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Update Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
