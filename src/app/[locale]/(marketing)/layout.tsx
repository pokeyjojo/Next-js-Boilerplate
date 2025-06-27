import { setRequestLocale } from 'next-intl/server';
import AuthNav from '@/components/AuthNav';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      {/* <DemoBanner /> */}
      {/* Dynamic authentication navigation */}
      <AuthNav />

      {/* Add bottom padding on mobile to account for bottom navigation */}
      <main className="pb-16 lg:pb-0">{props.children}</main>
    </>
  );
}
