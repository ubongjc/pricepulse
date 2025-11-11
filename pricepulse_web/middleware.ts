import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { securityHeaders, csrfProtection } from '@/lib/middleware/security';
import { applyRateLimit } from '@/lib/middleware/rateLimit';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Apply CSRF protection for state-changing requests
  if (!csrfProtection(request)) {
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  // Apply rate limiting
  const { userId } = await auth();
  const rateLimitResponse = await applyRateLimit(request, userId || undefined);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check authentication for protected routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Create response and apply security headers
  const response = NextResponse.next();
  return securityHeaders(response);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
