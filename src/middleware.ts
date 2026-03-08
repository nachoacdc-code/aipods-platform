import { defineMiddleware } from 'astro:middleware';

function isRealClerkKey(key: string | undefined): boolean {
  if (!key || key.length < 20) return false;
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
}

const clerkReady =
  isRealClerkKey(import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  !!import.meta.env.CLERK_SECRET_KEY &&
  import.meta.env.CLERK_SECRET_KEY.length > 20;

export const onRequest = defineMiddleware(async (context, next) => {
  if (!clerkReady) {
    return next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    '@clerk/astro/server'
  );

  const isProtectedRoute = createRouteMatcher([
    '/app(.*)',
    '/dashboard(.*)',
    '/internal(.*)',
  ]);

  const handler = clerkMiddleware((auth, ctx, nextFn) => {
    const session = auth();

    if (isProtectedRoute(ctx.request) && !session.userId) {
      return session.redirectToSignIn();
    }

    return nextFn();
  });

  return handler(context, next);
});
