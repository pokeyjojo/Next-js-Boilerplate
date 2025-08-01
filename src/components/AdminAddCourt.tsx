'use client';

import type { AddressSuggestion } from '@/libs/GeocodingService';
import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { searchAddresses } from '@/libs/GeocodingService';
import { capitalizeFirstLetter } from '@/utils/Helpers';

type AdminAddCourtProps = {
  isOpen: boolean;
  onClose: () => void;
  onCourtAdded?: () => void;
};

export default function AdminAddCourt({
  isOpen,
  onClose,
  onCourtAdded,
}: AdminAddCourtProps) {
  const { user } = useUser();
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
    isPublic: true,
    membershipRequired: false,
    parking: false,
  });

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Custom handler for the private court checkbox that updates both fields
  const handlePrivateCourtChange = (isPrivate: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPublic: !isPrivate,
      membershipRequired: isPrivate,
    }));
  };

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
      isPublic: true,
      membershipRequired: false,
      parking: false,
    });
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setShowError(false);
    setErrorMessage('');
  };

  // Address autocomplete logic
  const handleAddressSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const suggestions = await searchAddresses(searchTerm);
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddressInputChange = (value: string) => {
    handleInputChange('address', value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleAddressSearch(value);
    }, 300);
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      address: suggestion.address,
      city: suggestion.city || '',
      state: suggestion.state || 'IL',
      zip: suggestion.zip || '',
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

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
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be signed in to add a court');
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
      const response = await fetch('/api/admin/courts', {
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
          isPublic: formData.isPublic,
          membershipRequired: formData.membershipRequired,
          parking: formData.parking,
        }),
      });

      if (response.ok) {
        setShowError(false);
        resetForm();
        onCourtAdded?.();
        onClose();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to add court');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error adding court:', error);
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
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add New Court</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {showError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Required Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Court Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter court name"
                />
              </div>

              <div className="relative">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  ref={addressInputRef}
                  id="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => handleAddressInputChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start typing an address..."
                />

                {showSuggestions && addressSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {isSearching && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Searching...
                      </div>
                    )}
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{suggestion.address}</div>
                        <div className="text-sm text-gray-600">
                          {suggestion.city && `${suggestion.city}, `}
                          {suggestion.state}
                          {' '}
                          {suggestion.zip}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={e => handleInputChange('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  id="state"
                  required
                  value={formData.state}
                  onChange={e => handleInputChange('state', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="IL">IL</option>
                  <option value="IN">IN</option>
                  <option value="WI">WI</option>
                  <option value="MI">MI</option>
                  <option value="IA">IA</option>
                  <option value="MO">MO</option>
                  <option value="OH">OH</option>
                  <option value="KY">KY</option>
                </select>
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code *
                </label>
                <input
                  id="zip"
                  type="text"
                  required
                  value={formData.zip}
                  onChange={e => handleInputChange('zip', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter zip code"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Court Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="courtType" className="block text-sm font-medium text-gray-700 mb-2">
                  Court Type
                </label>
                <select
                  id="courtType"
                  value={formData.courtType}
                  onChange={e => handleInputChange('courtType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
              </div>

              <div>
                <label htmlFor="numberOfCourts" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Courts
                </label>
                <input
                  id="numberOfCourts"
                  type="number"
                  min="1"
                  value={formData.numberOfCourts}
                  onChange={e => handleInputChange('numberOfCourts', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Number of courts (leave blank for unknown)"
                />
              </div>

              <div>
                <label htmlFor="surface" className="block text-sm font-medium text-gray-700 mb-2">
                  Surface Type
                </label>
                <select
                  id="surface"
                  value={formData.surface}
                  onChange={e => handleInputChange('surface', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select surface type</option>
                  <option value="Hard">Hard</option>
                  <option value="Clay">Clay</option>
                  <option value="Grass">Grass</option>
                  <option value="Carpet">Carpet</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label htmlFor="courtCondition" className="block text-sm font-medium text-gray-700 mb-2">
                  Court Condition
                </label>
                <select
                  id="courtCondition"
                  value={formData.courtCondition}
                  onChange={e => handleInputChange('courtCondition', e.target.value)}
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

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.lighted}
                  onChange={e => handleInputChange('lighted', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Lighted</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hittingWall}
                  onChange={e => handleInputChange('hittingWall', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Hitting Wall</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!formData.isPublic}
                  onChange={e => handlePrivateCourtChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Private Court (Membership Required)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.parking}
                  onChange={e => handleInputChange('parking', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Parking Available</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding Court...' : 'Add Court'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
