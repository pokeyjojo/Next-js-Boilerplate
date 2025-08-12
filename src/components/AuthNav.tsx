'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getI18nPath } from '@/utils/Helpers';

type AuthNavProps = {
  hideButtons?: boolean;
};

export default function AuthNav({ hideButtons = false }: AuthNavProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const params = useParams();
  const locale = params.locale as string;
  const [isCourtDetailsOpen, setIsCourtDetailsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if court details panel is open by looking for CSS class on body
  useEffect(() => {
    const checkCourtDetailsOpen = () => {
      setIsCourtDetailsOpen(document.body.classList.contains('court-details-open'));
    };

    // Check initially
    checkCourtDetailsOpen();

    // Set up observer to watch for class changes
    const observer = new MutationObserver(checkCourtDetailsOpen);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <>
        {/* Mobile loading skeleton */}
        <div className="lg:hidden fixed top-2 right-4 z-[1000]">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Desktop loading skeleton */}
        <div className="hidden lg:block fixed top-3 right-3 z-[1000]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  // If user is signed in, show profile picture
  if (isSignedIn && user) {
    // Hide profile picture when court details panel is open
    if (isCourtDetailsOpen) {
      return null;
    }

    return (
      <>
        {/* Mobile: Profile picture in top banner */}
        <div className="lg:hidden fixed top-2 right-4 z-[1000]">
          <Link
            href={getI18nPath('/dashboard/user-profile', locale)}
            className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-2 border-[#69F0FD] hover:border-[#918AB5] transition-colors shadow-lg bg-white"
          >
            {user.imageUrl
              ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                )
              : (
                  <div className="w-full h-full bg-[#EC0037] flex items-center justify-center text-white font-semibold text-lg">
                    {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0] || 'U'}
                  </div>
                )}
          </Link>
        </div>

        {/* Desktop: Profile picture at top right */}
        <div className="hidden lg:block fixed top-3 right-3 z-[1000]">
          <Link
            href={getI18nPath('/dashboard/user-profile', locale)}
            className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-colors shadow-sm hover:shadow-md"
          >
            {user.imageUrl
              ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                )
              : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                    {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0] || 'U'}
                  </div>
                )}
          </Link>
        </div>
      </>
    );
  }

  // If user is not signed in, show sign-in/sign-up buttons
  if (hideButtons || isCourtDetailsOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile: Top right navigation - same position as profile icon when signed in */}
      <div className="lg:hidden fixed top-36 right-4 z-[1000] flex flex-row gap-2 max-w-[280px]">
        <Link
          href={getI18nPath('/sign-in', locale)}
          className="inline-flex items-center justify-center rounded-lg border-2 border-[#50394D] bg-[#002C4D] px-3 py-2.5 text-xs font-medium text-[#BFC3C7] shadow-lg transition-all hover:bg-[#27131D] hover:border-[#69F0FD] hover:text-[#69F0FD] min-h-[44px] backdrop-blur-sm bg-opacity-95"
        >
          Sign in
        </Link>
        <Link
          href={getI18nPath('/sign-up', locale)}
          className="inline-flex items-center justify-center rounded-lg border-2 border-[#69F0FD] bg-[#69F0FD] px-3 py-2.5 text-xs font-medium text-[#27131D] shadow-lg transition-all hover:bg-[#4DADE3] hover:border-[#4DADE3] min-h-[44px] font-semibold backdrop-blur-sm bg-opacity-95"
        >
          Sign up
        </Link>
      </div>

      {/* Desktop: Top right navigation */}
      <div className="hidden lg:block fixed top-3 right-3 z-[1000]">
        <nav>
          <ul className="flex items-center gap-4">
            <li>
              <Link
                href={getI18nPath('/sign-in', locale)}
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#50394D] bg-[#002C4D] px-6 py-2.5 text-base font-semibold text-[#BFC3C7] shadow-lg transition-all hover:bg-[#27131D] hover:border-[#69F0FD] hover:text-[#69F0FD] hover:shadow-xl"
              >
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href={getI18nPath('/sign-up', locale)}
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#69F0FD] bg-[#69F0FD] px-6 py-2.5 text-base font-semibold text-[#27131D] shadow-lg transition-all hover:bg-[#4DADE3] hover:border-[#4DADE3] hover:shadow-xl"
              >
                Sign up
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
