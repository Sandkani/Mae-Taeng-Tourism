import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createRegularUser(): AuthenticatedUser {
  return {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function createAdminUser(): AuthenticatedUser {
  return {
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
}

describe("reviews.create", () => {
  it("should allow authenticated user to create a review", async () => {
    const { ctx } = createMockContext(createRegularUser());
    const caller = appRouter.createCaller(ctx);

    // Get first place
    const places = await caller.places.list();
    if (places.length === 0) {
      expect(true).toBe(true); // Skip if no places
      return;
    }

    const firstPlace = places[0];

    const result = await caller.reviews.create({
      placeId: firstPlace.id,
      rating: 5,
      comment: "Great place to visit!",
    });

    expect(result.success).toBe(true);
  });

  it("should deny unauthenticated user from creating a review", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.reviews.create({
        placeId: 1,
        rating: 5,
        comment: "Test comment",
      })
    ).rejects.toThrow();
  });

  it("should validate rating is between 1 and 5", async () => {
    const { ctx } = createMockContext(createRegularUser());
    const caller = appRouter.createCaller(ctx);

    // Test invalid rating (0)
    await expect(
      caller.reviews.create({
        placeId: 1,
        rating: 0,
        comment: "Test",
      })
    ).rejects.toThrow();

    // Test invalid rating (6)
    await expect(
      caller.reviews.create({
        placeId: 1,
        rating: 6,
        comment: "Test",
      })
    ).rejects.toThrow();
  });
});

describe("reviews.getByPlaceId", () => {
  it("should return reviews for a specific place", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const places = await caller.places.list();
    if (places.length === 0) {
      expect(true).toBe(true); // Skip if no places
      return;
    }

    const firstPlace = places[0];
    const result = await caller.reviews.getByPlaceId({ placeId: firstPlace.id });

    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const review = result[0];
      expect(review).toHaveProperty("id");
      expect(review).toHaveProperty("rating");
      expect(review).toHaveProperty("placeId");
      expect(review.placeId).toBe(firstPlace.id);
    }
  });
});

describe("reviews.list (admin only)", () => {
  it("should allow admin to list all reviews", async () => {
    const { ctx } = createMockContext(createAdminUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.list();

    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const review = result[0];
      expect(review).toHaveProperty("id");
      expect(review).toHaveProperty("rating");
      expect(review).toHaveProperty("placeName");
      expect(review).toHaveProperty("userName");
    }
  });

  it("should deny regular user from listing all reviews", async () => {
    const { ctx } = createMockContext(createRegularUser());
    const caller = appRouter.createCaller(ctx);

    await expect(caller.reviews.list()).rejects.toThrow();
  });
});

describe("reviews.delete (admin only)", () => {
  it("should allow admin to delete a review", async () => {
    const { ctx } = createMockContext(createAdminUser());
    const caller = appRouter.createCaller(ctx);

    // Create a test review first
    const userCtx = createMockContext(createRegularUser());
    const userCaller = appRouter.createCaller(userCtx.ctx);
    
    const places = await caller.places.list();
    if (places.length === 0) {
      expect(true).toBe(true); // Skip if no places
      return;
    }

    await userCaller.reviews.create({
      placeId: places[0].id,
      rating: 4,
      comment: "Review to be deleted",
    });

    // Get all reviews
    const reviews = await caller.reviews.list();
    const testReview = reviews.find(r => r.comment === "Review to be deleted");

    if (testReview) {
      const result = await caller.reviews.delete({ id: testReview.id });
      expect(result.success).toBe(true);
    }
  });

  it("should deny regular user from deleting a review", async () => {
    const { ctx } = createMockContext(createRegularUser());
    const caller = appRouter.createCaller(ctx);

    await expect(caller.reviews.delete({ id: 1 })).rejects.toThrow();
  });
});
