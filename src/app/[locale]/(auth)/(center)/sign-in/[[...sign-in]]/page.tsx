import { SignIn } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';

type ISignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ISignInPageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: ISignInPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <SignIn
      path={getI18nPath('/sign-in', locale)}
      appearance={{
        elements: {
          rootBox: 'mx-auto max-w-md',
          card: 'shadow-lg border border-gray-200 rounded-lg',
        },
      }}
      signUpUrl={getI18nPath('/sign-up', locale)}
    />
  );
};
