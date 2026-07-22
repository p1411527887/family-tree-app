/**
 * Smoke checks against a running server (default http://localhost:3000).
 * Reads admin credentials from env (AUTH_ADMIN_*) — never hard-codes secrets.
 *
 * Usage:
 *   node --env-file=.env.local scripts/smoke.mjs [baseUrl]
 *   # or export AUTH_* then:
 *   node scripts/smoke.mjs http://localhost:3000
 */
const base = process.argv[2] || "http://localhost:3000";
const adminUser = process.env.AUTH_ADMIN_USERNAME;
const adminPass = process.env.AUTH_ADMIN_PASSWORD;

async function check(path, { method = "GET", status = 200, redirect = false } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    redirect: redirect ? "manual" : "follow",
  });
  const ok = redirect
    ? res.status >= 300 && res.status < 400
    : res.status === status;
  const line = `${method} ${path} -> ${res.status}${redirect ? ` (loc: ${res.headers.get("location")})` : ""}`;
  if (!ok) {
    console.error("FAIL", line, `(expected ${redirect ? "3xx" : status})`);
    process.exitCode = 1;
  } else {
    console.log("OK  ", line);
  }
  return res;
}

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

async function main() {
  console.log(`Smoke against ${base}\n`);

  await check("/");
  await check("/tree");
  await check("/members");
  await check("/events");
  await check("/memories");
  await check("/news");
  await check("/analytics");
  await check("/contact");
  await check("/privacy");
  await check("/rules");
  await check("/login");
  await check("/profile/root");
  await check("/profile/showcase-1");
  await check("/contact", { status: 200 });

  // Admin without cookie should redirect to login
  await check("/admin", { redirect: true });

  // Forged unsigned admin cookie must NOT grant access
  const forged = base64urlJson({
    username: "attacker",
    role: "admin",
    issuedAt: Date.now(),
  });
  const forgedRes = await fetch(`${base}/admin`, {
    headers: { cookie: `family_tree_session=${forged}` },
    redirect: "manual",
  });
  const forgedOk = forgedRes.status >= 300 && forgedRes.status < 400;
  console.log(
    forgedOk
      ? `OK   GET /admin with FORGED cookie -> ${forgedRes.status} (rejected)`
      : `FAIL GET /admin with FORGED cookie -> ${forgedRes.status} (expected 3xx)`
  );
  if (!forgedOk) process.exitCode = 1;

  // Login API — invalid
  const bad = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "x", password: "y" }),
  });
  console.log(
    bad.status === 401
      ? "OK   POST /api/auth/login invalid -> 401"
      : `FAIL POST login invalid -> ${bad.status}`
  );
  if (bad.status !== 401) process.exitCode = 1;

  if (!adminUser || !adminPass) {
    console.error(
      "FAIL AUTH_ADMIN_USERNAME / AUTH_ADMIN_PASSWORD not set — skip valid login checks.\n" +
        "     Run: node --env-file=.env.local scripts/smoke.mjs"
    );
    process.exitCode = 1;
    console.log(process.exitCode ? "\nSmoke FAILED" : "\nSmoke PASSED");
    return;
  }

  const good = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: adminUser,
      password: adminPass,
      remember: true,
    }),
  });
  const body = await good.json().catch(() => ({}));
  const setCookie = good.headers.getSetCookie?.() || [];
  console.log(
    good.status === 200 && body.ok
      ? "OK   POST /api/auth/login valid -> 200"
      : `FAIL POST login valid -> ${good.status} ${JSON.stringify(body)}`
  );
  if (!(good.status === 200 && body.ok)) process.exitCode = 1;

  if (setCookie.length) {
    const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
    // Cookie must look signed (body.sig)
    const sessionPart = setCookie
      .map((c) => c.split(";")[0])
      .find((c) => c.startsWith("family_tree_session="));
    const token = sessionPart?.split("=").slice(1).join("=") || "";
    const signed = token.includes(".");
    console.log(
      signed
        ? "OK   session cookie is signed (body.signature)"
        : "FAIL session cookie missing signature"
    );
    if (!signed) process.exitCode = 1;

    const admin = await fetch(`${base}/admin`, {
      headers: { cookie },
      redirect: "manual",
    });
    console.log(
      admin.status === 200
        ? "OK   GET /admin with signed session -> 200"
        : `FAIL GET /admin with signed session -> ${admin.status}`
    );
    if (admin.status !== 200) process.exitCode = 1;
  }

  console.log(process.exitCode ? "\nSmoke FAILED" : "\nSmoke PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
