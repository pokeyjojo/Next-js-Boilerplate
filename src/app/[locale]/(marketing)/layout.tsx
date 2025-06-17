import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'RootLayout',
  });

  return (
    <>
      {/* <DemoBanner /> */}
      {/* Mobile: Bottom navigation, Desktop: Top right */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-gray-200">
        <nav className="flex justify-around p-2">
          <Link
            href="/sign-in/"
            className="flex-1 mx-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up/"
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
                href="/sign-in/"
                className="inline-flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-6 py-2.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
              >
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href="/sign-up/"
                className="inline-flex items-center justify-center rounded-md border-2 border-blue-600 bg-white px-6 py-2.5 text-base font-semibold text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:shadow-md"
              >
                Sign up
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Add bottom padding on mobile to account for bottom navigation */}
      <main className="pb-16 lg:pb-0">{props.children}</main>
    </>
  );
}
