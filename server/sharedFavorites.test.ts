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

describe("sharedFavorites", () => {
  let testPlaceIds: number[] = [];

  beforeEach(async () => {
    // Create test places
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const place1 = await db.insert(places).values({
      name: "Test Place 1",
      description: "Description 1",
      category: "ธรรมชาติ",
      latitude: "19.0",
      longitude: "99.0",
      imageUrl: "https://example.com/image1.jpg",
    });

    const place2 = await db.insert(places).values({
      name: "Test Place 2",
      description: "Description 2",
      category: "วัฒนธรรม",
      latitude: "19.1",
      longitude: "99.1",
      imageUrl: "https://example.com/image2.jpg",
    });

    testPlaceIds = [Number(place1[0].insertId), Number(place2[0].insertId)];
  });

  it("should create a shared favorite list", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sharedFavorites.create({
      title: "My Favorite Places",
      description: "Places I love to visit",
      placeIds: testPlaceIds,
    });

    expect(result.shareId).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it("should get shared favorite by shareId", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create shared list
    const created = await caller.sharedFavorites.create({
      title: "My Favorite Places",
      description: "Places I love to visit",
      placeIds: testPlaceIds,
    });

    // Get shared list
    const shared = await caller.sharedFavorites.getByShareId({
      shareId: created.shareId,
    });

    expect(shared).toBeDefined();
    expect(shared?.title).toBe("My Favorite Places");
    expect(shared?.places).toHaveLength(2);
    expect(shared?.creator).toBeDefined();
  });

  it("should increment view count", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create shared list
    const created = await caller.sharedFavorites.create({
      title: "My Favorite Places",
      placeIds: testPlaceIds,
    });

    // Increment view
    await caller.sharedFavorites.incrementView({ shareId: created.shareId });

    // Get shared list and check view count
    const shared = await caller.sharedFavorites.getByShareId({
      shareId: created.shareId,
    });

    expect(shared?.viewCount).toBeGreaterThan(0);
  });

  it("should return null for non-existent shareId", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const shared = await caller.sharedFavorites.getByShareId({
      shareId: "non-existent-id",
    });

    expect(shared).toBeNull();
  });
});
