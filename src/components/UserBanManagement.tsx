'use client';

import { useState, useEffect } from 'react';
import { Ban, Shield, Clock, User, AlertTriangle, X, Plus, Search, Users } from 'lucide-react';

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

type LookupUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  createdAt: number;
  lastSignInAt: number | null;
  imageUrl: string;
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
  
  // User lookup state
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupType, setLookupType] = useState<'id' | 'email' | 'name'>('id');
  const [lookupResults, setLookupResults] = useState<LookupUser[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

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

  const handleUserLookup = async () => {
    if (!lookupQuery.trim()) {
      return;
    }

    setLookupLoading(true);
    try {
      const url = new URL('/api/admin/user-lookup', window.location.origin);
      url.searchParams.set('query', lookupQuery.trim());
      url.searchParams.set('type', lookupType);

      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        setLookupResults(data.users || []);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        setLookupResults([]);
      }
    } catch (error) {
      console.error('Error looking up user:', error);
      alert('Failed to lookup user');
      setLookupResults([]);
    } finally {
      setLookupLoading(false);
    }
  };

  const selectUser = (user: LookupUser) => {
    setFormData({
      ...formData,
      userId: user.id,
      userName: user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.username,
      userEmail: user.email,
    });
    setShowUserLookup(false);
    setLookupQuery('');
    setLookupResults([]);
  };

  const openUserLookup = () => {
    setShowUserLookup(true);
    setLookupQuery('');
    setLookupResults([]);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-[#002C4D] rounded-lg shadow-lg w-full max-w-md border border-[#BFC3C7] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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
              {/* User Lookup Button */}
              <div className="mb-4 p-3 bg-[#011B2E] rounded-lg border border-[#BFC3C7]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">
                    <Users className="w-4 h-4 inline mr-2" />
                    Quick User Lookup
                  </span>
                  <button
                    type="button"
                    onClick={openUserLookup}
                    className="bg-[#69F0FD] hover:bg-[#918AB5] text-[#002C4D] px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    <Search className="w-4 h-4 inline mr-1" />
                    Search Users
                  </button>
                </div>
                <p className="text-[#BFC3C7] text-xs">
                  Search by User ID, Email, or Name to auto-fill the form below
                </p>
              </div>

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
        </div>
      )}

      {/* User Lookup Modal */}
      {showUserLookup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-[#002C4D] rounded-lg shadow-lg w-full max-w-2xl border border-[#BFC3C7] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                <Search className="w-5 h-5 inline mr-2" />
                Search Users
              </h3>
              <button
                onClick={() => setShowUserLookup(false)}
                className="text-[#BFC3C7] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Search Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Search Type
                  </label>
                  <select
                    value={lookupType}
                    onChange={(e) => setLookupType(e.target.value as 'id' | 'email' | 'name')}
                    className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD]"
                  >
                    <option value="id">User ID</option>
                    <option value="email">Email Address</option>
                    <option value="name">Name</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder={
                      lookupType === 'id' ? 'Enter user ID...' :
                      lookupType === 'email' ? 'Enter email address...' :
                      'Enter first or last name...'
                    }
                    className="w-full bg-[#011B2E] text-white border border-[#BFC3C7] rounded-lg p-2 focus:outline-none focus:border-[#69F0FD]"
                    onKeyDown={(e) => e.key === 'Enter' && handleUserLookup()}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleUserLookup}
                    disabled={lookupLoading || !lookupQuery.trim()}
                    className="w-full bg-[#69F0FD] hover:bg-[#918AB5] text-[#002C4D] py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {lookupLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-64 overflow-y-auto">
                {lookupResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white font-medium mb-2">
                      Found {lookupResults.length} user{lookupResults.length !== 1 ? 's' : ''}:
                    </h4>
                    {lookupResults.map((user) => (
                      <div
                        key={user.id}
                        className="bg-[#011B2E] border border-[#BFC3C7] rounded-lg p-3 hover:border-[#69F0FD] transition-colors cursor-pointer"
                        onClick={() => selectUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">
                              {user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.username || 'Unnamed User'}
                            </p>
                            <p className="text-[#BFC3C7] text-sm">{user.email}</p>
                            <p className="text-[#7F8B95] text-xs">ID: {user.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#69F0FD] text-sm font-medium">Click to select</p>
                            {user.lastSignInAt && (
                              <p className="text-[#7F8B95] text-xs">
                                Last seen: {new Date(user.lastSignInAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {lookupResults.length === 0 && lookupQuery && !lookupLoading && (
                  <div className="text-center py-8">
                    <p className="text-[#BFC3C7]">No users found matching "{lookupQuery}"</p>
                    <p className="text-[#7F8B95] text-sm mt-1">
                      Try a different search term or search type
                    </p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}