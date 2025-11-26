import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * สถานที่ท่องเที่ยว
 */
export const places = mysqlTable("places", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // เช่น วัด, น้ำตก, อุทยาน
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  imageUrl: text("imageUrl"), // URL รูปภาพหลัก
  videoUrl: text("videoUrl"), // URL วิดีโอ (ถ้ามี)
  audioUrl: text("audioUrl"), // URL เสียงบรรยาย (ถ้ามี)
  viewCount: int("viewCount").default(0).notNull(), // ยอดวิว
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Place = typeof places.$inferSelect;
export type InsertPlace = typeof places.$inferInsert;

/**
 * รูปภาพเพิ่มเติมของสถานที่
 */
export const placeImages = mysqlTable("placeImages", {
  id: int("id").autoincrement().primaryKey(),
  placeId: int("placeId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlaceImage = typeof placeImages.$inferSelect;
export type InsertPlaceImage = typeof placeImages.$inferInsert;

/**
 * รีวิวและคะแนน
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  placeId: int("placeId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // คะแนน 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * หมวดหมู่สถานที่ท่องเที่ยว
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  imageUrl: text("imageUrl"), // URL รูปภาพหมวดหมู่
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
