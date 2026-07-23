import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPrismaErrorCode,
  isDatabaseUnavailableError,
  isRecordNotFoundError,
  isTransactionConflictError,
} from "./prisma-errors";

describe("prisma-errors", () => {
  it("reads code from Prisma-like errors", () => {
    assert.equal(getPrismaErrorCode({ code: "P2025" }), "P2025");
    assert.equal(getPrismaErrorCode(new Error("x")), null);
    assert.equal(getPrismaErrorCode(null), null);
  });

  it("detects record-not-found (P2025)", () => {
    assert.equal(isRecordNotFoundError({ code: "P2025" }), true);
    assert.equal(isRecordNotFoundError({ code: "P2002" }), false);
  });

  it("detects transaction conflicts (P2034)", () => {
    assert.equal(isTransactionConflictError({ code: "P2034" }), true);
    assert.equal(isTransactionConflictError({ code: "P2025" }), false);
    assert.equal(isTransactionConflictError(new Error("P2034")), false);
  });

  it("detects database unavailable / schema missing codes", () => {
    for (const code of ["P1001", "P1003", "P1017", "P2021", "P2022"]) {
      assert.equal(isDatabaseUnavailableError({ code }), true, code);
    }
    assert.equal(isDatabaseUnavailableError({ code: "P2025" }), false);
    assert.equal(isDatabaseUnavailableError({ message: "fail" }), false);
  });
});
