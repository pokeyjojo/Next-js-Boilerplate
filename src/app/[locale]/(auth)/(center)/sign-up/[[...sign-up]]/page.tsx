import { SignUp } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';

type ISignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ISignUpPageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignUp',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignUpPage(props: ISignUpPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <SignUp
      path={getI18nPath('/sign-up', locale)}
      appearance={{
        elements: {
          rootBox: 'mx-auto max-w-md',
          card: 'shadow-lg border border-gray-200 rounded-lg',
        },
      }}
      signInUrl={getI18nPath('/sign-in', locale)}
    />
  );
};
