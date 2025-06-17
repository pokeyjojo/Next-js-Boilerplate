'use client';

import { useEffect, useState } from 'react';

export const CurrentCount = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/counter');
        if (!response.ok) {
          throw new Error('Failed to fetch count');
        }
        const data = await response.json();
        setCount(data.count ?? 0);
      } catch (error) {
        console.error('Error fetching count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading) {
    return <div className="text-sm sm:text-base text-gray-600">Loading...</div>;
  }

  return (
    <div className="text-sm sm:text-base font-medium">
      Current count:
      {' '}
      <span className="font-bold text-blue-600">{count}</span>
    </div>
  );
};
