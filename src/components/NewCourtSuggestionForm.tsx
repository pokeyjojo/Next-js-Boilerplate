'use client';

import type { AddressSuggestion } from '@/libs/GeocodingService';
import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUserBanStatus } from '@/hooks/useUserBanStatus';
import { searchAddresses } from '@/libs/GeocodingService';
import { capitalizeFirstLetter } from '@/utils/Helpers';

type NewCourtSuggestionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuggestionSubmitted?: () => void;
};

export default function NewCourtSuggestionForm({
  isOpen,
  onClose,
  onSuggestionSubmitted,
}: NewCourtSuggestionFormProps) {
  const { user } = useUser();
  const { isBanned } = useUserBanStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: 'IL',
    zip: '',
    courtType: '',
    numberOfCourts: '',
    surface: '',
    courtCondition: '',
    hittingWall: false,
    lighted: false,
    membershipRequired: false,
    parking: false,
  });

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
    setFormData(prev => ({ ...prev, address: value }));

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
      address: suggestion.address,
      city: suggestion.city,
      zip: suggestion.zip,
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

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

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: 'IL',
      zip: '',
      courtType: '',
      numberOfCourts: '',
      surface: '',
      courtCondition: '',
      hittingWall: false,
      lighted: false,
      membershipRequired: false,
      parking: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be signed in to suggest a court');
      setShowError(true);
      return;
    }

    if (isBanned) {
      setErrorMessage('You are banned from submitting content');
      setShowError(true);
      return;
    }

    if (!formData.name || !formData.address || !formData.city || !formData.zip) {
      setErrorMessage('Name, address, city, and zip code are required');
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    setShowError(false);

    try {
      const response = await fetch('/api/court-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          courtType: formData.courtType || null,
          numberOfCourts: formData.numberOfCourts ? Number.parseInt(formData.numberOfCourts) : null,
          surface: formData.surface || null,
          courtCondition: formData.courtCondition || null,
          hittingWall: formData.hittingWall,
          lighted: formData.lighted,
          membershipRequired: formData.membershipRequired,
          parking: formData.parking,
        }),
      });

      if (response.ok) {
        setShowError(false); // Clear any previous error messages
        resetForm();
        onSuggestionSubmitted?.();
        // Remove the automatic closure - parent component handles this now
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to submit court suggestion');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error submitting court suggestion:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowError(false);
    resetForm();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#002C4D] rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-[#69F0FD]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#BFC3C7]">Suggest a New Court</h2>
          <button
            onClick={handleClose}
            className="text-[#BFC3C7] hover:text-[#69F0FD] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {showError && (
          <div className="mb-4 p-4 bg-[#EC0037]/20 border border-[#EC0037] rounded-lg">
            <p className="text-[#EC0037] font-medium">Error</p>
            <p className="text-[#EC0037]/80 text-sm mt-1">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#69F0FD]/10 border border-[#69F0FD] rounded-lg p-4">
            <h3 className="text-lg font-medium text-[#69F0FD] mb-2">Required Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  Court Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] placeholder-[#7F8B95] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
                  placeholder="e.g., Central Park Tennis Courts"
                />
              </div>

              <div className="relative">
                <label htmlFor="address" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  Address *
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => handleAddressChange(e.target.value)}
                  onBlur={() => debouncedAddressSearch(formData.address)}
                  ref={addressInputRef}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] placeholder-[#7F8B95] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
                  placeholder="e.g., 123 Tennis Lane"
                />

                {showSuggestions && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 w-full bg-[#011B2E] border border-[#69F0FD] rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {isSearching
                      ? (
                          <div className="p-2 text-[#7F8B95] text-sm">Searching...</div>
                        )
                      : addressSuggestions.length === 0
                        ? (
                            <div className="p-2 text-[#7F8B95] text-sm">No suggestions found.</div>
                          )
                        : (
                            addressSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full p-2 text-left cursor-pointer hover:bg-[#69F0FD]/20 text-sm focus:bg-[#69F0FD]/20 focus:outline-none text-[#BFC3C7]"
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
                <label htmlFor="city" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={e => handleInputChange('city', e.target.value)}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] placeholder-[#7F8B95] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
                  placeholder="e.g., Chicago"
                />
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  Zip Code *
                </label>
                <input
                  id="zip"
                  type="text"
                  required
                  value={formData.zip}
                  onChange={e => handleInputChange('zip', e.target.value)}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] placeholder-[#7F8B95] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
                  placeholder="e.g., 10001"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#918AB5]/10 border border-[#918AB5] rounded-lg p-4">
            <h3 className="text-lg font-medium text-[#918AB5] mb-2">Additional Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="courtType" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  Court Type
                </label>
                <select
                  id="courtType"
                  value={formData.courtType}
                  onChange={e => handleInputChange('courtType', e.target.value)}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
                >
                  <option value="">Select court type</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div>
                <label htmlFor="numberOfCourts" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  Number of Courts
                </label>
                <input
                  id="numberOfCourts"
                  type="number"
                  min="1"
                  value={formData.numberOfCourts}
                  onChange={e => handleInputChange('numberOfCourts', e.target.value)}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] placeholder-[#7F8B95] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
                  placeholder="e.g., 4"
                />
              </div>

              <div>
                <label htmlFor="surface" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  Surface Type
                </label>
                <select
                  id="surface"
                  value={formData.surface}
                  onChange={e => handleInputChange('surface', e.target.value)}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
                >
                  <option value="">Select surface</option>
                  <option value="Hard">Hard</option>
                  <option value="Clay">Clay</option>
                  <option value="Grass">Grass</option>
                  <option value="Carpet">Carpet</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label htmlFor="courtCondition" className="block text-sm font-medium text-[#BFC3C7] mb-2">
                  Court Condition
                </label>
                <select
                  id="courtCondition"
                  value={formData.courtCondition}
                  onChange={e => handleInputChange('courtCondition', e.target.value)}
                  className="w-full border border-[#69F0FD] rounded-lg px-3 py-2 bg-[#011B2E] text-[#BFC3C7] focus:ring-2 focus:ring-[#69F0FD] focus:border-[#69F0FD] focus:outline-none"
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

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.lighted}
                  onChange={e => handleInputChange('lighted', e.target.checked)}
                  className="h-4 w-4 text-[#69F0FD] focus:ring-[#69F0FD] border-[#69F0FD] rounded"
                />
                <span className="text-sm text-[#BFC3C7]">Lighted</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hittingWall}
                  onChange={e => handleInputChange('hittingWall', e.target.checked)}
                  className="h-4 w-4 text-[#69F0FD] focus:ring-[#69F0FD] border-[#69F0FD] rounded"
                />
                <span className="text-sm text-[#BFC3C7]">Hitting Wall</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.membershipRequired}
                  onChange={e => handleInputChange('membershipRequired', e.target.checked)}
                  className="h-4 w-4 text-[#69F0FD] focus:ring-[#69F0FD] border-[#69F0FD] rounded"
                />
                <span className="text-sm text-[#BFC3C7]">Private Court (Membership Required)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.parking}
                  onChange={e => handleInputChange('parking', e.target.checked)}
                  className="h-4 w-4 text-[#69F0FD] focus:ring-[#69F0FD] border-[#69F0FD] rounded"
                />
                <span className="text-sm text-[#BFC3C7]">Parking Available</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-[#27131D] bg-[#EBEDEE] border border-[#BFC3C7] rounded-lg hover:bg-[#BFC3C7] focus:ring-2 focus:ring-[#7F8B95] focus:ring-offset-2 transition-colors shadow"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isBanned}
              className="px-6 py-2 bg-[#EC0037] text-white rounded-lg hover:bg-[#4A1C23] focus:ring-2 focus:ring-[#EC0037] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isBanned ? 'Banned from submitting' : isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
