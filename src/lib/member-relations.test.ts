import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Pure normalization used by resolveParentId (mirrors first step). */
function normalizeParentId(parentId: string | null | undefined): string | null {
  return parentId?.trim() || null;
}

describe("member-relations parentId normalization", () => {
  it("treats empty / whitespace as no parent", () => {
    assert.equal(normalizeParentId(undefined), null);
    assert.equal(normalizeParentId(null), null);
    assert.equal(normalizeParentId(""), null);
    assert.equal(normalizeParentId("   "), null);
  });

  it("keeps non-empty parent ids", () => {
    assert.equal(normalizeParentId("root"), "root");
    assert.equal(normalizeParentId("  m_abc  "), "m_abc");
  });
});
