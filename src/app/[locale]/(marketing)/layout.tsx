import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { DemoBanner } from '@/components/DemoBanner';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

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
      <DemoBanner />
      <div className="fixed top-0 left-0 z-10 w-full bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-screen-md px-4">
          <div className="flex justify-between py-4">
            <nav>
              <ul className="flex flex-wrap gap-x-5 text-xl">
                <li>
                  <Link
                    href="/"
                    className="border-none text-gray-700 hover:text-gray-900"
                  >
                    {t('home_link')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/"
                    className="border-none text-gray-700 hover:text-gray-900"
                  >
                    {t('about_link')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/counter/"
                    className="border-none text-gray-700 hover:text-gray-900"
                  >
                    {t('counter_link')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/portfolio/"
                    className="border-none text-gray-700 hover:text-gray-900"
                  >
                    {t('portfolio_link')}
                  </Link>
                </li>
                <li>
                  <a
                    className="border-none text-gray-700 hover:text-gray-900"
                    href="https://github.com/ixartz/Next-js-Boilerplate"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </nav>

            <nav>
              <ul className="flex flex-wrap gap-x-5 text-xl">
                <li>
                  <Link
                    href="/sign-in/"
                    className="border-none text-gray-700 hover:text-gray-900"
                  >
                    {t('sign_in_link')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-up/"
                    className="border-none text-gray-700 hover:text-gray-900"
                  >
                    {t('sign_up_link')}
                  </Link>
                </li>
                <li>
                  <LocaleSwitcher />
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      <main className="pt-16">{props.children}</main>
    </>
  );
}
