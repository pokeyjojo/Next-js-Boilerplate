import { SignOutButton } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { isAdmin } from '@/libs/AdminUtils';
import { BaseTemplate } from '@/templates/BaseTemplate';

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'DashboardLayout',
  });

  const adminCheck = await isAdmin();

  return (
    <BaseTemplate
      leftNav={(
        <>
          <li>
            <Link
              href="/dashboard/user-profile/"
              className="border-none text-[#BFC3C7] hover:text-[#69F0FD] transition-colors"
            >
              {t('user_profile_link')}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/my-court-suggestions/"
              className="border-none text-[#69F0FD] hover:text-[#BFC3C7] font-medium transition-colors"
            >
              My Court Suggestions
            </Link>
          </li>
          {adminCheck && (
            <>
              <li>
                <Link
                  href="/dashboard/admin/add-court/"
                  className="border-none text-[#EC0037] hover:text-[#4A1C23] font-medium transition-colors"
                >
                  Add Court
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/court-suggestions/"
                  className="border-none text-[#EC0037] hover:text-[#4A1C23] font-medium transition-colors"
                >
                  Review Court Suggestions
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/reports/"
                  className="border-none text-[#EC0037] hover:text-[#4A1C23] font-medium transition-colors"
                >
                  Reported Reviews
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/court-photos/"
                  className="border-none text-[#EC0037] hover:text-[#4A1C23] font-medium transition-colors"
                >
                  Court Photo Management
                </Link>
              </li>
            </>
          )}
        </>
      )}
      rightNav={(
        <>
          <li>
            <Link
              href="/"
              className="border-none text-[#69F0FD] hover:text-[#BFC3C7] transition-colors"
            >
              Back to Main Page
            </Link>
          </li>
          <li>
            <SignOutButton>
              <button className="border-none text-[#BFC3C7] hover:text-[#69F0FD] transition-colors" type="button">
                {t('sign_out')}
              </button>
            </SignOutButton>
          </li>
        </>
      )}
    >
      {props.children}
    </BaseTemplate>
  );
}
