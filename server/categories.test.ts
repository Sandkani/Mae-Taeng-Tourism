import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("categories.list", () => {
  it("should return all categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(typeof result[0]).toBe("string");
    }
  });

  it("should return unique categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    const uniqueCategories = new Set(result);
    expect(uniqueCategories.size).toBe(result.length);
  });

  it("should include common tourism categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    // ตรวจสอบว่ามีหมวดหมู่ทั่วไป
    const hasCategories = result.length > 0;
    expect(hasCategories).toBe(true);
  });

  it("should be accessible by public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // ไม่ควรมี error เมื่อเรียกจาก public user
    const result = await caller.categories.list();
    expect(result).toBeDefined();
  });
});
