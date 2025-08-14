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
              colorPrimary: '#BFC37C',
              colorBackground: '#F4F5F6',
              colorInputBackground: '#F4F5F6',
              colorInputText: '#7F8B9F',
              colorText: '#7F8B9F',
              colorTextSecondary: '#7F8B9F',
              colorTextOnPrimaryBackground: '#7F8B9F',
              colorNeutral: '#7F8B9F',
              colorSuccess: '#7F8B9F',
              colorWarning: '#7F8B9F',
              colorDanger: '#7F8B9F',
              borderRadius: '8px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              spacingUnit: '0.5rem',
            },
            elements: {
              card: 'bg-[#F4F5F6] border border-[#BFC37C] shadow-xl !w-full !max-w-none',
              rootBox: '!w-full !max-w-none',
              headerTitle: 'text-[#7F8B9F] !text-lg sm:!text-xl',
              headerSubtitle: 'text-[#7F8B9F] !text-sm sm:!text-base',
              formFieldLabel: 'text-[#7F8B9F] !text-sm sm:!text-base',
              formFieldInput: 'bg-[#F4F5F6] border border-[#BFC37C] text-[#7F8B9F] placeholder-[#7F8B9F] focus:border-[#011B2E] focus:ring-[#011B2E] !text-sm sm:!text-base !min-h-[44px]',
              formButtonPrimary: 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] !min-h-[44px] !text-sm sm:!text-base',
              formButtonSecondary: 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] !min-h-[44px] !text-sm sm:!text-base',
              dividerLine: 'bg-[#BFC37C]',
              dividerText: 'text-[#7F8B9F] !text-sm',
              socialButtonsBlockButton: 'bg-[#F4F5F6] border border-[#BFC37C] text-[#7F8B9F] !min-h-[44px]',
              profileSectionTitleText: 'text-[#7F8B9F] !text-base sm:!text-lg',
              profileSectionTitleTextContainer: 'border-b border-[#BFC37C]',
              userPreviewMainIdentifier: 'text-[#7F8B9F] !text-sm sm:!text-base',
              userPreviewSecondaryIdentifier: 'text-[#7F8B9F] !text-xs sm:!text-sm',
              userPreviewTextContainer: 'bg-[#F4F5F6] border border-[#BFC37C]',
              badge: 'bg-[#F4F5F6] text-[#7F8B9F] border border-[#BFC37C] !text-xs sm:!text-sm',
              avatarBox: 'bg-[#F4F5F6] border border-[#BFC37C]',
              avatarImage: 'text-[#7F8B9F]',
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
