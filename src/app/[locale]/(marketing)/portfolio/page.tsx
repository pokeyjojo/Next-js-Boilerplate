import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

type IPortfolioProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IPortfolioProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Portfolio',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Portfolio(props: IPortfolioProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Portfolio',
  });

  return (
    <>
      <p className="text-sm sm:text-base">{t('presentation')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {Array.from(Array.from({ length: 6 }).keys()).map(elt => (
          <Link
            className="hover:text-blue-700 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            key={elt}
            href={`/portfolio/${elt}`}
          >
            {t('portfolio_name', { name: elt })}
          </Link>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm">
        {`${t('error_reporting_powered_by')} `}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo"
        >
          Sentry
        </a>
        {` - ${t('coverage_powered_by')} `}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="https://about.codecov.io/codecov-free-trial/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo"
        >
          Codecov
        </a>
      </div>

      <a
        href="https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo"
      >
        <Image
          className="mx-auto mt-4 sm:mt-6"
          src="/assets/images/sentry-dark.png"
          alt="Sentry"
          width={128}
          height={38}
        />
      </a>
    </>
  );
}
