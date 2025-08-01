import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import AdminAddCourtPage from '@/components/AdminAddCourtPage';
import { isAdmin } from '@/libs/AdminUtils';

type IAdminAddCourtPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminAddCourtPageRoute(props: IAdminAddCourtPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Check if user is admin
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminAddCourtPage />
    </div>
  );
}
