/**
 * Credentials used only by prisma/seed.ts to create the first admin user.
 * No defaults: missing env must fail loudly so production never gets a known password.
 */
type SeedEnv = {
  AUTH_ADMIN_USERNAME?: string;
  AUTH_ADMIN_PASSWORD?: string;
};

export function resolveSeedAdminCredentials(
  env: SeedEnv = process.env as SeedEnv
): { username: string; password: string } {
  const username = env.AUTH_ADMIN_USERNAME?.trim();
  const password = env.AUTH_ADMIN_PASSWORD;

  if (!username) {
    throw new Error(
      "AUTH_ADMIN_USERNAME is required to seed the admin user. Set it in .env.local."
    );
  }
  if (!password || password.length < 8) {
    throw new Error(
      "AUTH_ADMIN_PASSWORD is required and must be at least 8 characters for seed."
    );
  }

  return { username, password };
}
