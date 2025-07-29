'use client';

import { CheckCircle, CheckCircle as CheckCircleIcon, Clock, Edit, Trash2, X, XCircle } from 'lucide-react';
import { useState } from 'react';

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
  createdAt: string;
  updatedAt: string;
};

type CourtEditSuggestionProps = {
  court: {
    id: string;
    name: string;
    address: string;
    city: string;
    numberOfCourts: number;
    surfaceType: string;
  };
  userId?: string;
  onSuggestionSubmitted?: () => void;
};

export default function CourtEditSuggestion({ court, userId, onSuggestionSubmitted }: CourtEditSuggestionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showExistingSuggestion, setShowExistingSuggestion] = useState(false);
  const [existingSuggestion, setExistingSuggestion] = useState<Suggestion | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [formData, setFormData] = useState({
    reason: '',
    suggestedName: court.name,
    suggestedAddress: court.address,
    suggestedCity: court.city,
    suggestedNumberOfCourts: '', // Start with blank value instead of court.numberOfCourts
    suggestedSurface: court.surfaceType,
  });

  const checkExistingSuggestion = async () => {
    try {
      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions?status=pending`);
      if (response.ok) {
        const suggestions = await response.json();
        // Find current user's pending suggestion specifically
        const userPendingSuggestion = suggestions.find((suggestion: Suggestion) =>
          suggestion.status === 'pending' && suggestion.suggestedBy === userId,
        );
        return userPendingSuggestion || null;
      }
    } catch (error) {
      console.error('Error checking existing suggestions:', error);
    }
    return null;
  };

  const handleOpenModal = async () => {
    const existing = await checkExistingSuggestion();
    if (existing) {
      setExistingSuggestion(existing);
      setShowExistingSuggestion(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleEdit = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setShowExistingSuggestion(false);
  };

  const handleDelete = async (suggestionId: string) => {
    // Use a simple prompt instead of confirm
    const userConfirmed = window.prompt('Type "DELETE" to confirm deletion of this suggestion:') === 'DELETE';
    if (!userConfirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions/${suggestionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowExistingSuggestion(false);
        setExistingSuggestion(null);
        onSuggestionSubmitted?.();
      } else {
        const error = await response.json();
        console.error('Failed to delete suggestion:', error.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
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

      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions/${editingSuggestion.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setEditingSuggestion(null);
        setShowExistingSuggestion(false);
        setExistingSuggestion(null);
        onSuggestionSubmitted?.();
      } else {
        const error = await response.json();
        console.error('Failed to update suggestion:', error.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the data, handling blank values for number of courts
      const submissionData = {
        ...formData,
        suggestedNumberOfCourts: formData.suggestedNumberOfCourts === '' || (typeof formData.suggestedNumberOfCourts === 'number' && formData.suggestedNumberOfCourts === 0)
          ? null
          : formData.suggestedNumberOfCourts,
      };

      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit suggestion');
      }

      // Show success notification
      setShowSuccess(true);
      setIsOpen(false);

      // Reset form data
      setFormData({
        reason: '',
        suggestedName: court.name,
        suggestedAddress: court.address,
        suggestedCity: court.city,
        suggestedNumberOfCourts: '',
        suggestedSurface: court.surfaceType,
      });

      onSuggestionSubmitted?.();

      // Hide success notification after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      // Show error in console instead of alert
      console.error('Error:', error instanceof Error ? error.message : 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
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

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Edit className="w-4 h-4 mr-2" />
        Suggest Edit
      </button>

      {/* Existing Suggestion Modal */}
      {showExistingSuggestion && existingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Existing Suggestion</h2>
              <button
                onClick={() => setShowExistingSuggestion(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(existingSuggestion.status)}
                <span className="font-medium text-gray-900">
                  {getStatusText(existingSuggestion.status)}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Reason:</strong>
                  {' '}
                  {existingSuggestion.reason}
                </p>

                {existingSuggestion.suggestedName && (
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong>
                    {' '}
                    {existingSuggestion.suggestedName}
                  </p>
                )}

                {existingSuggestion.suggestedAddress && (
                  <p className="text-sm text-gray-600">
                    <strong>Address:</strong>
                    {' '}
                    {existingSuggestion.suggestedAddress}
                  </p>
                )}

                {existingSuggestion.suggestedCity && (
                  <p className="text-sm text-gray-600">
                    <strong>City:</strong>
                    {' '}
                    {existingSuggestion.suggestedCity}
                  </p>
                )}

                {existingSuggestion.suggestedNumberOfCourts && existingSuggestion.suggestedNumberOfCourts > 0 && (
                  <p className="text-sm text-gray-600">
                    <strong>Number of Courts:</strong>
                    {' '}
                    {existingSuggestion.suggestedNumberOfCourts}
                  </p>
                )}
                {(!existingSuggestion.suggestedNumberOfCourts || existingSuggestion.suggestedNumberOfCourts === 0) && (
                  <p className="text-sm text-gray-600">
                    <strong>Number of Courts:</strong>
                    {' '}
                    Unknown
                  </p>
                )}

                {existingSuggestion.suggestedSurface && (
                  <p className="text-sm text-gray-600">
                    <strong>Surface:</strong>
                    {' '}
                    {existingSuggestion.suggestedSurface}
                  </p>
                )}

                {existingSuggestion.reviewNote && (
                  <p className="text-sm text-gray-600">
                    <strong>Review Note:</strong>
                    {' '}
                    {existingSuggestion.reviewNote}
                  </p>
                )}

                {existingSuggestion.reviewedByUserName && (
                  <p className="text-sm text-gray-600">
                    <strong>Reviewed by:</strong>
                    {' '}
                    {existingSuggestion.reviewedByUserName}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-400">
                Submitted on
                {' '}
                {new Date(existingSuggestion.createdAt).toLocaleDateString()}
              </p>

              {existingSuggestion.status === 'pending' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleEdit(existingSuggestion)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit Suggestion
                  </button>
                  <button
                    onClick={() => handleDelete(existingSuggestion.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Delete Suggestion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
                <p className="text-gray-600">Your edit suggestion has been submitted successfully. It will be reviewed by the community.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Suggestion Modal */}
      {editingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Edit Suggestion</h2>
              <button
                onClick={() => setEditingSuggestion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
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

      {/* New Suggestion Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Suggest Court Edit</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Changes *
                </label>
                <textarea
                  id="reason"
                  required
                  value={formData.reason}
                  onChange={e => handleInputChange('reason', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why you're suggesting these changes..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="suggestedName" className="block text-sm font-medium text-gray-700 mb-2">
                    Court Name
                  </label>
                  <input
                    id="suggestedName"
                    type="text"
                    value={formData.suggestedName}
                    onChange={e => handleInputChange('suggestedName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Court name"
                  />
                </div>

                <div>
                  <label htmlFor="suggestedAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    id="suggestedAddress"
                    type="text"
                    value={formData.suggestedAddress}
                    onChange={e => handleInputChange('suggestedAddress', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Court address"
                  />
                </div>

                <div>
                  <label htmlFor="suggestedCity" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    id="suggestedCity"
                    type="text"
                    value={formData.suggestedCity}
                    onChange={e => handleInputChange('suggestedCity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label htmlFor="suggestedNumberOfCourts" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Courts
                  </label>
                  <input
                    id="suggestedNumberOfCourts"
                    type="number"
                    min="0"
                    value={formData.suggestedNumberOfCourts}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow blank values or valid numbers
                      if (value === '') {
                        handleInputChange('suggestedNumberOfCourts', '');
                      } else {
                        const numValue = Number.parseInt(value);
                        if (!Number.isNaN(numValue) && numValue >= 0) {
                          handleInputChange('suggestedNumberOfCourts', numValue);
                        }
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of courts (leave blank for unknown)"
                  />
                </div>

                <div>
                  <label htmlFor="suggestedSurface" className="block text-sm font-medium text-gray-700 mb-2">
                    Surface Type
                  </label>
                  <select
                    id="suggestedSurface"
                    value={formData.suggestedSurface || ''}
                    onChange={e => handleInputChange('suggestedSurface', e.target.value)}
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
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
