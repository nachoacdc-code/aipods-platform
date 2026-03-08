import type { APIRoute } from 'astro';
import { verifyPassword, createSessionCookie, clearSessionCookie } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const password = formData.get('password')?.toString() ?? '';
  const action = formData.get('action')?.toString() ?? 'login';

  if (action === 'logout') {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': clearSessionCookie(),
      },
    });
  }

  if (!verifyPassword(password)) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/sign-in?error=invalid',
      },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/app',
      'Set-Cookie': createSessionCookie(),
    },
  });
};
