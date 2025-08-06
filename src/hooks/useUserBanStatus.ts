import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function useUserBanStatus() {
  const { user } = useUser();
  const [isBanned, setIsBanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkBanStatus() {
      if (!user) {
        setIsBanned(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/user/ban-status');
        if (response.ok) {
          const data = await response.json();
          setIsBanned(data.isBanned);
        } else {
          setIsBanned(false);
        }
      } catch (error) {
        console.error('Error checking ban status:', error);
        setIsBanned(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkBanStatus();
  }, [user?.id]);

  return { isBanned, isLoading };
}