const COOKIE_NAME = 'aipods_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function verifyPassword(input: string): boolean {
  const password = import.meta.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) return false;
  return input === password;
}

export function createSessionCookie(): string {
  const token = crypto.randomUUID();
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function hasSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return !!match && match[1].length > 0;
}

export { COOKIE_NAME };
