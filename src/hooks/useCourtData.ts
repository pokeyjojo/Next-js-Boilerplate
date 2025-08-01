import { useCallback, useEffect, useState } from 'react';

export type TennisCourt = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  lighted: boolean;
  membership_required: boolean;
  court_type: string | null;
  hitting_wall: boolean;
  court_condition: string | null;
  number_of_courts: number | null;
  surface: string | null;
  parking: boolean | null;
  average_rating: number;
  review_count: number;
  is_public: boolean;
};

let cachedCourts: TennisCourt[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const subscribers = new Set<() => void>();

export function useCourtData() {
  const [courts, setCourts] = useState<TennisCourt[]>(cachedCourts || []);
  const [loading, setLoading] = useState(!cachedCourts);
  const [error, setError] = useState<string | null>(null);

  const notifySubscribers = useCallback(() => {
    subscribers.forEach(callback => callback());
  }, []);

  const fetchCourts = useCallback(async (force = false) => {
    const now = Date.now();

    if (!force && cachedCourts && (now - cacheTimestamp) < CACHE_DURATION) {
      setCourts(cachedCourts);
      setLoading(false);
      return cachedCourts;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/courts');
      if (!response.ok) {
        throw new Error('Failed to fetch tennis courts');
      }

      const data = await response.json();
      cachedCourts = data;
      cacheTimestamp = now;
      setCourts(data);
      notifySubscribers();

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching courts:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [notifySubscribers]);

  const refreshCourts = useCallback(() => {
    return fetchCourts(true);
  }, [fetchCourts]);

  useEffect(() => {
    const updateCourts = () => {
      if (cachedCourts) {
        setCourts(cachedCourts);
        setLoading(false);
      }
    };

    subscribers.add(updateCourts);

    if (!cachedCourts) {
      fetchCourts();
    }

    return () => {
      subscribers.delete(updateCourts);
    };
  }, [fetchCourts]);

  return {
    courts,
    loading,
    error,
    refreshCourts,
    fetchCourts,
  };
}
