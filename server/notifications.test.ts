import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
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

describe("notifications", () => {
  it("should create notification (admin only)", async () => {
    const ctx = createAuthContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.create({
      title: "Test Notification",
      message: "This is a test notification",
      type: "info",
    });

    expect(result.success).toBe(true);
  });

  it("should get user notifications", async () => {
    const adminCtx = createAuthContext(1, "admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    // Create notification for user 2
    await adminCaller.notifications.create({
      userId: 2,
      title: "Personal Notification",
      message: "This is for user 2",
    });

    // Get notifications as user 2
    const userCtx = createAuthContext(2);
    const userCaller = appRouter.createCaller(userCtx);
    const notifications = await userCaller.notifications.list();

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.some(n => n.title === "Personal Notification")).toBe(true);
  });

  it("should get unread notification count", async () => {
    const adminCtx = createAuthContext(1, "admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    // Create notification for user 3
    await adminCaller.notifications.create({
      userId: 3,
      title: "Unread Notification",
      message: "This should be unread",
    });

    // Get unread count as user 3
    const userCtx = createAuthContext(3);
    const userCaller = appRouter.createCaller(userCtx);
    const count = await userCaller.notifications.unreadCount();

    expect(count).toBeGreaterThan(0);
  });

  it("should mark notification as read", async () => {
    const adminCtx = createAuthContext(1, "admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    // Create notification for user 4
    await adminCaller.notifications.create({
      userId: 4,
      title: "To Be Read",
      message: "Mark this as read",
    });

    // Get notifications as user 4
    const userCtx = createAuthContext(4);
    const userCaller = appRouter.createCaller(userCtx);
    const notifications = await userCaller.notifications.list();
    const notification = notifications.find(n => n.title === "To Be Read");

    expect(notification).toBeDefined();
    expect(notification?.isRead).toBe(false);

    // Mark as read
    await userCaller.notifications.markAsRead({
      notificationId: notification!.id,
    });

    // Verify it's marked as read
    const updatedNotifications = await userCaller.notifications.list();
    const updatedNotification = updatedNotifications.find(n => n.id === notification!.id);

    expect(updatedNotification?.isRead).toBe(true);
  });

  it("should mark all notifications as read", async () => {
    const adminCtx = createAuthContext(1, "admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    // Create multiple notifications for user 5
    await adminCaller.notifications.create({
      userId: 5,
      title: "Notification 1",
      message: "Message 1",
    });

    await adminCaller.notifications.create({
      userId: 5,
      title: "Notification 2",
      message: "Message 2",
    });

    // Mark all as read
    const userCtx = createAuthContext(5);
    const userCaller = appRouter.createCaller(userCtx);
    await userCaller.notifications.markAllAsRead();

    // Verify all are marked as read
    const notifications = await userCaller.notifications.list();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    expect(unreadCount).toBe(0);
  });

  it("should delete notification", async () => {
    const adminCtx = createAuthContext(1, "admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    // Create notification for user 6
    await adminCaller.notifications.create({
      userId: 6,
      title: "To Be Deleted",
      message: "Delete this",
    });

    // Get notifications as user 6
    const userCtx = createAuthContext(6);
    const userCaller = appRouter.createCaller(userCtx);
    const notifications = await userCaller.notifications.list();
    const notification = notifications.find(n => n.title === "To Be Deleted");

    expect(notification).toBeDefined();

    // Delete notification
    await userCaller.notifications.delete({
      notificationId: notification!.id,
    });

    // Verify it's deleted
    const updatedNotifications = await userCaller.notifications.list();
    const deletedNotification = updatedNotifications.find(n => n.id === notification!.id);

    expect(deletedNotification).toBeUndefined();
  });

  it("should broadcast notification to all users", async () => {
    const adminCtx = createAuthContext(1, "admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    // Create broadcast notification (no userId)
    await adminCaller.notifications.create({
      title: "Broadcast Notification",
      message: "This is for everyone",
      type: "info",
    });

    // User 7 should see it
    const user7Ctx = createAuthContext(7);
    const user7Caller = appRouter.createCaller(user7Ctx);
    const user7Notifications = await user7Caller.notifications.list();

    expect(user7Notifications.some(n => n.title === "Broadcast Notification")).toBe(true);

    // User 8 should also see it
    const user8Ctx = createAuthContext(8);
    const user8Caller = appRouter.createCaller(user8Ctx);
    const user8Notifications = await user8Caller.notifications.list();

    expect(user8Notifications.some(n => n.title === "Broadcast Notification")).toBe(true);
  });
});
