import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  places: router({
    // Get all places (public)
    list: publicProcedure.query(async () => {
      return await db.getAllPlaces();
    }),

    // Get place by ID (public)
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlaceById(input.id);
      }),

    // Increment view count (public)
    incrementView: publicProcedure
      .input(z.object({ placeId: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementViewCount(input.placeId);
        return { success: true };
      }),

    // Create place (admin only)
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string(),
        category: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createPlace(input);
        return { success: true };
      }),

    // Update place (admin only)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePlace(id, data);
        return { success: true };
      }),

    // Delete place (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlace(input.id);
        return { success: true };
      }),
  }),

  reviews: router({
    // Get reviews by place ID (public)
    getByPlaceId: publicProcedure
      .input(z.object({ placeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getReviewsByPlaceId(input.placeId);
      }),

    // Get all reviews (admin only)
    listAll: adminProcedure.query(async () => {
      return await db.getAllReviews();
    }),

    // Get all reviews (admin only) - alias for compatibility
    list: adminProcedure.query(async () => {
      return await db.getAllReviews();
    }),

    // Create review (authenticated users only)
    create: protectedProcedure
      .input(z.object({
        placeId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createReview({
          placeId: input.placeId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment,
        });
        return { success: true };
      }),

    // Delete review (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteReview(input.id);
        return { success: true };
      }),

    // Get all reviews for admin (public alias)
    getAllForAdmin: adminProcedure.query(async () => {
      return await db.getAllReviews();
    })
  }),

  stats: router({
    // Get view statistics (admin only)
    getViewStats: adminProcedure.query(async () => {
      return await db.getViewStats();
    }),
  }),

  categories: router({
    // Get all categories (public)
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
  }),
});

export type AppRouter = typeof appRouter;
