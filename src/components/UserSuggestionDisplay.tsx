'use client';

import { CheckCircle, Clock, Edit, Trash2, XCircle } from 'lucide-react';
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
  createdAt: string;
  updatedAt: string;
};

type UserSuggestionDisplayProps = {
  courtId: string;
  currentUserId: string;
  onSuggestionUpdated?: () => void;
};

export default function UserSuggestionDisplay({ courtId, currentUserId, onSuggestionUpdated }: UserSuggestionDisplayProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [courtId]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only show current user's suggestions
        const userSuggestions = data.filter((suggestion: Suggestion) =>
          suggestion.suggestedBy === currentUserId,
        );
        setSuggestions(userSuggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
  };

  const handleDelete = async (suggestionId: string) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tennis-courts/${courtId}/edit-suggestions/${suggestionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSuggestions();
        onSuggestionUpdated?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete suggestion');
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      alert('Failed to delete suggestion');
    }
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
        const error = await response.json();
        alert(error.error || 'Failed to update suggestion');
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
      alert('Failed to update suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (loading) {
    return <div className="text-gray-500">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Your Suggestions</h3>

      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(suggestion.status)}
              <span className="font-medium text-gray-900">
                {getStatusText(suggestion.status)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {suggestion.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleEdit(suggestion)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(suggestion.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
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
      ))}

      {/* Edit Modal */}
      {editingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Edit Suggestion</h2>
              <button
                onClick={() => setEditingSuggestion(null)}
                className="text-gray-400 hover:text-gray-600"
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
                  maxLength={500}
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
