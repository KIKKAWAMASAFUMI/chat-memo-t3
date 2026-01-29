import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const messageRouter = createTRPCRouter({
  // Get messages for a snippet
  getBySnippetId: protectedProcedure
    .input(z.object({ snippetId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership of the snippet
      const snippet = await ctx.db.snippet.findFirst({
        where: {
          id: input.snippetId,
          userId: ctx.session.user.id,
        },
      });
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      return ctx.db.message.findMany({
        where: { snippetId: input.snippetId },
        orderBy: { position: "asc" },
      });
    }),

  // Create a new message
  create: protectedProcedure
    .input(
      z.object({
        snippetId: z.string(),
        sender: z.string(),
        senderType: z.enum(["user", "ai"]),
        content: z.string(),
        displayMode: z.enum(["markdown", "plain"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of the snippet
      const snippet = await ctx.db.snippet.findFirst({
        where: {
          id: input.snippetId,
          userId: ctx.session.user.id,
        },
      });
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      // Get next position
      const lastMessage = await ctx.db.message.findFirst({
        where: { snippetId: input.snippetId },
        orderBy: { position: "desc" },
      });
      const position = (lastMessage?.position ?? -1) + 1;

      // Create message and update snippet's updatedAt
      const [message] = await ctx.db.$transaction([
        ctx.db.message.create({
          data: {
            snippetId: input.snippetId,
            sender: input.sender,
            senderType: input.senderType,
            content: input.content,
            displayMode: input.displayMode ?? "markdown",
            position,
          },
        }),
        ctx.db.snippet.update({
          where: { id: input.snippetId },
          data: { updatedAt: new Date() },
        }),
      ]);

      return message;
    }),

  // Update a message
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        displayMode: z.enum(["markdown", "plain"]).optional(),
        senderType: z.enum(["user", "ai"]).optional(),
        sender: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership through snippet
      const message = await ctx.db.message.findUnique({
        where: { id },
        include: { snippet: true },
      });
      if (!message || message.snippet.userId !== ctx.session.user.id) {
        throw new Error("Message not found");
      }

      // Filter out undefined values
      const updateData: Record<string, unknown> = {};
      if (data.content !== undefined) updateData.content = data.content;
      if (data.displayMode !== undefined) updateData.displayMode = data.displayMode;
      if (data.senderType !== undefined) updateData.senderType = data.senderType;
      if (data.sender !== undefined) updateData.sender = data.sender;

      return ctx.db.message.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete a message
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through snippet
      const message = await ctx.db.message.findUnique({
        where: { id: input.id },
        include: { snippet: true },
      });
      if (!message || message.snippet.userId !== ctx.session.user.id) {
        throw new Error("Message not found");
      }

      return ctx.db.message.delete({
        where: { id: input.id },
      });
    }),
});
