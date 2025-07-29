import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import CourtPhotoModerationDashboard from '@/components/CourtPhotoModerationDashboard';
import { isAdmin } from '@/libs/AdminUtils';

type IAdminCourtPhotosPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCourtPhotosPage(props: IAdminCourtPhotosPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Check if user is admin
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CourtPhotoModerationDashboard />
    </div>
  );
}
