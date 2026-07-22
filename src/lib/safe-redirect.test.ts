import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("allows relative admin paths", () => {
    assert.equal(safeRedirectPath("/admin"), "/admin");
    assert.equal(safeRedirectPath("/admin/settings"), "/admin/settings");
  });

  it("blocks open redirects", () => {
    assert.equal(safeRedirectPath("https://evil.com"), "/admin");
    assert.equal(safeRedirectPath("//evil.com"), "/admin");
    assert.equal(safeRedirectPath("/\\evil"), "/admin");
    assert.equal(safeRedirectPath(null), "/admin");
    assert.equal(safeRedirectPath(""), "/admin");
    assert.equal(safeRedirectPath("/admin\n/x"), "/admin");
  });
});
