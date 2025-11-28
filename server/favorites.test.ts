import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { places } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("favorites", () => {
  let testPlaceId: number;

  beforeEach(async () => {
    // Create a test place
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .insert(places)
      .values({
        name: "Test Favorite Place",
        description: "A place for testing favorites",
        category: "ธรรมชาติ",
        latitude: "19.0",
        longitude: "99.0",
        imageUrl: "https://example.com/image.jpg",
      });
    testPlaceId = Number(result[0].insertId);
  });

  it("should add a place to favorites", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.favorites.add({ placeId: testPlaceId });

    expect(result.success).toBe(true);
  });

  it("should check if a place is favorite", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Add to favorites first
    await caller.favorites.add({ placeId: testPlaceId });

    // Check if it's a favorite
    const isFavorite = await caller.favorites.isFavorite({ placeId: testPlaceId });

    expect(isFavorite).toBe(true);
  });

  it("should list user favorites", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Add to favorites
    await caller.favorites.add({ placeId: testPlaceId });

    // List favorites
    const favorites = await caller.favorites.list();

    expect(favorites.length).toBeGreaterThan(0);
    expect(favorites[0]?.place?.name).toBe("Test Favorite Place");
  });

  it("should remove a place from favorites", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Add to favorites first
    await caller.favorites.add({ placeId: testPlaceId });

    // Remove from favorites
    const result = await caller.favorites.remove({ placeId: testPlaceId });

    expect(result.success).toBe(true);

    // Verify it's removed
    const isFavorite = await caller.favorites.isFavorite({ placeId: testPlaceId });
    expect(isFavorite).toBe(false);
  });

  it("should not allow duplicate favorites", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Add to favorites
    await caller.favorites.add({ placeId: testPlaceId });

    // Try to add again - should not throw error but handle gracefully
    const result = await caller.favorites.add({ placeId: testPlaceId });

    expect(result.success).toBe(true);
  });

  it("should return false for non-favorite places", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const isFavorite = await caller.favorites.isFavorite({ placeId: testPlaceId });

    expect(isFavorite).toBe(false);
  });

  it("should isolate favorites between users", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 adds to favorites
    await caller1.favorites.add({ placeId: testPlaceId });

    // User 2 should not see it in their favorites
    const user2Favorites = await caller2.favorites.list();
    const hasPlace = user2Favorites.some(fav => fav.place?.id === testPlaceId);

    expect(hasPlace).toBe(false);
  });
});
