import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSeedAdminCredentials } from "./seed-admin";

describe("resolveSeedAdminCredentials", () => {
  it("requires username and a password of at least 8 characters", () => {
    assert.throws(() => resolveSeedAdminCredentials({}), /AUTH_ADMIN_USERNAME/);
    assert.throws(
      () => resolveSeedAdminCredentials({ AUTH_ADMIN_USERNAME: "admin" }),
      /AUTH_ADMIN_PASSWORD/
    );
    assert.throws(
      () =>
        resolveSeedAdminCredentials({
          AUTH_ADMIN_USERNAME: "admin",
          AUTH_ADMIN_PASSWORD: "short",
        }),
      /at least 8/
    );
  });

  it("returns trimmed username and password when valid", () => {
    const creds = resolveSeedAdminCredentials({
      AUTH_ADMIN_USERNAME: "  keeper  ",
      AUTH_ADMIN_PASSWORD: "strong-pass-1",
    });
    assert.deepEqual(creds, {
      username: "keeper",
      password: "strong-pass-1",
    });
  });
});
