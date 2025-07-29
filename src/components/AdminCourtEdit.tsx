'use client';

import { CheckCircle, Edit, Save, X } from 'lucide-react';
import { useState } from 'react';

type Court = {
  id: string;
  name: string;
  address: string;
  city: string;
  numberOfCourts: number;
  surfaceType: string;
};

type AdminCourtEditProps = {
  court: Court;
  onCourtUpdated?: (updatedCourt: Court) => void;
};

export default function AdminCourtEdit({ court, onCourtUpdated }: AdminCourtEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: court.name,
    address: court.address,
    city: court.city,
    numberOfCourts: court.numberOfCourts,
    surfaceType: court.surfaceType,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/courts/${court.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update court');
      }

      const updatedCourt = await response.json();
      setIsEditing(false);

      // Show success notification
      setShowSuccess(true);
      onCourtUpdated?.(updatedCourt);

      // Hide success notification after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating court:', error);
      // Show error in console instead of alert
      console.error('Error:', error instanceof Error ? error.message : 'Failed to update court');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: court.name,
      address: court.address,
      city: court.city,
      numberOfCourts: court.numberOfCourts,
      surfaceType: court.surfaceType,
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isEditing) {
    return (
      <>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Court (Admin)
        </button>

        {/* Success Notification */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
                  <p className="text-gray-600">Court information has been updated successfully.</p>
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
      </>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Edit Court Information</h3>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
            Court Name
          </label>
          <input
            id="adminName"
            type="text"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="adminAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            id="adminAddress"
            type="text"
            value={formData.address}
            onChange={e => handleInputChange('address', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="adminCity" className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            id="adminCity"
            type="text"
            value={formData.city}
            onChange={e => handleInputChange('city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="adminNumberOfCourts" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Courts
          </label>
          <input
            id="adminNumberOfCourts"
            type="number"
            min="1"
            value={formData.numberOfCourts}
            onChange={e => handleInputChange('numberOfCourts', Number.parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="adminSurfaceType" className="block text-sm font-medium text-gray-700 mb-2">
            Surface Type
          </label>
          <select
            id="adminSurfaceType"
            value={formData.surfaceType || ''}
            onChange={e => handleInputChange('surfaceType', e.target.value)}
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

      <div className="flex justify-end space-x-3 mt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
