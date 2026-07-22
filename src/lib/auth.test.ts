import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || "test-secret-at-least-32-characters-long!!";
process.env.AUTH_ADMIN_USERNAME = process.env.AUTH_ADMIN_USERNAME || "admin";
process.env.AUTH_ADMIN_PASSWORD = process.env.AUTH_ADMIN_PASSWORD || "admin12345";

type AuthModule = typeof import("./auth");

async function signBody(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  return Buffer.from(new Uint8Array(sigBuf)).toString("base64url");
}

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

describe("auth", () => {
  let auth: AuthModule;
  const secret = process.env.AUTH_SECRET!;

  before(async () => {
    auth = await import("./auth");
    assert.equal(auth.getPublicAuthConfig().configured, true);
    assert.equal(auth.AUTH_COOKIE, "family_tree_session");
  });

  it("accepts env-configured credentials", () => {
    assert.equal(
      auth.validateCredentials(
        process.env.AUTH_ADMIN_USERNAME!,
        process.env.AUTH_ADMIN_PASSWORD!
      ),
      true
    );
    assert.equal(auth.validateCredentials("admin", "wrong-password"), false);
    assert.equal(auth.validateCredentials("", ""), false);
    assert.equal(
      auth.validateCredentials("other", process.env.AUTH_ADMIN_PASSWORD!),
      false
    );
  });

  it("round-trips signed session token", async () => {
    const token = await auth.createSessionToken("admin", "admin");
    assert.ok(token.includes("."), "token must be body.signature");
    const session = await auth.parseSessionToken(token);
    assert.ok(session);
    assert.equal(session.username, "admin");
    assert.equal(session.role, "admin");
    assert.equal(typeof session.issuedAt, "number");
  });

  it("rejects unsigned forged admin cookie payload", async () => {
    const forged = b64urlJson({
      username: "attacker",
      role: "admin",
      issuedAt: Date.now(),
    });
    assert.equal(await auth.parseSessionToken(forged), null);
    assert.equal(await auth.parseSessionToken("not-valid"), null);
    assert.equal(await auth.parseSessionToken(null), null);
    assert.equal(await auth.parseSessionToken(""), null);
  });

  it("rejects tampered signature and body", async () => {
    const real = await auth.createSessionToken("admin", "admin");
    const [body, sig] = real.split(".");
    assert.ok(body && sig);
    assert.equal(await auth.parseSessionToken(`${body}.AAAA_forged_signature_AAAA`), null);
    const evilBody = b64urlJson({
      username: "attacker",
      role: "admin",
      issuedAt: Date.now(),
    });
    assert.equal(await auth.parseSessionToken(`${evilBody}.${sig}`), null);
  });

  it("rejects invalid role even with valid HMAC", async () => {
    const body = b64urlJson({
      username: "x",
      role: "superadmin",
      issuedAt: Date.now(),
    });
    const sig = await signBody(body, secret);
    assert.equal(await auth.parseSessionToken(`${body}.${sig}`), null);
  });

  it("rejects missing or non-numeric issuedAt", async () => {
    const missing = b64urlJson({ username: "admin", role: "admin" });
    const sig1 = await signBody(missing, secret);
    assert.equal(await auth.parseSessionToken(`${missing}.${sig1}`), null);

    const badType = b64urlJson({
      username: "admin",
      role: "admin",
      issuedAt: "yesterday",
    });
    const sig2 = await signBody(badType, secret);
    assert.equal(await auth.parseSessionToken(`${badType}.${sig2}`), null);

    const nanLike = b64urlJson({
      username: "admin",
      role: "admin",
      issuedAt: null,
    });
    const sig3 = await signBody(nanLike, secret);
    assert.equal(await auth.parseSessionToken(`${nanLike}.${sig3}`), null);
  });

  it("rejects expired sessions", async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const body = b64urlJson({
      username: "admin",
      role: "admin",
      issuedAt: eightDaysAgo,
    });
    const sig = await signBody(body, secret);
    assert.equal(await auth.parseSessionToken(`${body}.${sig}`), null);
  });

  it("accepts member role but middleware only allows admin", async () => {
    const token = await auth.createSessionToken("member-user", "member");
    const session = await auth.parseSessionToken(token);
    assert.ok(session);
    assert.equal(session.role, "member");
    // Escalation: re-sign body with role flipped requires secret — without it fails
    const [body] = token.split(".");
    const escalatedBody = b64urlJson({
      username: "member-user",
      role: "admin",
      issuedAt: Date.now(),
    });
    // Reuse member signature on escalated body
    const [, sig] = token.split(".");
    assert.equal(await auth.parseSessionToken(`${escalatedBody}.${sig}`), null);
    assert.ok(body);
  });

  it("timingSafeEqualString works", () => {
    assert.equal(auth.timingSafeEqualString("abc", "abc"), true);
    assert.equal(auth.timingSafeEqualString("abc", "abd"), false);
    assert.equal(auth.timingSafeEqualString("abc", "ab"), false);
  });
});
