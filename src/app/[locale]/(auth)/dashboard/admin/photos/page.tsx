import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import PhotoModerationDashboard from '@/components/PhotoModerationDashboard';
import { isAdmin } from '@/libs/AdminUtils';

type IAdminPhotosPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPhotosPage(props: IAdminPhotosPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Check if user is admin
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/dashboard');
  }

  // const t = await getTranslations({
  //   locale,
  //   namespace: 'AdminPhotosPage',
  // });

  return (
    <div className="min-h-screen bg-gray-50">
      <PhotoModerationDashboard />
    </div>
  );
}
