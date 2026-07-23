import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeParentId, wouldCreateParentCycle } from "./member-relations";

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

describe("member-relations cycle detection", () => {
  const parents = new Map<string, string | null>([
    ["root", null],
    ["parent", "root"],
    ["child", "parent"],
  ]);

  it("rejects direct and transitive descendant parents", () => {
    assert.equal(wouldCreateParentCycle("parent", "parent", parents), true);
    assert.equal(wouldCreateParentCycle("root", "child", parents), true);
  });

  it("allows an ancestor or no parent", () => {
    assert.equal(wouldCreateParentCycle("child", "root", parents), false);
    assert.equal(wouldCreateParentCycle("child", null, parents), false);
  });
});
