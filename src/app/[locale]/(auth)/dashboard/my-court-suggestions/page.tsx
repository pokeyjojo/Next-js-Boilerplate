import { auth } from '@clerk/nextjs/server';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import UserCourtSuggestionsDashboard from '@/components/UserCourtSuggestionsDashboard';

type IMyCourtSuggestionsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MyCourtSuggestionsPage(props: IMyCourtSuggestionsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-[#002C4D]">
      <UserCourtSuggestionsDashboard />
    </div>
  );
}
