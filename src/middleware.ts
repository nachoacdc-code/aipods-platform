import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedRoute = createRouteMatcher([
  '/app(.*)',
  '/dashboard(.*)',
  '/internal(.*)',
]);

export const onRequest = clerkMiddleware((auth, context, next) => {
  const session = auth();

  if (isProtectedRoute(context.request) && !session.userId) {
    return session.redirectToSignIn();
  }

  return next();
});
