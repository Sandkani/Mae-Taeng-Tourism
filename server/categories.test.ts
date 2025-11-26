import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

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

function createAdminContext(): TrpcContext {
  const admin: AuthenticatedUser = {
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

  return {
    user: admin,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("categories.list", () => {
  it("should return all categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should return category objects with required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    if (result.length > 0) {
      const category = result[0];
      expect(category).toHaveProperty("id");
      expect(category).toHaveProperty("name");
      expect(typeof category.name).toBe("string");
    }
  });

  it("should be accessible by public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();
    expect(result).toBeDefined();
  });
});

describe("categories.create", () => {
  it("should create category with name", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.create({ 
      name: `Test Category ${Date.now()}` 
    });

    expect(result).toEqual({ success: true });
  });

  it("should create category with name and imageUrl", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.create({ 
      name: `Test Category with Image ${Date.now()}`,
      imageUrl: "https://example.com/image.jpg"
    });

    expect(result).toEqual({ success: true });
  });
});

describe("categories.update", () => {
  it("should update category name", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a category first
    const categoryName = `Category to Update ${Date.now()}`;
    await caller.categories.create({ name: categoryName });
    
    const categories = await caller.categories.list();
    const category = categories.find(c => c.name === categoryName);
    
    if (category) {
      const result = await caller.categories.update({ 
        id: category.id, 
        name: `Updated ${categoryName}` 
      });

      expect(result).toEqual({ success: true });
    }
  });

  it("should update category imageUrl", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a category first
    const categoryName = `Category for Image Update ${Date.now()}`;
    await caller.categories.create({ name: categoryName });
    
    const categories = await caller.categories.list();
    const category = categories.find(c => c.name === categoryName);
    
    if (category) {
      const result = await caller.categories.update({ 
        id: category.id, 
        imageUrl: "https://example.com/new-image.jpg"
      });

      expect(result).toEqual({ success: true });
    }
  });
});

describe("categories.delete", () => {
  it("should delete category by id", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a category first
    const categoryName = `Category to Delete ${Date.now()}`;
    await caller.categories.create({ name: categoryName });
    
    const categories = await caller.categories.list();
    const category = categories.find(c => c.name === categoryName);
    
    if (category) {
      const result = await caller.categories.delete({ id: category.id });

      expect(result).toEqual({ success: true });
    }
  });
});
