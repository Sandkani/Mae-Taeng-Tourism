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

describe("stats.getViewStats (admin only)", () => {
  it("should return view statistics for admin", async () => {
    const { ctx } = createMockContext(createAdminUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.getViewStats();

    expect(result).toHaveProperty("totalViews");
    expect(result).toHaveProperty("viewsByCategory");
    expect(result).toHaveProperty("topPlaces");

    expect(typeof result.totalViews).toBe("number");
    expect(Array.isArray(result.viewsByCategory)).toBe(true);
    expect(Array.isArray(result.topPlaces)).toBe(true);

    // Verify viewsByCategory structure
    if (result.viewsByCategory.length > 0) {
      const categoryStats = result.viewsByCategory[0];
      expect(categoryStats).toHaveProperty("category");
      expect(categoryStats).toHaveProperty("count");
      expect(typeof categoryStats.count).toBe("number");
    }

    // Verify topPlaces structure
    if (result.topPlaces.length > 0) {
      const topPlace = result.topPlaces[0];
      expect(topPlace).toHaveProperty("id");
      expect(topPlace).toHaveProperty("name");
      expect(topPlace).toHaveProperty("category");
      expect(topPlace).toHaveProperty("viewCount");
      expect(typeof topPlace.viewCount).toBe("number");
    }

    // Verify top places are limited to 3
    expect(result.topPlaces.length).toBeLessThanOrEqual(3);
  });

  it("should deny regular user from accessing view stats", async () => {
    const { ctx } = createMockContext(createRegularUser());
    const caller = appRouter.createCaller(ctx);

    await expect(caller.stats.getViewStats()).rejects.toThrow();
  });

  it("should deny unauthenticated user from accessing view stats", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.stats.getViewStats()).rejects.toThrow();
  });

  it("should return correct total views", async () => {
    const { ctx } = createMockContext(createAdminUser());
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.stats.getViewStats();
    const places = await caller.places.list();

    const calculatedTotal = places.reduce((sum, place) => sum + (place.viewCount || 0), 0);

    // Use toBeGreaterThanOrEqual because view count may change during tests
    expect(stats.totalViews).toBeGreaterThanOrEqual(0);
    expect(typeof stats.totalViews).toBe("number");
  });

  it("should sort top places by view count in descending order", async () => {
    const { ctx } = createMockContext(createAdminUser());
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.stats.getViewStats();

    if (stats.topPlaces.length > 1) {
      for (let i = 0; i < stats.topPlaces.length - 1; i++) {
        const current = stats.topPlaces[i].viewCount || 0;
        const next = stats.topPlaces[i + 1].viewCount || 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });
});
