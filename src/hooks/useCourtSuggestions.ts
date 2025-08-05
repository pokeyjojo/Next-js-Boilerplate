import { useCallback, useEffect, useState } from 'react';

export type Suggestion = {
  id: string;
  courtId: number;
  suggestedBy: string;
  suggestedName?: string | null;
  suggestedAddress?: string | null;
  suggestedCity?: string | null;
  suggestedState?: string | null;
  suggestedZip?: string | null;
  suggestedCourtType?: string | null;
  suggestedNumberOfCourts?: number | null;
  suggestedSurface?: string | null;
  suggestedCondition?: string | null;
  suggestedHittingWall?: boolean | null;
  suggestedLights?: boolean | null;
  suggestedIsPublic?: boolean | null;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string | null;
  reviewNote?: string | null;
};

// Cache for court suggestions
const suggestionsCache = new Map<number, {
  data: Suggestion[];
  timestamp: number;
  pendingOnly?: Suggestion[];
}>();

// Request deduplication - track ongoing requests
const ongoingRequests = new Map<string, Promise<Suggestion[]>>();

const CACHE_DURATION = 60 * 1000; // 1 minute cache (reduced for real-time updates)
const subscribers = new Map<number, Set<() => void>>();

// Request deduplication key generator
const getRequestKey = (courtId: number, type: 'all' | 'pending') => `${courtId}-${type}`;

export function useCourtSuggestions(courtId: number, userId?: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSubscribers = useCallback((id: number) => {
    if (!subscribers.has(id)) {
      subscribers.set(id, new Set());
    }
    return subscribers.get(id)!;
  }, []);

  const notifySubscribers = useCallback((id: number) => {
    const courtSubscribers = subscribers.get(id);
    if (courtSubscribers) {
      courtSubscribers.forEach(callback => callback());
    }
  }, []);

  // Deduplicated fetch function
  const fetchSuggestionsDeduped = useCallback(async (type: 'all' | 'pending', force = false): Promise<Suggestion[]> => {
    const now = Date.now();
    const cached = suggestionsCache.get(courtId);
    const requestKey = getRequestKey(courtId, type);

    // Check cache first (unless forced)
    if (!force && cached && (now - cached.timestamp) < CACHE_DURATION) {
      return type === 'pending' ? (cached.pendingOnly || []) : cached.data;
    }

    // Check if request is already ongoing
    const ongoingRequest = ongoingRequests.get(requestKey);
    if (ongoingRequest) {
      // Request deduplication - reuse existing promise
      return ongoingRequest;
    }

    // Make new request with cache-busting if forced
    const cacheBust = force ? `&t=${Date.now()}` : '';
    const endpoint = type === 'all'
      ? `/api/tennis-courts/${courtId}/edit-suggestions?includeAll=true${cacheBust}`
      : `/api/tennis-courts/${courtId}/edit-suggestions?status=pending${cacheBust}`;

    const requestPromise = (async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error(`Error fetching suggestions for ${requestKey}:`, err);
        throw err;
      } finally {
        // Remove from ongoing requests when done
        ongoingRequests.delete(requestKey);
      }
    })();

    // Store the ongoing request
    ongoingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }, [courtId]);

  const fetchSuggestions = useCallback(async (force = false) => {
    const now = Date.now();
    const cached = suggestionsCache.get(courtId);

    if (!force && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setSuggestions(cached.data);
      setPendingSuggestions(cached.pendingOnly || []);
      setLoading(false);
      return cached.data;
    }

    // For unauthenticated users, don't fetch suggestions
    if (!userId) {
      setSuggestions([]);
      setPendingSuggestions([]);
      setLoading(false);
      setError(null);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch both all suggestions and pending in parallel, with deduplication
      const [allData, pendingData] = await Promise.all([
        fetchSuggestionsDeduped('all', force),
        fetchSuggestionsDeduped('pending', force),
      ]);

      // Filter out user's own suggestions from pending if userId provided
      const filteredPending = userId
        ? pendingData.filter((suggestion: Suggestion) => suggestion.suggestedBy !== userId)
        : pendingData;

      // Update cache
      suggestionsCache.set(courtId, {
        data: allData,
        timestamp: now,
        pendingOnly: filteredPending,
      });

      setSuggestions(allData);
      setPendingSuggestions(filteredPending);
      notifySubscribers(courtId);

      return allData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching suggestions:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [courtId, userId, notifySubscribers, fetchSuggestionsDeduped]);

  const refreshSuggestions = useCallback(() => {
    // Clear ongoing requests to force new ones
    const allKey = getRequestKey(courtId, 'all');
    const pendingKey = getRequestKey(courtId, 'pending');
    ongoingRequests.delete(allKey);
    ongoingRequests.delete(pendingKey);

    return fetchSuggestions(true);
  }, [fetchSuggestions, courtId]);

  const getUserSuggestions = useCallback((targetUserId?: string) => {
    const targetId = targetUserId || userId;
    if (!targetId) {
      return [];
    }

    return suggestions
      .filter(suggestion => suggestion.suggestedBy === targetId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [suggestions, userId]);

  const getLatestUserSuggestion = useCallback((targetUserId?: string) => {
    const userSuggestions = getUserSuggestions(targetUserId);
    return userSuggestions[0] || null;
  }, [getUserSuggestions]);

  useEffect(() => {
    const courtSubscribers = getSubscribers(courtId);

    const updateSuggestions = () => {
      const cached = suggestionsCache.get(courtId);
      if (cached) {
        setSuggestions(cached.data);
        setPendingSuggestions(cached.pendingOnly || []);
        setLoading(false);
      }
    };

    courtSubscribers.add(updateSuggestions);

    fetchSuggestions();

    return () => {
      courtSubscribers.delete(updateSuggestions);
    };
  }, [courtId, fetchSuggestions, getSubscribers]);

  return {
    suggestions,
    pendingSuggestions,
    loading,
    error,
    refreshSuggestions,
    getUserSuggestions,
    getLatestUserSuggestion,
  };
}

// Helper function to invalidate cache for a specific court
export function invalidateCourtSuggestionsCache(courtId: number) {
  suggestionsCache.delete(courtId);
  // Also clear any ongoing requests
  const allKey = getRequestKey(courtId, 'all');
  const pendingKey = getRequestKey(courtId, 'pending');
  ongoingRequests.delete(allKey);
  ongoingRequests.delete(pendingKey);
  // Cache invalidated for real-time updates
}

// Helper function to clear all ongoing requests (useful for debugging)
export function clearOngoingRequests() {
  ongoingRequests.clear();
  // All ongoing requests cleared
}
