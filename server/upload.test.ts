import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("upload.file", () => {
  it("should upload file to S3 and return URL", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a simple test file (1x1 pixel PNG)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.upload.file({
      fileName: "test-image.png",
      fileData: testImageBase64,
      contentType: "image/png",
    });

    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("key");
    expect(result.url).toContain("uploads/");
    expect(result.url).toContain("test-image.png");
  });

  it("should generate unique file keys", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result1 = await caller.upload.file({
      fileName: "test.png",
      fileData: testImageBase64,
      contentType: "image/png",
    });

    const result2 = await caller.upload.file({
      fileName: "test.png",
      fileData: testImageBase64,
      contentType: "image/png",
    });

    // Keys should be different due to timestamp and random suffix
    expect(result1.key).not.toBe(result2.key);
  });
});
