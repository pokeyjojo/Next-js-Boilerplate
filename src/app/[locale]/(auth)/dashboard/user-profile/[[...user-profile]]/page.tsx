import { UserProfile } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';

type IUserProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IUserProfilePageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'UserProfile',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function UserProfilePage(props: IUserProfilePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <div className="my-6 -ml-16">
      <UserProfile
        path={getI18nPath('/dashboard/user-profile', locale)}
        appearance={{
          variables: {
            colorPrimary: '#69F0FD',
            colorBackground: '#002C4D',
            colorInputBackground: '#011B2E',
            colorInputText: '#BFC3C7',
            colorText: '#BFC3C7',
            colorTextSecondary: '#7F8B95',
            colorTextOnPrimaryBackground: '#27131D',
            colorNeutral: '#50394D',
            colorSuccess: '#69F0FD',
            colorWarning: '#EC0037',
            colorDanger: '#EC0037',
            borderRadius: '8px',
            fontFamily: 'system-ui, sans-serif',
          },
          elements: {
            card: 'bg-[#002C4D] border border-[#69F0FD] shadow-xl',
            headerTitle: 'text-[#BFC3C7]',
            headerSubtitle: 'text-[#7F8B95]',
            formFieldLabel: 'text-[#BFC3C7]',
            formFieldInput: 'bg-[#011B2E] border border-[#69F0FD] text-[#BFC3C7] placeholder-[#7F8B95] focus:border-[#69F0FD] focus:ring-[#69F0FD]',
            formButtonPrimary: 'bg-[#69F0FD] text-[#27131D] hover:bg-[#4DADE3]',
            formButtonSecondary: 'bg-[#50394D] text-[#BFC3C7] hover:bg-[#27131D]',
            dividerLine: 'bg-[#69F0FD]',
            dividerText: 'text-[#7F8B95]',
            socialButtonsBlockButton: 'bg-[#011B2E] border border-[#69F0FD] text-[#BFC3C7] hover:bg-[#69F0FD] hover:text-[#27131D]',
            profileSectionTitleText: 'text-[#BFC3C7]',
            profileSectionTitleTextContainer: 'border-b border-[#69F0FD]',
            userPreviewMainIdentifier: 'text-[#BFC3C7]',
            userPreviewSecondaryIdentifier: 'text-[#7F8B95]',
            userPreviewTextContainer: 'bg-[#011B2E] border border-[#69F0FD]',
            badge: 'bg-[#69F0FD] text-[#27131D]',
            avatarBox: 'bg-[#69F0FD]',
            avatarImage: 'text-[#27131D]',
          },
        }}
      />
    </div>
  );
};
