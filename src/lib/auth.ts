/**
 * Checks if Clerk credentials are real (not placeholder/empty).
 * Publishable keys must start with pk_test_ or pk_live_ and be > 20 chars.
 */
function isValidClerkKey(key: string | undefined): boolean {
  if (!key || key.length < 20) return false;
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
}

export const isClerkConfigured =
  isValidClerkKey(import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  !!import.meta.env.CLERK_SECRET_KEY &&
  import.meta.env.CLERK_SECRET_KEY.length > 20;
