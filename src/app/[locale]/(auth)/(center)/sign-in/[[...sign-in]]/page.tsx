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
    <div className="min-h-screen bg-[#002C4D] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Force Court Flash borders on all Clerk inputs */
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
                border: 2px solid #69F0FD !important;
                background-color: white !important;
                color: #4A1C23 !important;
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
                border: 2px solid #69F0FD !important;
                box-shadow: 0 0 15px rgba(105, 240, 253, 0.6), 0 0 0 2px #69F0FD !important;
              }
              
              .cl-formFieldInput input::placeholder,
              .cl-formFieldInput textarea::placeholder,
              .cl-input input::placeholder,
              .cl-input textarea::placeholder,
              input[data-clerk-input]::placeholder,
              textarea[data-clerk-input]::placeholder {
                color: #7F8B95 !important;
              }
            `,
          }}
        />
        <SignIn
          path={getI18nPath('/sign-in', locale)}
          appearance={{
            variables: {
              colorPrimary: '#EC0037',
              colorBackground: '#002C4D',
              colorInputBackground: '#FFFFFF',
              colorInputText: '#4A1C23',
              colorText: '#BFC3C7',
              colorTextSecondary: '#7F8B95',
              colorTextOnPrimaryBackground: '#FFFFFF',
              colorSuccess: '#69F0FD',
              colorDanger: '#EC0037',
              colorWarning: '#918AB5',
              colorNeutral: '#BFC3C7',
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
              card: 'shadow-2xl border-2 border-[#69F0FD] rounded-2xl bg-[#002C4D] p-8 space-y-6',
              headerTitle: 'text-[#BFC3C7] font-bold text-3xl mb-2',
              headerSubtitle: 'text-[#7F8B95] text-base mb-6',
              socialButtonsBlockButton: 'bg-[#002C4D] hover:bg-[#011B2E] text-[#BFC3C7] font-semibold border-2 border-[#69F0FD] hover:border-[#EC0037] transition-all duration-200 rounded-xl py-4 px-6 mb-3',
              socialButtonsBlockButtonText: 'text-[#BFC3C7] font-medium text-base',
              dividerLine: 'bg-[#69F0FD] h-px',
              dividerText: 'text-[#7F8B95] font-medium text-sm px-4',
              formFieldLabel: 'text-[#BFC3C7] font-semibold text-base mb-2',
              formFieldInput: 'bg-white border-2 border-[#69F0FD] focus:border-[#EC0037] text-[#4A1C23] placeholder-[#7F8B95] rounded-xl py-4 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-[#69F0FD]/20',
              formFieldInputShowPasswordButton: 'text-[#7F8B95] hover:text-[#69F0FD]',
              formButtonPrimary: 'bg-[#EC0037] hover:bg-[#4A1C23] text-white font-bold border-2 border-[#EC0037] hover:border-[#4A1C23] transition-all duration-200 rounded-xl py-4 px-6 text-lg shadow-lg w-full',
              footerActionLink: 'text-[#69F0FD] hover:text-[#EC0037] font-semibold transition-colors duration-200 text-base',
              footerActionText: 'text-[#7F8B95] text-base',
              identityPreviewText: 'text-[#BFC3C7]',
              identityPreviewEditButton: 'text-[#69F0FD] hover:text-[#EC0037]',
              formResendCodeLink: 'text-[#69F0FD] hover:text-[#EC0037] font-semibold',
              alert: 'border-2 rounded-xl p-4',
              alertText: 'font-medium',
              alertTextDanger: 'text-[#EC0037]',
              alertTextSuccess: 'text-[#69F0FD]',
              alertTextWarning: 'text-[#918AB5]',
              alertBackgroundDanger: 'bg-red-50 border-[#EC0037]',
              alertBackgroundSuccess: 'bg-cyan-50 border-[#69F0FD]',
              alertBackgroundWarning: 'bg-purple-50 border-[#918AB5]',
              formFieldRow: 'space-y-4',
              formFieldAction: 'text-[#69F0FD] hover:text-[#EC0037] font-semibold',
              formFieldHintText: 'text-[#7F8B95] text-sm',
              formFieldErrorText: 'text-[#EC0037] font-medium',
              verificationCodeFieldInput: 'bg-white border-2 border-[#69F0FD] focus:border-[#EC0037] text-[#4A1C23] rounded-xl text-center text-lg font-bold py-4 focus:ring-2 focus:ring-[#69F0FD]/20',
              formHeaderTitle: 'text-[#BFC3C7] font-bold text-2xl',
              formHeaderSubtitle: 'text-[#7F8B95] text-base',
              socialButtonsBlockButtonArrow: 'text-[#BFC3C7]',
              socialButtonsBlockButtonIcon: 'text-[#BFC3C7]',
            },
          }}
          signUpUrl={getI18nPath('/sign-up', locale)}
        />
      </div>
    </div>
  );
};
