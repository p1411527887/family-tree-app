import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getMemberById,
  getAllMemberIds,
  members,
  treeData,
  analyticsSummary,
  flattenFallbackTree,
} from "./family-data";

describe("family-data", () => {
  it("has tree root", () => {
    assert.equal(treeData.id, "root");
    assert.ok(treeData.children && treeData.children.length > 0);
  });

  it("lists members with unique ids", () => {
    const ids = getAllMemberIds();
    assert.ok(ids.length >= 5);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("resolves members by id", () => {
    const root = getMemberById("root");
    assert.ok(root);
    assert.equal(root.name, treeData.name);
    assert.equal(getMemberById("missing-id"), undefined);
  });

  it("flattens fallback tree including spouses with linked ids", () => {
    const flat = flattenFallbackTree();
    assert.ok(flat.some((m) => m.id === "root"));
    const spouse = flat.find((m) => m.id.endsWith("-spouse"));
    assert.ok(spouse);
    assert.ok(spouse.spouse?.id);
    const root = flat.find((m) => m.id === "root");
    assert.ok(root?.spouse?.id);
    assert.equal(root?.spouse?.id, spouse.id);
  });

  it("exposes analytics summary derived from catalog", () => {
    assert.ok(members.length > 0);
    assert.equal(analyticsSummary.totalMembers, members.length);
    assert.ok(analyticsSummary.male + analyticsSummary.female <= members.length);
    assert.ok(analyticsSummary.generations >= 1);
  });
});
