'use client';

import { Check, Clock, MapPin, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

type UserCourtSuggestion = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedByUserName?: string;
  reviewNote?: string;
  reviewedAt?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  courtType?: string;
  numberOfCourts?: number;
  surface?: string;
  courtCondition?: string;
  hittingWall?: boolean;
  lighted?: boolean;
  membershipRequired?: boolean;
  parking?: boolean;
  createdAt: string;
};

export default function UserCourtSuggestionsDashboard() {
  const [suggestions, setSuggestions] = useState<UserCourtSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await fetch('/api/court-suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching court suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Your court suggestion has been approved and added to the map!';
      case 'rejected':
        return 'Your court suggestion was not approved.';
      default:
        return 'Your court suggestion is being reviewed by our team.';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Court Suggestions</h1>
        <div className="text-sm text-gray-600">
          {suggestions.length}
          {' '}
          suggestion
          {suggestions.length !== 1 ? 's' : ''}
          {' '}
          submitted
        </div>
      </div>

      {suggestions.length === 0
        ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No court suggestions yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any court suggestions. Help expand our tennis court database!
              </p>
            </div>
          )
        : (
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{suggestion.name}</h3>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(suggestion.status)}`}>
                          {getStatusIcon(suggestion.status)}
                          <span className="capitalize">{suggestion.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {suggestion.address}
                          ,
                          {' '}
                          {suggestion.city}
                          ,
                          {' '}
                          {suggestion.state}
                          {' '}
                          {suggestion.zip}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted on
                        {' '}
                        {formatDate(suggestion.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-700 font-medium mb-1">Status Update:</p>
                    <p className="text-sm text-gray-600">{getStatusMessage(suggestion.status)}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    {suggestion.courtType && (
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-1 text-gray-600">{suggestion.courtType}</span>
                      </div>
                    )}
                    {suggestion.numberOfCourts && (
                      <div>
                        <span className="font-medium text-gray-700">Courts:</span>
                        <span className="ml-1 text-gray-600">{suggestion.numberOfCourts}</span>
                      </div>
                    )}
                    {suggestion.surface && (
                      <div>
                        <span className="font-medium text-gray-700">Surface:</span>
                        <span className="ml-1 text-gray-600">{suggestion.surface}</span>
                      </div>
                    )}
                    {suggestion.courtCondition && (
                      <div>
                        <span className="font-medium text-gray-700">Condition:</span>
                        <span className="ml-1 text-gray-600">{suggestion.courtCondition}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {suggestion.lighted && (
                      <span className="px-2 py-1 bg-[#69F0FD] text-[#27131D] text-xs rounded-full shadow">Lighted</span>
                    )}
                    {suggestion.hittingWall && (
                      <span className="px-2 py-1 bg-[#69F0FD] text-[#27131D] text-xs rounded-full shadow">Hitting Wall</span>
                    )}
                    {suggestion.membershipRequired && (
                      <span className="px-2 py-1 bg-[#EC0037] text-white text-xs rounded-full shadow">Membership Required</span>
                    )}
                    {suggestion.parking && (
                      <span className="px-2 py-1 bg-[#002C4D] text-white text-xs rounded-full shadow">Parking Available</span>
                    )}
                  </div>

                  {suggestion.status !== 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">
                          {suggestion.status === 'approved' ? 'Approved' : 'Reviewed'}
                          {' '}
                          by
                          {suggestion.reviewedByUserName}
                        </span>
                        {suggestion.reviewedAt && (
                          <span className="ml-2">
                            on
                            {formatDate(suggestion.reviewedAt)}
                          </span>
                        )}
                      </p>
                      {suggestion.reviewNote && (
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Note:</span>
                          {' '}
                          {suggestion.reviewNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
    </div>
  );
}
