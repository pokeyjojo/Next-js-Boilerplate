'use client';

import { useEffect, useState } from 'react';
import { getDb } from '@/libs/DB';
import { counterSchema } from '@/models/Schema';

export default function CurrentCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const db = await getDb();
        const result = await db.select().from(counterSchema);
        setCount(result[0]?.count ?? 0);
      } catch (error) {
        console.error('Error fetching count:', error);
      }
    };

    fetchCount();
  }, []);

  if (count === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      Current count:
      {count}
    </div>
  );
}
