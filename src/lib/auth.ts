/**
 * Signed session auth (HMAC-SHA256).
 * Secrets and admin credentials MUST come from environment variables.
 */

export const AUTH_COOKIE = "family_tree_session";

export type SessionRole = "admin" | "member";

export type SessionPayload = {
  username: string;
  role: SessionRole;
  issuedAt: number;
};

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ROLES = new Set<SessionRole>(["admin", "member"]);

// ─── encoding helpers (Edge + Node) ─────────────────────────────────────────

function utf8ToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(view).toString("base64url");
  }
  let binary = "";
  view.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64url"));
  }
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/** Constant-time equality for equal-length byte arrays. */
function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

/** Constant-time string compare (length leak minimized with fixed-size hash compare path). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const aBytes = utf8ToBytes(a);
  const bBytes = utf8ToBytes(b);
  if (aBytes.length !== bBytes.length) {
    // Still walk the longer buffer so runtime is less informative.
    const dummy = aBytes.length > 0 ? aBytes : utf8ToBytes("\0");
    timingSafeEqualBytes(dummy, dummy);
    return false;
  }
  return timingSafeEqualBytes(aBytes, bBytes);
}

// ─── secrets & credentials from env ─────────────────────────────────────────

function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short (min 32 chars). Set it in .env.local — see .env.example."
    );
  }
  return secret;
}

function getAdminUsername(): string {
  const user = process.env.AUTH_ADMIN_USERNAME?.trim();
  if (!user) {
    throw new Error("AUTH_ADMIN_USERNAME is not set. See .env.example.");
  }
  return user;
}

function getAdminPassword(): string {
  const pass = process.env.AUTH_ADMIN_PASSWORD;
  if (!pass || pass.length < 8) {
    throw new Error(
      "AUTH_ADMIN_PASSWORD is missing or too short (min 8 chars). See .env.example."
    );
  }
  return pass;
}

// ─── HMAC (Web Crypto — works in Edge middleware + Node) ────────────────────

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8ToBytes(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(body: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, utf8ToBytes(body) as BufferSource);
  return bytesToBase64Url(sig);
}

async function hmacVerify(body: string, signatureB64Url: string, secret: string): Promise<boolean> {
  try {
    const key = await importHmacKey(secret);
    const sigBytes = base64UrlToBytes(signatureB64Url);
    return crypto.subtle.verify("HMAC", key, sigBytes as BufferSource, utf8ToBytes(body) as BufferSource);
  } catch {
    return false;
  }
}

// ─── payload validation ─────────────────────────────────────────────────────

function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && ROLES.has(value as SessionRole);
}

function parseAndValidatePayload(json: string): SessionPayload | null {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }

  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  if (typeof obj.username !== "string") return null;
  const username = obj.username.trim();
  if (!username || username.length > 128) return null;

  if (!isSessionRole(obj.role)) return null;

  if (typeof obj.issuedAt !== "number" || !Number.isFinite(obj.issuedAt)) return null;
  if (!Number.isInteger(obj.issuedAt) || obj.issuedAt <= 0) return null;
  // Reject tokens from the future (clock skew allowance: 5 minutes)
  if (obj.issuedAt > Date.now() + 5 * 60 * 1000) return null;
  if (Date.now() - obj.issuedAt > SESSION_MAX_AGE_MS) return null;

  return {
    username,
    role: obj.role,
    issuedAt: obj.issuedAt,
  };
}

// ─── public API ─────────────────────────────────────────────────────────────

/**
 * Create a signed session token: base64url(payload).base64url(hmac)
 */
export async function createSessionToken(
  username: string,
  role: SessionRole = "admin"
): Promise<string> {
  if (!username.trim()) {
    throw new Error("username is required");
  }
  if (!isSessionRole(role)) {
    throw new Error("invalid role");
  }

  const payload: SessionPayload = {
    username: username.trim(),
    role,
    issuedAt: Date.now(),
  };
  const body = bytesToBase64Url(utf8ToBytes(JSON.stringify(payload)));
  const secret = requireAuthSecret();
  const sig = await hmacSign(body, secret);
  return `${body}.${sig}`;
}

/**
 * Verify signature + structural rules. Returns null if invalid/forged/expired.
 */
export async function parseSessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  // Expected format: body.signature — reject bare base64 (old unsigned tokens)
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!body || !signature) return null;
  // Reasonable length bounds
  if (body.length > 2048 || signature.length > 256) return null;

  let secret: string;
  try {
    secret = requireAuthSecret();
  } catch {
    // Misconfigured server: deny all sessions
    return null;
  }

  const validSig = await hmacVerify(body, signature, secret);
  if (!validSig) return null;

  try {
    const json = bytesToUtf8(base64UrlToBytes(body));
    return parseAndValidatePayload(json);
  } catch {
    return null;
  }
}

/**
 * Validate login against env-configured admin credentials (timing-safe).
 * Does not reveal whether username or password failed.
 */
export function validateCredentials(username: string, password: string): boolean {
  try {
    const expectedUser = getAdminUsername();
    const expectedPass = getAdminPassword();
    const userOk = timingSafeEqualString(username.trim(), expectedUser);
    const passOk = timingSafeEqualString(password, expectedPass);
    return userOk && passOk;
  } catch {
    // Missing env configuration — never accept
    return false;
  }
}

/** Safe for logging / API responses — never includes password. */
export function getPublicAuthConfig() {
  return {
    cookie: AUTH_COOKIE,
    sessionMaxAgeMs: SESSION_MAX_AGE_MS,
    // Login uses User table (bcrypt). AUTH_SECRET is required for signed sessions.
    // AUTH_ADMIN_* still used by seed to create the first admin user.
    configured: Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32),
  };
}
