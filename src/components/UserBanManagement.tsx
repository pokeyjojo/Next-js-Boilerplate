'use client';

import { useState, useEffect } from 'react';
import { Ban, Shield, Clock, User, AlertTriangle, X, Plus } from 'lucide-react';

type UserBan = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  bannedBy: string;
  bannedByUserName: string;
  banReason: string;
  banType: 'full' | 'reviews' | 'suggestions' | 'photos';
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BanFormData = {
  userId: string;
  userName: string;
  userEmail: string;
  banReason: string;
  banType: 'full' | 'reviews' | 'suggestions' | 'photos';
  expiresAt: string;
};

export default function UserBanManagement() {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBanModal, setShowBanModal] = useState(false);
  const [formData, setFormData] = useState<BanFormData>({
    userId: '',
    userName: '',
    userEmail: '',
    banReason: '',
    banType: 'full',
    expiresAt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active');

  useEffect(() => {
    fetchBans();
  }, []);

  const fetchBans = async () => {
    try {
      const response = await fetch('/api/admin/user-bans');
      if (response.ok) {
        const data = await response.json();
        setBans(data);
      }
    } catch (error) {
      console.error('Error fetching bans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/user-bans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: formData.userId,
          userName: formData.userName,
          userEmail: formData.userEmail || null,
          banReason: formData.banReason || null,
          banType: formData.banType,
          expiresAt: formData.expiresAt || null,
        }),
      });

      if (response.ok) {
        setShowBanModal(false);
        setFormData({
          userId: '',
          userName: '',
          userEmail: '',
          banReason: '',
          banType: 'full',
          expiresAt: '',
        });
        await fetchBans();
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

  const handleUnbanUser = async (userId: string, banType?: string) => {
    if (!confirm('Are you sure you want to unban this user?')) {
      return;
    }

    try {
      const url = new URL('/api/admin/user-bans', window.location.origin);
      url.searchParams.set('userId', userId);
      if (banType) {
        url.searchParams.set('banType', banType);
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBans();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user');
    }
  };

  const getBanTypeColor = (banType: string) => {
    switch (banType) {
      case 'full': return 'bg-[#EC0037] text-white';
      case 'reviews': return 'bg-[#4A1C23] text-white';
      case 'suggestions': return 'bg-[#50394D] text-white';
      case 'photos': return 'bg-[#918AB5] text-white';
      default: return 'bg-[#7F8B95] text-white';
    }
  };

  const getBanTypeIcon = (banType: string) => {
    switch (banType) {
      case 'full': return <Ban className="w-4 h-4" />;
      case 'reviews': return <AlertTriangle className="w-4 h-4" />;
      case 'suggestions': return <Shield className="w-4 h-4" />;
      case 'photos': return <User className="w-4 h-4" />;
      default: return <Ban className="w-4 h-4" />;
    }
  };

  const isExpired = (ban: UserBan) => {
    if (!ban.expiresAt) return false;
    return new Date(ban.expiresAt) < new Date();
  };

  const filteredBans = bans.filter(ban => {
    switch (filter) {
      case 'active': return ban.isActive && !isExpired(ban);
      case 'expired': return !ban.isActive || isExpired(ban);
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-[#BFC3C7]">Loading user bans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-[#69F0FD] text-[#002C4D] font-medium'
                : 'bg-[#50394D] text-[#BFC3C7] hover:bg-[#918AB5]'
            }`}
          >
            All ({bans.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'active'
                ? 'bg-[#69F0FD] text-[#002C4D] font-medium'
                : 'bg-[#50394D] text-[#BFC3C7] hover:bg-[#918AB5]'
            }`}
          >
            Active ({bans.filter(ban => ban.isActive && !isExpired(ban)).length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'expired'
                ? 'bg-[#69F0FD] text-[#002C4D] font-medium'
                : 'bg-[#50394D] text-[#BFC3C7] hover:bg-[#918AB5]'
            }`}
          >
            Inactive ({bans.filter(ban => !ban.isActive || isExpired(ban)).length})
          </button>
        </div>

        <button
          onClick={() => setShowBanModal(true)}
          className="flex items-center gap-2 bg-[#EC0037] text-white px-4 py-2 rounded-lg hover:bg-[#4A1C23] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ban User
        </button>
      </div>

      {/* Bans List */}
      <div className="grid gap-4">
        {filteredBans.length === 0 ? (
          <div className="text-center py-12 text-[#BFC3C7]">
            No bans found for the selected filter.
          </div>
        ) : (
          filteredBans.map(ban => (
            <div
              key={ban.id}
              className={`bg-[#011B2E] border border-[#BFC3C7] rounded-lg p-6 ${
                !ban.isActive || isExpired(ban) ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getBanTypeColor(ban.banType)}`}>
                    {getBanTypeIcon(ban.banType)}
                    {ban.banType.charAt(0).toUpperCase() + ban.banType.slice(1)} Ban
                  </div>
                  {(!ban.isActive || isExpired(ban)) && (
                    <div className="bg-[#7F8B95] text-white px-3 py-1 rounded-full text-sm">
                      Inactive
                    </div>
                  )}
                  {ban.expiresAt && (
                    <div className="flex items-center gap-1 text-[#BFC3C7] text-sm">
                      <Clock className="w-4 h-4" />
                      {isExpired(ban) ? 'Expired' : 'Expires'}: {new Date(ban.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {ban.isActive && !isExpired(ban) && (
                  <button
                    onClick={() => handleUnbanUser(ban.userId, ban.banType)}
                    className="bg-[#918AB5] text-white px-3 py-1 rounded-lg hover:bg-[#50394D] transition-colors text-sm"
                  >
                    Unban
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">{ban.userName}</h3>
                  {ban.userEmail && (
                    <p className="text-[#BFC3C7] text-sm mb-2">{ban.userEmail}</p>
                  )}
                  <p className="text-[#BFC3C7] text-sm">User ID: {ban.userId}</p>
                </div>

                <div>
                  <p className="text-[#BFC3C7] text-sm mb-2">
                    <strong>Banned by:</strong> {ban.bannedByUserName}
                  </p>
                  <p className="text-[#BFC3C7] text-sm">
                    <strong>Date:</strong> {new Date(ban.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {ban.banReason && (
                <div className="mt-4 p-3 bg-[#002C4D] rounded-lg">
                  <p className="text-white font-medium mb-1">Reason:</p>
                  <p className="text-[#BFC3C7] text-sm">{ban.banReason}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Ban User Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#002C4D] rounded-lg shadow-lg p-6 w-full max-w-md border border-[#BFC3C7]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Ban User</h3>
              <button
                onClick={() => setShowBanModal(false)}
                className="text-[#BFC3C7] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBanUser} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  User ID <span className="text-[#EC0037]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD]"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  User Name <span className="text-[#EC0037]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({...formData, userName: e.target.value})}
                  className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD]"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  User Email
                </label>
                <input
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
                  className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD]"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Ban Type <span className="text-[#EC0037]">*</span>
                </label>
                <select
                  value={formData.banType}
                  onChange={(e) => setFormData({...formData, banType: e.target.value as any})}
                  className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD]"
                  required
                >
                  <option value="full">Full Ban (All Actions)</option>
                  <option value="reviews">Reviews Only</option>
                  <option value="suggestions">Suggestions Only</option>
                  <option value="photos">Photos Only</option>
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.banReason}
                  onChange={(e) => setFormData({...formData, banReason: e.target.value})}
                  className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD] min-h-[80px]"
                  placeholder="Explain why this user is being banned..."
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD]"
                />
                <p className="text-[#BFC3C7] text-xs mt-1">
                  Leave empty for permanent ban
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#EC0037] text-white py-2 rounded-lg font-semibold hover:bg-[#4A1C23] transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Banning...' : 'Ban User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBanModal(false)}
                  className="flex-1 bg-[#50394D] text-[#BFC3C7] py-2 rounded-lg font-semibold hover:bg-[#918AB5] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}