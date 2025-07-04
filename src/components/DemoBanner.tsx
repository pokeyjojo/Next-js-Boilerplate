import Link from 'next/link';

export const DemoBanner = () => (
  <div className="sticky top-0 z-50 bg-gray-900 p-3 sm:p-4 text-center text-base sm:text-lg font-semibold text-gray-100 [&_a:hover]:text-indigo-500 [&_a]:text-fuchsia-500">
    Test -
    {' '}
    <Link href="/sign-up">Explore the Authentication</Link>
  </div>
);
