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
    <div className="min-h-screen bg-[#F4F5F6] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Court Finder Theme: inputs */
              .cl-formFieldInput input,
              .cl-formFieldInput textarea,
              .cl-formFieldInput select,
              .cl-input,
              .cl-input input,
              .cl-input textarea,
              .cl-input select,
              input[data-clerk-input],
              textarea[data-clerk-input],
              select[data-clerk-input],
              .cl-formFieldInput input[type="email"],
              .cl-formFieldInput input[type="text"],
              .cl-formFieldInput input[type="password"] {
                border: 2px solid #BFC37C !important;
                background-color: #F4F5F6 !important;
                color: #7F8B9F !important;
              }
              
              .cl-formFieldInput input:focus,
              .cl-formFieldInput textarea:focus,
              .cl-formFieldInput select:focus,
              .cl-input:focus,
              .cl-input input:focus,
              .cl-input textarea:focus,
              .cl-input select:focus,
              input[data-clerk-input]:focus,
              textarea[data-clerk-input]:focus,
              select[data-clerk-input]:focus,
              .cl-formFieldInput input[type="email"]:focus,
              .cl-formFieldInput input[type="text"]:focus,
              .cl-formFieldInput input[type="password"]:focus {
                outline: none !important;
                border: 2px solid #011B2E !important;
                box-shadow: 0 0 0 2px #011B2E !important;
              }
              
              .cl-formFieldInput input::placeholder,
              .cl-formFieldInput textarea::placeholder,
              .cl-input input::placeholder,
              .cl-input textarea::placeholder,
              input[data-clerk-input]::placeholder,
              textarea[data-clerk-input]::placeholder {
                color: #7F8B9F !important;
              }
            `,
          }}
        />
        <SignIn
          path={getI18nPath('/sign-in', locale)}
          appearance={{
            variables: {
              colorPrimary: '#BFC37C',
              colorBackground: '#F4F5F6',
              colorInputBackground: '#F4F5F6',
              colorInputText: '#7F8B9F',
              colorText: '#7F8B9F',
              colorTextSecondary: '#7F8B9F',
              colorTextOnPrimaryBackground: '#7F8B9F',
              colorSuccess: '#7F8B9F',
              colorDanger: '#7F8B9F',
              colorWarning: '#7F8B9F',
              colorNeutral: '#7F8B9F',
              borderRadius: '12px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '16px',
              fontWeight: {
                normal: '400',
                medium: '500',
                bold: '700',
              },
              spacingUnit: '6px',
            },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-2xl border-2 border-[#BFC37C] rounded-2xl bg-[#F4F5F6] p-8 space-y-6',
              headerTitle: 'text-[#7F8B9F] font-bold text-3xl mb-2',
              headerSubtitle: 'text-[#7F8B9F] text-base mb-6',
              socialButtonsBlockButton: 'bg-[#F4F5F6] text-[#7F8B9F] font-semibold border-2 border-[#BFC37C] transition-all duration-200 rounded-xl py-4 px-6 mb-3',
              socialButtonsBlockButtonText: 'text-[#7F8B9F] font-medium text-base',
              dividerLine: 'bg-[#BFC37C] h-px',
              dividerText: 'text-[#7F8B9F] font-medium text-sm px-4',
              formFieldLabel: 'text-[#7F8B9F] font-semibold text-base mb-2',
              formFieldInput: 'bg-[#F4F5F6] border-2 border-[#BFC37C] focus:border-[#011B2E] text-[#7F8B9F] placeholder-[#7F8B9F] rounded-xl py-4 px-4 text-base transition-all duration-200',
              formFieldInputShowPasswordButton: 'text-[#7F8B9F]',
              formButtonPrimary: 'bg-[#F4F5F6] text-[#7F8B9F] font-bold border-2 border-[#BFC37C] rounded-xl py-4 px-6 text-lg shadow-lg w-full',
              footerActionLink: 'text-[#7F8B9F] font-semibold transition-colors duration-200 text-base',
              footerActionText: 'text-[#7F8B9F] text-base',
              identityPreviewText: 'text-[#7F8B9F]',
              identityPreviewEditButton: 'text-[#7F8B9F]',
              formResendCodeLink: 'text-[#7F8B9F] font-semibold',
              alert: 'border-2 rounded-xl p-4',
              alertText: 'font-medium',
              alertTextDanger: 'text-[#7F8B9F]',
              alertTextSuccess: 'text-[#7F8B9F]',
              alertTextWarning: 'text-[#7F8B9F]',
              alertBackgroundDanger: 'bg-[#F4F5F6] border-[#BFC37C]',
              alertBackgroundSuccess: 'bg-[#F4F5F6] border-[#BFC37C]',
              alertBackgroundWarning: 'bg-[#F4F5F6] border-[#BFC37C]',
              formFieldRow: 'space-y-4',
              formFieldAction: 'text-[#7F8B9F] font-semibold',
              formFieldHintText: 'text-[#7F8B9F] text-sm',
              formFieldErrorText: 'text-[#7F8B9F] font-medium',
              verificationCodeFieldInput: 'bg-[#F4F5F6] border-2 border-[#BFC37C] focus:border-[#011B2E] text-[#7F8B9F] rounded-xl text-center text-lg font-bold py-4',
              formHeaderTitle: 'text-[#7F8B9F] font-bold text-2xl',
              formHeaderSubtitle: 'text-[#7F8B9F] text-base',
              socialButtonsBlockButtonArrow: 'text-[#7F8B9F]',
              socialButtonsBlockButtonIcon: 'text-[#7F8B9F]',
            },
          }}
          signUpUrl={getI18nPath('/sign-up', locale)}
        />
      </div>
    </div>
  );
};
