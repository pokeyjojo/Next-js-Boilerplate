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

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <>
        {/* Mobile loading skeleton */}
        <div className="lg:hidden fixed top-20 right-4 z-[1000]">
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
        {/* Mobile: Profile picture at top right underneath search bar */}
        <div className="lg:hidden fixed top-20 right-4 z-[1000]">
          <Link
            href={getI18nPath('/dashboard/user-profile', locale)}
            className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-colors shadow-lg bg-white"
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
      {/* Mobile: Bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-gray-200">
        <nav className="flex justify-around p-2">
          <Link
            href={getI18nPath('/sign-in', locale)}
            className="flex-1 mx-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            Sign in
          </Link>
          <Link
            href={getI18nPath('/sign-up', locale)}
            className="flex-1 mx-1 inline-flex items-center justify-center rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition-all hover:bg-blue-50"
          >
            Sign up
          </Link>
        </nav>
      </div>

      {/* Desktop: Top right navigation */}
      <div className="hidden lg:block fixed top-3 right-3 z-[1000]">
        <nav>
          <ul className="flex items-center gap-4">
            <li>
              <Link
                href={getI18nPath('/sign-in', locale)}
                className="inline-flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-6 py-2.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
              >
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href={getI18nPath('/sign-up', locale)}
                className="inline-flex items-center justify-center rounded-md border-2 border-blue-600 bg-white px-6 py-2.5 text-base font-semibold text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:shadow-md"
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
