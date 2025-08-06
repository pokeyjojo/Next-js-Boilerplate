import { setRequestLocale } from 'next-intl/server';
import { isAdmin } from '@/libs/AdminUtils';
import { redirect } from 'next/navigation';
import UserBanManagement from '@/components/UserBanManagement';

type IUserBanPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UserBanPage(props: IUserBanPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#002C4D] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">User Ban Management</h1>
          <p className="text-[#BFC3C7]">
            Manage user bans and restrictions to prevent spam and maintain quality content.
          </p>
        </div>
        
        <UserBanManagement />
      </div>
    </div>
  );
}