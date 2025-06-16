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
      <div className="fixed top-3 right-3 z-[1000]">
        <nav>
          <ul className="flex items-center gap-8">
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
      <main>{props.children}</main>
    </>
  );
}
