'use client';

import type { AddressSuggestion } from '@/libs/GeocodingService';
import { CheckCircleIcon, Edit, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { searchAddresses } from '@/libs/GeocodingService';
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
  createdAt: string;
  updatedAt: string;
};

type CourtEditSuggestionProps = {
  court: {
    id: string;
    name: string;
    address: string;
    city: string;
    zip?: string;
    numberOfCourts: number;
    surfaceType: string;
    courtCondition?: string;
    courtType?: string;
    hittingWall?: boolean;
    lighted?: boolean;
    isPublic?: boolean;
  };
  userId?: string;
  onSuggestionSubmitted?: () => void;
  onSuggestionCreated?: () => void;
  refreshKey?: number;
};

export default function CourtEditSuggestion({ court, userId, onSuggestionSubmitted, onSuggestionCreated, refreshKey }: CourtEditSuggestionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingSuggestion, setExistingSuggestion] = useState<Suggestion | null>(null);
  const [showExistingSuggestion, setShowExistingSuggestion] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    reason: '',
    suggestedName: court.name,
    suggestedAddress: court.address,
    suggestedCity: court.city,
    suggestedZip: court.zip || '',
    suggestedNumberOfCourts: '',
    suggestedSurface: court.surfaceType,
    suggestedCondition: court.courtCondition || '',
    suggestedType: court.courtType || '',
    suggestedHittingWall: court.hittingWall || false,
    suggestedLights: court.lighted || false,
    suggestedIsPublic: court.isPublic !== false, // Default to true (public) if not specified
  });

  // Debounced address search
  const debouncedAddressSearch = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const suggestions = await searchAddresses(query);
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Address search failed:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    },
    [],
  );

  // Handle address input change with debouncing
  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ ...prev, suggestedAddress: value }));

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      debouncedAddressSearch(value);
    }, 300);
  };

  // Handle address suggestion selection
  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      suggestedAddress: suggestion.address,
      suggestedCity: suggestion.city,
      suggestedZip: suggestion.zip,
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const checkExistingSuggestion = useCallback(async () => {
    try {
      setIsLoadingSuggestions(true);
      // Fetch all suggestions without filtering to find the user's suggestion
      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions?includeAll=true`);
      if (response.ok) {
        const suggestions = await response.json();

        // Find all suggestions for the current user
        const userSuggestions = suggestions.filter((suggestion: Suggestion) => suggestion.suggestedBy === userId);
        // Sort by createdAt descending (most recent first)
        userSuggestions.sort((a: Suggestion, b: Suggestion) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const mostRecentSuggestion = userSuggestions[0] || null;

        if (mostRecentSuggestion) {
          setExistingSuggestion(mostRecentSuggestion);
          const isPending = mostRecentSuggestion.status === 'pending';
          setHasPendingSuggestion(isPending);
        } else {
          setExistingSuggestion(null);
          setHasPendingSuggestion(false);
        }

        return mostRecentSuggestion || null;
      } else {
        console.error('Failed to fetch suggestions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error checking existing suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
    return null;
  }, [court.id, userId]);

  // Check for existing suggestions on component mount and when court changes
  useEffect(() => {
    if (userId) {
      checkExistingSuggestion();
    }
  }, [userId, court.id, checkExistingSuggestion, refreshKey]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current
        && !suggestionsRef.current.contains(event.target as Node)
        && addressInputRef.current
        && !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenModal = async () => {
    // If there's already a pending suggestion, show it
    if (hasPendingSuggestion && existingSuggestion) {
      setShowExistingSuggestion(true);
    } else {
      // Double-check for any existing suggestions before opening the form
      const existing = await checkExistingSuggestion();
      if (existing && existing.status === 'pending') {
        setExistingSuggestion(existing);
        setShowExistingSuggestion(true);
      } else {
        setIsOpen(true);
      }
    }
  };

  const handleEdit = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setShowExistingSuggestion(false);
  };

  const handleDelete = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/tennis-courts/${court.id}/edit-suggestions/${suggestionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowExistingSuggestion(false);
        setExistingSuggestion(null);
        setHasPendingSuggestion(false);
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
        suggestedCondition: formData.get('suggestedCondition') as string,
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
        setHasPendingSuggestion(false);
        onSuggestionSubmitted?.();
        // Refresh the suggestion state
        await checkExistingSuggestion();
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

      // Get the submitted suggestion data
      const submittedSuggestion = await response.json();

      // Show success notification
      setShowSuccess(true);
      setIsOpen(false);

      // Reset form data
      setFormData({
        reason: '',
        suggestedName: court.name,
        suggestedAddress: court.address,
        suggestedCity: court.city,
        suggestedZip: court.zip || '',
        suggestedNumberOfCourts: '',
        suggestedSurface: court.surfaceType,
        suggestedCondition: court.courtCondition || '',
        suggestedType: court.courtType || '',
        suggestedHittingWall: court.hittingWall || false,
        suggestedLights: court.lighted || false,
        suggestedIsPublic: court.isPublic !== false,
      });

      // Update the component state immediately with the new suggestion
      setExistingSuggestion(submittedSuggestion);
      setHasPendingSuggestion(true);

      onSuggestionCreated?.();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit suggestion';
      setErrorMessage(errorMessage);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <CheckCircleIcon className="w-4 h-4 text-yellow-500" />;
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
      {!isLoadingSuggestions && !hasPendingSuggestion && (
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Edit className="w-4 h-4 mr-2" />
          {' '}
          Suggest Edit
        </button>
      )}

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

                {existingSuggestion.suggestedZip && existingSuggestion.suggestedZip !== '00000' && (
                  <p className="text-sm text-gray-600">
                    <strong>Zip Code:</strong>
                    {' '}
                    {existingSuggestion.suggestedZip}
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

                {existingSuggestion.suggestedCondition && (
                  <p className="text-sm text-gray-600">
                    <strong>Condition:</strong>
                    {' '}
                    {capitalizeFirstLetter(existingSuggestion.suggestedCondition)}
                  </p>
                )}

                {existingSuggestion.suggestedType && (
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong>
                    {' '}
                    {existingSuggestion.suggestedType}
                  </p>
                )}

                {existingSuggestion.suggestedHittingWall !== undefined && (
                  <p className="text-sm text-gray-600">
                    <strong>Hitting Wall:</strong>
                    {' '}
                    {existingSuggestion.suggestedHittingWall ? 'Yes' : 'No'}
                  </p>
                )}

                {existingSuggestion.suggestedLights !== undefined && (
                  <p className="text-sm text-gray-600">
                    <strong>Lights:</strong>
                    {' '}
                    {existingSuggestion.suggestedLights ? 'Yes' : 'No'}
                  </p>
                )}

                {existingSuggestion.suggestedIsPublic !== undefined && (
                  <p className="text-sm text-gray-600">
                    <strong>Court Access:</strong>
                    {' '}
                    {existingSuggestion.suggestedIsPublic ? 'Public' : 'Private'}
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

              {existingSuggestion.reason && existingSuggestion.reason.trim() && (
                <div className="text-sm text-gray-600 w-full mt-3 pt-2 border-t border-gray-100">
                  <strong>Additional Notes:</strong>
                  <div className="mt-1">
                    <TruncatableText text={existingSuggestion.reason} />
                  </div>
                </div>
              )}

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
                    <X className="w-4 h-4 inline mr-2" />
                    Delete Suggestion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success notification */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900">
                Suggestion submitted successfully!
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your suggestion has been submitted and is pending review.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Error submitting suggestion
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowError(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
              >
                Close
              </button>
            </div>
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
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {editingSuggestion.reason.length}
                  /100 characters
                </div>
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
                    min="0"
                    max="1000"
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
                    <option value="new">
                      {capitalizeFirstLetter('new')}
                      {' '}
                      (resurfaced in the last year)
                    </option>
                    <option value="like new">
                      {capitalizeFirstLetter('like new')}
                      {' '}
                      (resurfaced in the last 2-3 years)
                    </option>
                    <option value="showing signs of wear">
                      {capitalizeFirstLetter('showing signs of wear')}
                      {' '}
                      (some courts have minor cracks)
                    </option>
                    <option value="rough shape">
                      {capitalizeFirstLetter('rough shape')}
                      {' '}
                      (some courts are unplayable)
                    </option>
                    <option value="terrible">
                      {capitalizeFirstLetter('terrible')}
                      {' '}
                      (all courts are unplayable)
                    </option>
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

                <div className="relative">
                  <label htmlFor="suggestedAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    id="suggestedAddress"
                    type="text"
                    value={formData.suggestedAddress}
                    onChange={e => handleAddressChange(e.target.value)}
                    onBlur={() => debouncedAddressSearch(formData.suggestedAddress)}
                    ref={addressInputRef}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Court address"
                  />

                  {showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {isSearching
                        ? (
                            <div className="p-2 text-gray-500 text-sm">Searching...</div>
                          )
                        : addressSuggestions.length === 0
                          ? (
                              <div className="p-2 text-gray-500 text-sm">No suggestions found.</div>
                            )
                          : (
                              addressSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className="w-full p-2 text-left cursor-pointer hover:bg-blue-100 text-sm focus:bg-blue-100 focus:outline-none"
                                  onClick={() => handleAddressSelect(suggestion)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleAddressSelect(suggestion);
                                    }
                                  }}
                                >
                                  {suggestion.address}
                                  ,
                                  {suggestion.city}
                                  ,
                                  {suggestion.state}
                                  {' '}
                                  {suggestion.zip}
                                </button>
                              ))
                            )}
                    </div>
                  )}
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
                  <label htmlFor="suggestedZip" className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    id="suggestedZip"
                    type="text"
                    value={formData.suggestedZip}
                    onChange={e => handleInputChange('suggestedZip', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Zip code"
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
                    max="1000"
                    value={formData.suggestedNumberOfCourts}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow blank values or valid numbers
                      if (value === '') {
                        handleInputChange('suggestedNumberOfCourts', '');
                      } else {
                        const numValue = Number.parseInt(value);
                        if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
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
                  </select>
                </div>

                <div>
                  <label htmlFor="suggestedCondition" className="block text-sm font-medium text-gray-700 mb-2">
                    Court Condition
                  </label>
                  <select
                    id="suggestedCondition"
                    value={formData.suggestedCondition || ''}
                    onChange={e => handleInputChange('suggestedCondition', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select condition</option>
                    <option value="unknown">Unknown</option>
                    <option value="new">
                      {capitalizeFirstLetter('new')}
                      {' '}
                      (resurfaced in the last year)
                    </option>
                    <option value="like new">
                      {capitalizeFirstLetter('like new')}
                      {' '}
                      (resurfaced in the last 2-3 years)
                    </option>
                    <option value="showing signs of wear">
                      {capitalizeFirstLetter('showing signs of wear')}
                      {' '}
                      (some courts have minor cracks)
                    </option>
                    <option value="rough shape">
                      {capitalizeFirstLetter('rough shape')}
                      {' '}
                      (some courts are unplayable)
                    </option>
                    <option value="terrible">
                      {capitalizeFirstLetter('terrible')}
                      {' '}
                      (all courts are unplayable)
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="suggestedType" className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    id="suggestedType"
                    value={formData.suggestedType || ''}
                    onChange={e => handleInputChange('suggestedType', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="suggestedHittingWall" className="block text-sm font-medium text-gray-700 mb-2">
                    Hitting Wall
                  </label>
                  <select
                    id="suggestedHittingWall"
                    value={formData.suggestedHittingWall ? 'true' : 'false'}
                    onChange={e => handleInputChange('suggestedHittingWall', e.target.value === 'true')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="suggestedLights" className="block text-sm font-medium text-gray-700 mb-2">
                    Lights
                  </label>
                  <select
                    id="suggestedLights"
                    value={formData.suggestedLights ? 'true' : 'false'}
                    onChange={e => handleInputChange('suggestedLights', e.target.value === 'true')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="suggestedIsPublic" className="block text-sm font-medium text-gray-700 mb-2">
                    Court Access
                  </label>
                  <select
                    id="suggestedIsPublic"
                    value={formData.suggestedIsPublic ? 'true' : 'false'}
                    onChange={e => handleInputChange('suggestedIsPublic', e.target.value === 'true')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Public</option>
                    <option value="false">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="reason"
                  value={formData.reason}
                  onChange={e => handleInputChange('reason', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes or explanations for these changes (optional)..."
                  rows={3}
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {formData.reason.length}
                  /100 characters
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
