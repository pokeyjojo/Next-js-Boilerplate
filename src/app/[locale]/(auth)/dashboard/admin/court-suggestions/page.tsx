import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import CourtSuggestionModerationDashboard from '@/components/CourtSuggestionModerationDashboard';
import { isAdmin } from '@/libs/AdminUtils';

type IAdminCourtSuggestionsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCourtSuggestionsPage(props: IAdminCourtSuggestionsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CourtSuggestionModerationDashboard />
    </div>
  );
}
