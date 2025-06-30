import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ReactPlugin } from '@stagewise-plugins/react';
import { StagewiseToolbar } from '@stagewise/toolbar-next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { DemoBadge } from '@/components/DemoBadge';
import { routing } from '@/libs/i18nRouting';
import { ClerkLocalizations } from '@/utils/AppConfig';
import '@/styles/global.css';

export const metadata: Metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#ffffff',
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const clerkLocale = ClerkLocalizations.supportedLocales[locale] ?? ClerkLocalizations.defaultLocale;
  let signInUrl = '/sign-in';
  let signUpUrl = '/sign-up';
  let dashboardUrl = '/dashboard';
  let mainPageUrl = '/';
  let afterSignOutUrl = '/';

  if (locale !== routing.defaultLocale) {
    signInUrl = `/${locale}${signInUrl}`;
    signUpUrl = `/${locale}${signUpUrl}`;
    dashboardUrl = `/${locale}${dashboardUrl}`;
    mainPageUrl = `/${locale}${mainPageUrl}`;
    afterSignOutUrl = `/${locale}${afterSignOutUrl}`;
  }

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
        <ClerkProvider
          localization={clerkLocale}
          signInUrl={signInUrl}
          signUpUrl={signUpUrl}
          signInFallbackRedirectUrl={dashboardUrl}
          signUpFallbackRedirectUrl={mainPageUrl}
          afterSignOutUrl={afterSignOutUrl}
        >
          <NextIntlClientProvider>
            <PostHogProvider>
              {props.children}
            </PostHogProvider>
            <DemoBadge />
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
