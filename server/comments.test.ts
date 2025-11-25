import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("reviews.list (getAllReviews)", () => {
  it("should return all reviews for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.list();

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("placeId");
      expect(result[0]).toHaveProperty("userId");
      expect(result[0]).toHaveProperty("rating");
      expect(result[0]).toHaveProperty("comment");
      expect(result[0]).toHaveProperty("userName");
      expect(result[0]).toHaveProperty("placeName");
    }
  });

  it("should return reviews sorted by creation date (newest first)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.list();

    if (result.length > 1) {
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].createdAt).getTime();
        const next = new Date(result[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });
});

describe("reviews.listAll (getAllReviews alias)", () => {
  it("should return all reviews using listAll alias", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.listAll();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("reviews.getAllForAdmin", () => {
  it("should return all reviews for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.getAllForAdmin();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("reviews.delete", () => {
  it("should delete a review successfully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Get all reviews first
    const allReviews = await caller.reviews.list();
    
    if (allReviews.length > 0) {
      const reviewToDelete = allReviews[0];
      const result = await caller.reviews.delete({ id: reviewToDelete.id });
      
      expect(result).toEqual({ success: true });
    }
  });
});
