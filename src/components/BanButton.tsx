'use client';

import { useState } from 'react';
import { Ban, Shield, AlertTriangle, Camera, X } from 'lucide-react';
import type { BanType } from '@/libs/AdminUtils';

type BanButtonProps = {
  userId: string;
  userName: string;
  userEmail?: string;
  banType?: BanType;
  onBanComplete?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
};

export default function BanButton({ 
  userId, 
  userName, 
  userEmail, 
  banType = 'full',
  onBanComplete,
  className = '',
  size = 'sm',
  variant = 'button'
}: BanButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getBanTypeLabel = (type: BanType) => {
    switch (type) {
      case 'full': return 'Full Ban';
      case 'reviews': return 'Ban from Reviews';
      case 'suggestions': return 'Ban from Suggestions';
      case 'photos': return 'Ban from Photos';
      default: return 'Ban User';
    }
  };

  const getBanTypeIcon = (type: BanType) => {
    switch (type) {
      case 'full': return <Ban className="w-4 h-4" />;
      case 'reviews': return <AlertTriangle className="w-4 h-4" />;
      case 'suggestions': return <Shield className="w-4 h-4" />;
      case 'photos': return <Camera className="w-4 h-4" />;
      default: return <Ban className="w-4 h-4" />;
    }
  };

  const handleBanUser = async () => {
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/user-bans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userName,
          userEmail: userEmail || null,
          banReason: banReason.trim() || null,
          banType,
          expiresAt: expiresAt || null,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setBanReason('');
        setExpiresAt('');
        onBanComplete?.();
        alert(`User successfully banned from ${banType === 'full' ? 'all actions' : banType}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    } finally {
      setSubmitting(false);
    }
  };

  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'p-2' : 'px-3 py-1.5 text-sm',
    lg: variant === 'icon' ? 'p-3' : 'px-4 py-2 text-base',
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          bg-[#BFC37C] text-[#7F8B9F] rounded-lg transition-colors border border-[#BFC37C]
          flex items-center gap-2 ${sizeClasses[size]} ${className}
        `}
        title={getBanTypeLabel(banType)}
      >
        {getBanTypeIcon(banType)}
        {variant === 'button' && (
          <span className="hidden sm:inline">
            {banType === 'full' ? 'Ban' : getBanTypeLabel(banType)}
          </span>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#F4F5F6] rounded-lg shadow-lg p-6 w-full max-w-md border border-[#BFC37C] mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#7F8B9F]">
                {getBanTypeLabel(banType)}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#7F8B9F] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-[#F4F5F6] rounded-lg border border-[#BFC37C]">
              <p className="text-[#7F8B9F] text-sm">
                <strong>User:</strong> {userName}
              </p>
              {userEmail && (
                <p className="text-[#7F8B9F] text-sm">
                  <strong>Email:</strong> {userEmail}
                </p>
              )}
              <p className="text-[#7F8B9F] text-xs mt-1">
                <strong>ID:</strong> {userId}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[#7F8B9F] text-sm font-medium mb-2">
                  Reason for Ban (Optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] rounded-lg p-3 focus:outline-none focus:border-[#011B2E] min-h-[80px] resize-none"
                  placeholder={`Explain why this user should be banned from ${banType === 'full' ? 'all actions' : banType}...`}
                  maxLength={500}
                />
                <div className="text-right text-xs text-[#7F8B9F] mt-1">
                  {banReason.length}/500
                </div>
              </div>

              <div>
                <label className="block text-[#7F8B9F] text-sm font-medium mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] rounded-lg p-2 focus:outline-none focus:border-[#011B2E]"
                />
                <p className="text-[#7F8B9F] text-xs mt-1">
                  Leave empty for permanent ban
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleBanUser}
                  disabled={submitting}
                  className="flex-1 bg-[#BFC37C] text-[#7F8B9F] py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 border border-[#BFC37C]"
                >
                  {submitting ? 'Banning...' : `Ban ${banType === 'full' ? 'User' : `from ${banType}`}`}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 bg-[#F4F5F6] text-[#7F8B9F] py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 border border-[#BFC37C]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}