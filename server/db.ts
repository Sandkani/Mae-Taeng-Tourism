import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, places, reviews, InsertPlace, InsertReview, categories, InsertCategory, favorites, InsertFavorite } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Places queries
export async function getAllPlaces() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: places.id,
      name: places.name,
      description: places.description,
      category: places.category,
      latitude: places.latitude,
      longitude: places.longitude,
      imageUrl: places.imageUrl,
      videoUrl: places.videoUrl,
      audioUrl: places.audioUrl,
      viewCount: places.viewCount,
      createdAt: places.createdAt,
      updatedAt: places.updatedAt,
      avgRating: sql<string>`COALESCE(AVG(${reviews.rating}), 0)`,
      reviewCount: sql<string>`COALESCE(COUNT(DISTINCT ${reviews.id}), 0)`,
    })
    .from(places)
    .leftJoin(reviews, eq(places.id, reviews.placeId))
    .groupBy(places.id)
    .orderBy(desc(places.createdAt));
  
  return result.map(place => ({
    ...place,
    avgRating: Number(place.avgRating) || 0,
    reviewCount: Number(place.reviewCount) || 0,
  }));
}

export async function getPlaceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      id: places.id,
      name: places.name,
      description: places.description,
      category: places.category,
      latitude: places.latitude,
      longitude: places.longitude,
      imageUrl: places.imageUrl,
      videoUrl: places.videoUrl,
      audioUrl: places.audioUrl,
      viewCount: places.viewCount,
      createdAt: places.createdAt,
      updatedAt: places.updatedAt,
      avgRating: sql<string>`COALESCE(AVG(${reviews.rating}), 0)`,
      reviewCount: sql<string>`COALESCE(COUNT(DISTINCT ${reviews.id}), 0)`,
    })
    .from(places)
    .leftJoin(reviews, eq(places.id, reviews.placeId))
    .where(eq(places.id, id))
    .groupBy(places.id)
    .limit(1);
  
  if (result.length === 0) return null;
  
  const place = result[0];
  return {
    ...place,
    avgRating: Number(place.avgRating) || 0,
    reviewCount: Number(place.reviewCount) || 0,
  };
}

export async function createPlace(place: InsertPlace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(places).values(place);
  return result;
}

export async function updatePlace(id: number, place: Partial<InsertPlace>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(places).set(place).where(eq(places.id, id));
}

export async function deletePlace(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(places).where(eq(places.id, id));
}

// Reviews queries
export async function getReviewsByPlaceId(placeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: reviews.id,
      placeId: reviews.placeId,
      userId: reviews.userId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.placeId, placeId))
    .orderBy(desc(reviews.createdAt));
  
  return result;
}

export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reviews).values(review);
  return result;
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getAllReviews() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: reviews.id,
      placeId: reviews.placeId,
      userId: reviews.userId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
      placeName: places.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .leftJoin(places, eq(reviews.placeId, places.id))
    .orderBy(desc(reviews.createdAt));
  
  return result;
}

// Categories queries
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(categories)
    .orderBy(categories.name);
  
  return result;
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(categories).values(category);
  return result;
}

export async function updateCategory(id: number, category: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(categories).set(category).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(categories).where(eq(categories.id, id));
}

// View count queries
export async function incrementViewCount(placeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(places)
    .set({ viewCount: sql`${places.viewCount} + 1` })
    .where(eq(places.id, placeId));
}

export async function getViewStats() {
  const db = await getDb();
  if (!db) return { totalViews: 0, viewsByCategory: [], topPlaces: [] };
  
  // Total views
  const totalViewsResult = await db
    .select({ total: sql<string>`SUM(${places.viewCount})` })
    .from(places);
  const totalViews = Number(totalViewsResult[0]?.total) || 0;
  
  // Views by category
  const viewsByCategoryRaw = await db
    .select({
      category: places.category,
      count: sql<string>`SUM(${places.viewCount})`,
    })
    .from(places)
    .groupBy(places.category);
  
  const viewsByCategory = viewsByCategoryRaw.map(item => ({
    category: item.category,
    count: Number(item.count) || 0,
  }));
  
  // Top 3 places
  const topPlaces = await db
    .select({
      id: places.id,
      name: places.name,
      category: places.category,
      imageUrl: places.imageUrl,
      viewCount: places.viewCount,
    })
    .from(places)
    .orderBy(desc(places.viewCount))
    .limit(3);
  
  return { totalViews, viewsByCategory, topPlaces };
}

// ============ Favorites ============

export async function addFavorite(userId: number, placeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(favorites).values({ userId, placeId });
}

export async function removeFavorite(userId: number, placeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.placeId, placeId))
  );
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: favorites.id,
      placeId: favorites.placeId,
      place: places,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .leftJoin(places, eq(favorites.placeId, places.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
  
  return result;
}

export async function isFavorite(userId: number, placeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.placeId, placeId)))
    .limit(1);
  
  return result.length > 0;
}
