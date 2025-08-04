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
    <div className="w-full max-w-4xl mx-auto">
      {/* Mobile-friendly responsive wrapper */}
      <div className="px-2 sm:px-4 lg:px-6">
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
            fontSize: '14px',
            spacingUnit: '0.5rem',
          },
          elements: {
            card: 'bg-[#002C4D] border border-[#69F0FD] shadow-xl !w-full !max-w-none',
            rootBox: '!w-full !max-w-none',
            headerTitle: 'text-[#BFC3C7] !text-lg sm:!text-xl',
            headerSubtitle: 'text-[#7F8B95] !text-sm sm:!text-base',
            formFieldLabel: 'text-[#BFC3C7] !text-sm sm:!text-base',
            formFieldInput: 'bg-[#011B2E] border border-[#69F0FD] text-[#BFC3C7] placeholder-[#7F8B95] focus:border-[#69F0FD] focus:ring-[#69F0FD] !text-sm sm:!text-base !min-h-[44px]',
            formButtonPrimary: 'bg-[#69F0FD] text-[#27131D] hover:bg-[#4DADE3] !min-h-[44px] !text-sm sm:!text-base',
            formButtonSecondary: 'bg-[#50394D] text-[#BFC3C7] hover:bg-[#27131D] !min-h-[44px] !text-sm sm:!text-base',
            dividerLine: 'bg-[#69F0FD]',
            dividerText: 'text-[#7F8B95] !text-sm',
            socialButtonsBlockButton: 'bg-[#011B2E] border border-[#69F0FD] text-[#BFC3C7] hover:bg-[#69F0FD] hover:text-[#27131D] !min-h-[44px]',
            profileSectionTitleText: 'text-[#BFC3C7] !text-base sm:!text-lg',
            profileSectionTitleTextContainer: 'border-b border-[#69F0FD]',
            userPreviewMainIdentifier: 'text-[#BFC3C7] !text-sm sm:!text-base',
            userPreviewSecondaryIdentifier: 'text-[#7F8B95] !text-xs sm:!text-sm',
            userPreviewTextContainer: 'bg-[#011B2E] border border-[#69F0FD]',
            badge: 'bg-[#69F0FD] text-[#27131D] !text-xs sm:!text-sm',
            avatarBox: 'bg-[#69F0FD]',
            avatarImage: 'text-[#27131D]',
            navbar: '!w-full !flex-wrap !gap-2',
            navbarButton: '!text-xs sm:!text-sm !px-2 sm:!px-4 !py-1 sm:!py-2',
            navbarMobileMenuButton: '!text-sm !min-h-[44px]',
            pageScrollBox: '!px-2 sm:!px-4',
            page: '!w-full !max-w-none',
          },
          layout: {
            showOptionalFields: true,
            socialButtonsVariant: 'blockButton',
          },
        }}
      />
      </div>
    </div>
  );
};
