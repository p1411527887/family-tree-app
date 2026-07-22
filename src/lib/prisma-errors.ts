/**
 * Prisma known-request error codes used for controlled API responses.
 * @see https://www.prisma.io/docs/orm/reference/error-reference
 */
export function getPrismaErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

/** Record required for update/delete was not found (e.g. update where id missing). */
export function isRecordNotFoundError(error: unknown): boolean {
  return getPrismaErrorCode(error) === "P2025";
}

/**
 * DB not ready / unreachable — typically missing migrate, wrong DATABASE_URL,
 * or table missing after a fresh deploy.
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  const code = getPrismaErrorCode(error);
  if (!code) return false;
  return (
    code === "P1001" || // can't reach DB server
    code === "P1003" || // database does not exist
    code === "P1017" || // server closed connection
    code === "P2021" || // table does not exist
    code === "P2022" // column does not exist
  );
}
