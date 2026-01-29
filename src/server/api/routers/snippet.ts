import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const snippetRouter = createTRPCRouter({
  // Get all snippets for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.snippet.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });
  }),

  // Get a single snippet by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.snippet.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          messages: { orderBy: { position: "asc" } },
          tags: { include: { tag: true } },
        },
      });
    }),

  // Create a new snippet
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.snippet.create({
        data: {
          userId: ctx.session.user.id,
          title: input.title,
          tags: input.tagIds
            ? {
                create: input.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
        },
        include: {
          tags: { include: { tag: true } },
        },
      });
    }),

  // Update a snippet
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, title, tagIds } = input;

      // Verify ownership
      const snippet = await ctx.db.snippet.findFirst({
        where: { id, userId: ctx.session.user.id },
      });
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      // Update tags if provided
      if (tagIds !== undefined) {
        await ctx.db.snippetTag.deleteMany({
          where: { snippetId: id },
        });
        if (tagIds.length > 0) {
          await ctx.db.snippetTag.createMany({
            data: tagIds.map((tagId) => ({ snippetId: id, tagId })),
          });
        }
      }

      return ctx.db.snippet.update({
        where: { id },
        data: title ? { title } : {},
        include: {
          tags: { include: { tag: true } },
        },
      });
    }),

  // Delete a snippet
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const snippet = await ctx.db.snippet.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      return ctx.db.snippet.delete({
        where: { id: input.id },
      });
    }),

  // Search snippets by title
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.snippet.findMany({
        where: {
          userId: ctx.session.user.id,
          title: { contains: input.query, mode: "insensitive" },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          tags: { include: { tag: true } },
        },
      });
    }),

  // Filter snippets by tags
  filterByTags: protectedProcedure
    .input(z.object({ tagIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      if (input.tagIds.length === 0) {
        return ctx.db.snippet.findMany({
          where: { userId: ctx.session.user.id },
          orderBy: { updatedAt: "desc" },
          include: {
            tags: { include: { tag: true } },
          },
        });
      }

      return ctx.db.snippet.findMany({
        where: {
          userId: ctx.session.user.id,
          tags: {
            some: { tagId: { in: input.tagIds } },
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          tags: { include: { tag: true } },
        },
      });
    }),
});
