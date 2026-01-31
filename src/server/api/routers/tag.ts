import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  // Get all tags for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Create a new tag
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate
      const existing = await ctx.db.tag.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: input.name,
        },
      });
      if (existing) {
        throw new Error("Tag already exists");
      }

      return ctx.db.tag.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          color: input.color,
        },
      });
    }),

  // Update a tag
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const tag = await ctx.db.tag.findFirst({
        where: { id, userId: ctx.session.user.id },
      });
      if (!tag) {
        throw new Error("Tag not found");
      }

      // Check for duplicate name if updating
      if (data.name && data.name !== tag.name) {
        const existing = await ctx.db.tag.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: data.name,
            NOT: { id },
          },
        });
        if (existing) {
          throw new Error("Tag name already exists");
        }
      }

      return ctx.db.tag.update({
        where: { id },
        data,
      });
    }),

  // Delete a tag
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const tag = await ctx.db.tag.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!tag) {
        throw new Error("Tag not found");
      }

      // Delete all snippet associations first
      await ctx.db.snippetTag.deleteMany({
        where: { tagId: input.id },
      });

      return ctx.db.tag.delete({
        where: { id: input.id },
      });
    }),

  // Add tag to snippet
  addToSnippet: protectedProcedure
    .input(
      z.object({
        snippetId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of snippet
      const snippet = await ctx.db.snippet.findFirst({
        where: { id: input.snippetId, userId: ctx.session.user.id },
      });
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      // Verify ownership of tag
      const tag = await ctx.db.tag.findFirst({
        where: { id: input.tagId, userId: ctx.session.user.id },
      });
      if (!tag) {
        throw new Error("Tag not found");
      }

      // Check if already exists
      const existing = await ctx.db.snippetTag.findUnique({
        where: {
          snippetId_tagId: {
            snippetId: input.snippetId,
            tagId: input.tagId,
          },
        },
      });
      if (existing) {
        return existing;
      }

      return ctx.db.snippetTag.create({
        data: {
          snippetId: input.snippetId,
          tagId: input.tagId,
        },
      });
    }),

  // Remove tag from snippet
  removeFromSnippet: protectedProcedure
    .input(
      z.object({
        snippetId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of snippet
      const snippet = await ctx.db.snippet.findFirst({
        where: { id: input.snippetId, userId: ctx.session.user.id },
      });
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      return ctx.db.snippetTag.delete({
        where: {
          snippetId_tagId: {
            snippetId: input.snippetId,
            tagId: input.tagId,
          },
        },
      });
    }),

  // Get tags for a snippet
  getForSnippet: protectedProcedure
    .input(z.object({ snippetId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership of snippet
      const snippet = await ctx.db.snippet.findFirst({
        where: { id: input.snippetId, userId: ctx.session.user.id },
      });
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      const snippetTags = await ctx.db.snippetTag.findMany({
        where: { snippetId: input.snippetId },
        include: { tag: true },
      });

      return snippetTags.map((st) => st.tag);
    }),
});
