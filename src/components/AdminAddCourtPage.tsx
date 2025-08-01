'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AdminAddCourt from './AdminAddCourt';

export default function AdminAddCourtPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleCourtAdded = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Court</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add courts directly to the database without requiring approval.
          </p>
        </div>

        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => router.back()}
            className="mr-3 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Add New Court
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Court added successfully!
              </p>
              <p className="mt-1 text-sm text-green-700">
                The court has been added to the database and is now visible to users.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l15 15-15 15" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 18h32" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courts to display</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click the "Add New Court" button above to start adding courts directly to the database.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Court
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdminAddCourt
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCourtAdded={handleCourtAdded}
      />
    </div>
  );
}
