import { defineMiddleware } from 'astro:middleware';
import { hasSessionCookie } from './lib/auth';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  const isProtected = pathname.startsWith('/app');

  if (isProtected) {
    const cookieHeader = context.request.headers.get('cookie');
    if (!hasSessionCookie(cookieHeader)) {
      return context.redirect('/sign-in');
    }
  }

  return next();
});
