import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import ReportModerationDashboard from '@/components/ReportModerationDashboard';
import { isAdmin } from '@/libs/AdminUtils';

type IAdminReportsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminReportsPage(props: IAdminReportsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Check if user is admin
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportModerationDashboard />
    </div>
  );
}
