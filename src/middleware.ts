import { detectBot } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';
import { routing } from './libs/i18nRouting';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
]);

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    // Block all bots except the following
    allow: [
      // See https://docs.arcjet.com/bot-protection/identifying-bots
      'CATEGORY:SEARCH_ENGINE', // Allow search engines
      'CATEGORY:PREVIEW', // Allow preview links to show OG images
      'CATEGORY:MONITOR', // Allow uptime monitoring services
    ],
  }),
);

export default clerkMiddleware(async (auth, request) => {
  // Arcjet protection (if enabled)
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Route protection logic
  if (isProtectedRoute(request)) {
    const locale = request.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';
    const signInUrl = new URL(`${locale}/sign-in`, request.url);
    await auth.protect({
      unauthenticatedUrl: signInUrl.toString(),
    });
  }

  // Always run i18n routing
  return handleI18nRouting(request);
});

export const config = {
  matcher: [
    // Match all pages and API routes except for _next, _vercel, static files, etc.
    '/((?!_next|_vercel|monitoring|.*\\..*).*)',
    // Robustly match API routes with or without a locale prefix
    '/api/:path*',
    '/:locale/api/:path*',
  ],
};
