import { SignOutButton } from '@clerk/nextjs';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
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
              href="/dashboard/"
              className="border-none text-gray-700 hover:text-gray-900"
            >
              {t('dashboard_link')}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/user-profile/"
              className="border-none text-gray-700 hover:text-gray-900"
            >
              {t('user_profile_link')}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/my-court-suggestions/"
              className="border-none text-blue-600 hover:text-blue-800 font-medium"
            >
              My Court Suggestions
            </Link>
          </li>
          {adminCheck && (
            <>
              <li>
                <Link
                  href="/dashboard/admin/add-court/"
                  className="border-none text-green-600 hover:text-green-800 font-medium"
                >
                  Add Court
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/court-suggestions/"
                  className="border-none text-green-600 hover:text-green-800 font-medium"
                >
                  Review Court Suggestions
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/reports/"
                  className="border-none text-red-600 hover:text-red-800 font-medium"
                >
                  Reported Reviews
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/admin/court-photos/"
                  className="border-none text-purple-600 hover:text-purple-800 font-medium"
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
            <SignOutButton>
              <button className="border-none text-gray-700 hover:text-gray-900" type="button">
                {t('sign_out')}
              </button>
            </SignOutButton>
          </li>

          <li>
            <LocaleSwitcher />
          </li>
        </>
      )}
    >
      {props.children}
    </BaseTemplate>
  );
}
