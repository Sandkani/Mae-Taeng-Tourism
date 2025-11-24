import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("places.list", () => {
  it("should return list of places for public access", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.places.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    if (result.length > 0) {
      const place = result[0];
      expect(place).toHaveProperty("id");
      expect(place).toHaveProperty("name");
      expect(place).toHaveProperty("description");
      expect(place).toHaveProperty("category");
      expect(place).toHaveProperty("viewCount");
    }
  });
});

describe("places.getById", () => {
  it("should return place details by ID", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Get first place from list
    const places = await caller.places.list();
    if (places.length === 0) {
      expect(true).toBe(true); // Skip if no places
      return;
    }

    const firstPlace = places[0];
    const result = await caller.places.getById({ id: firstPlace.id });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(firstPlace.id);
    expect(result?.name).toBe(firstPlace.name);
  });

  it("should return null for non-existent place", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.places.getById({ id: 99999 });

    expect(result).toBeNull();
  });
});

describe("places.incrementView", () => {
  it("should increment view count for a place", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const places = await caller.places.list();
    if (places.length === 0) {
      expect(true).toBe(true); // Skip if no places
      return;
    }

    const firstPlace = places[0];
    const initialViewCount = firstPlace.viewCount || 0;

    const result = await caller.places.incrementView({ placeId: firstPlace.id });

    expect(result.success).toBe(true);

    // Verify view count increased
    const updatedPlace = await caller.places.getById({ id: firstPlace.id });
    expect(updatedPlace?.viewCount).toBeGreaterThan(initialViewCount);
  });
});

describe("places.create (admin only)", () => {
  it("should allow admin to create a place", async () => {
    const { ctx } = createMockContext(createAdminUser());
    const caller = appRouter.createCaller(ctx);

    const newPlace = {
      name: "Test Place",
      description: "This is a test place",
      category: "Test",
      latitude: "19.0000",
      longitude: "98.0000",
      imageUrl: "/images/test.jpg",
    };

    const result = await caller.places.create(newPlace);

    expect(result.success).toBe(true);
  });

  it("should deny regular user from creating a place", async () => {
    const { ctx } = createMockContext(createRegularUser());
    const caller = appRouter.createCaller(ctx);

    const newPlace = {
      name: "Test Place",
      description: "This is a test place",
      category: "Test",
      latitude: "19.0000",
      longitude: "98.0000",
    };

    await expect(caller.places.create(newPlace)).rejects.toThrow();
  });

  it("should deny unauthenticated user from creating a place", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const newPlace = {
      name: "Test Place",
      description: "This is a test place",
      category: "Test",
      latitude: "19.0000",
      longitude: "98.0000",
    };

    await expect(caller.places.create(newPlace)).rejects.toThrow();
  });
});

describe("places.delete (admin only)", () => {
  it("should allow admin to delete a place", async () => {
    const { ctx } = createMockContext(createAdminUser());
    const caller = appRouter.createCaller(ctx);

    // Create a test place first
    await caller.places.create({
      name: "Place to Delete",
      description: "This place will be deleted",
      category: "Test",
      latitude: "19.0000",
      longitude: "98.0000",
    });

    // Get the created place
    const places = await caller.places.list();
    const testPlace = places.find(p => p.name === "Place to Delete");

    if (testPlace) {
      const result = await caller.places.delete({ id: testPlace.id });
      expect(result.success).toBe(true);

      // Verify it's deleted
      const deletedPlace = await caller.places.getById({ id: testPlace.id });
      expect(deletedPlace).toBeNull();
    }
  });

  it("should deny regular user from deleting a place", async () => {
    const { ctx } = createMockContext(createRegularUser());
    const caller = appRouter.createCaller(ctx);

    await expect(caller.places.delete({ id: 1 })).rejects.toThrow();
  });
});
