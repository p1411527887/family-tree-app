import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePageParams } from "./pagination";

describe("parsePageParams", () => {
  it("uses defaults for missing values", () => {
    assert.deepEqual(parsePageParams(new URLSearchParams()), {
      page: 1,
      pageSize: 5,
      skip: 0,
    });
  });

  it("accepts valid integers", () => {
    assert.deepEqual(
      parsePageParams(new URLSearchParams("page=3&pageSize=10")),
      { page: 3, pageSize: 10, skip: 20 }
    );
  });

  it("rejects non-numeric, negative, and non-finite input", () => {
    assert.deepEqual(
      parsePageParams(new URLSearchParams("page=abc&pageSize=-2")),
      { page: 1, pageSize: 5, skip: 0 }
    );
    assert.deepEqual(
      parsePageParams(new URLSearchParams("page=1.9&pageSize=3.2")),
      { page: 1, pageSize: 3, skip: 0 }
    );
  });

  it("caps pageSize at maxPageSize", () => {
    assert.deepEqual(
      parsePageParams(new URLSearchParams("page=2&pageSize=999"), {
        maxPageSize: 20,
      }),
      { page: 2, pageSize: 20, skip: 20 }
    );
  });
});
