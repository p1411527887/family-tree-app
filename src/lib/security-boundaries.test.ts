import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertSameOrigin } from "./request-auth";
import { clientIp, rateLimit } from "./rate-limit";

describe("same-origin protection", () => {
  it("accepts matching origins and non-browser requests", () => {
    assert.equal(assertSameOrigin(new Request("https://family.test", {
      headers: { host: "family.test", origin: "https://family.test" },
    })), true);
    assert.equal(assertSameOrigin(new Request("https://family.test", {
      headers: { host: "family.test" },
    })), true);
  });

  it("rejects missing hosts, foreign origins, and malformed origins", () => {
    assert.equal(assertSameOrigin(new Request("https://family.test")), false);
    assert.equal(assertSameOrigin(new Request("https://family.test", {
      headers: { host: "family.test", origin: "https://evil.test" },
    })), false);
    assert.equal(assertSameOrigin(new Request("https://family.test", {
      headers: { host: "family.test", origin: "not-a-url" },
    })), false);
  });
});

describe("rate limiting", () => {
  it("allows up to the configured limit, then returns a retry window", () => {
    const key = `test:${crypto.randomUUID()}`;
    assert.deepEqual(rateLimit(key, { limit: 2, windowMs: 60_000 }), {
      ok: true,
      remaining: 1,
      retryAfterSec: 0,
    });
    assert.deepEqual(rateLimit(key, { limit: 2, windowMs: 60_000 }), {
      ok: true,
      remaining: 0,
      retryAfterSec: 0,
    });
    const blocked = rateLimit(key, { limit: 2, windowMs: 60_000 });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSec > 0);
  });

  it("uses the first forwarded address, then real IP, then unknown", () => {
    assert.equal(clientIp(new Request("https://family.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1", "x-real-ip": "10.0.0.2" },
    })), "203.0.113.7");
    assert.equal(clientIp(new Request("https://family.test", {
      headers: { "x-real-ip": "203.0.113.8" },
    })), "203.0.113.8");
    assert.equal(clientIp(new Request("https://family.test")), "unknown");
  });
});
