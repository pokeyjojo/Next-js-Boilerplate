import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';

type IAboutProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IAboutProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'About',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function About(props: IAboutProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'About',
  });

  return (
    <>
      <p className="text-sm sm:text-base">{t('about_paragraph')}</p>

      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
        {`${t('translation_powered_by')} `}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="https://l.crowdin.com/next-js"
        >
          Crowdin
        </a>
      </div>

      <a href="https://l.crowdin.com/next-js">
        <Image
          className="mx-auto mt-4 sm:mt-6"
          src="/assets/images/crowdin-dark.png"
          alt="Crowdin Translation Management System"
          width={128}
          height={26}
        />
      </a>
    </>
  );
}
