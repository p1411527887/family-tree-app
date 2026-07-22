/**
 * Only allow same-origin relative paths (open-redirect safe).
 */
export function safeRedirectPath(
  next: unknown,
  fallback = "/admin"
): string {
  if (typeof next !== "string") return fallback;
  const path = next.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\") || path.includes("\0") || path.includes("\n")) {
    return fallback;
  }
  // Block protocol-relative and scheme smuggling
  if (/^\/[a-z]+:/i.test(path)) return fallback;
  return path;
}
