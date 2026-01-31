import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Default AI providers
const DEFAULT_AI_PROVIDERS = [
  { name: "ChatGPT", icon: "bot", isDefault: true },
  { name: "Claude", icon: "brain", isDefault: true },
  { name: "Gemini", icon: "sparkles", isDefault: true },
  { name: "Copilot", icon: "code", isDefault: true },
];

export const aiProviderRouter = createTRPCRouter({
  // Get all AI providers for the current user (including defaults)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Get user's custom AI providers
    const userProviders = await ctx.db.aIProvider.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "asc" },
    });

    // Get system defaults
    const defaultProviders = await ctx.db.aIProvider.findMany({
      where: { userId: null, isDefault: true },
      orderBy: { createdAt: "asc" },
    });

    return [...defaultProviders, ...userProviders];
  }),

  // Get only default AI providers
  getDefaults: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.aIProvider.findMany({
      where: { userId: null, isDefault: true },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Create a custom AI provider
  createCustom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate
      const existing = await ctx.db.aIProvider.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: input.name,
        },
      });
      if (existing) {
        throw new Error("AI provider already exists");
      }

      return ctx.db.aIProvider.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          icon: input.icon ?? "bot",
          isDefault: false,
        },
      });
    }),

  // Update a custom AI provider
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.aIProvider.findUnique({
        where: { id: input.id },
      });

      if (!provider) throw new Error("Provider not found");
      if (provider.userId !== ctx.session.user.id) throw new Error("Unauthorized");
      if (provider.isDefault) throw new Error("Cannot update default provider");

      return ctx.db.aIProvider.update({
        where: { id: input.id },
        data: {
          name: input.name,
          icon: input.icon,
        },
      });
    }),

  // Delete a custom AI provider
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership and that it's not a default
      const provider = await ctx.db.aIProvider.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          isDefault: false,
        },
      });
      if (!provider) {
        throw new Error("AI provider not found or cannot be deleted");
      }

      return ctx.db.aIProvider.delete({
        where: { id: input.id },
      });
    }),

  // Ensure default AI providers exist
  ensureDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const existingDefaults = await ctx.db.aIProvider.findMany({
      where: { userId: null, isDefault: true },
    });

    const existingNames = existingDefaults.map((p) => p.name);

    // Create missing defaults
    for (const provider of DEFAULT_AI_PROVIDERS) {
      if (!existingNames.includes(provider.name)) {
        await ctx.db.aIProvider.create({
          data: {
            userId: null,
            name: provider.name,
            icon: provider.icon,
            isDefault: true,
          },
        });
      }
    }

    return ctx.db.aIProvider.findMany({
      where: { userId: null, isDefault: true },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Get user's active AI settings
  getActiveAIs: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.userActiveAI.findMany({
      where: { userId: ctx.session.user.id },
      include: { aiProvider: true },
    });
  }),

  // Toggle AI provider active status
  toggleActive: protectedProcedure
    .input(
      z.object({
        aiProviderId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.userActiveAI.findFirst({
        where: {
          userId: ctx.session.user.id,
          aiProviderId: input.aiProviderId,
        },
      });

      if (existing) {
        return ctx.db.userActiveAI.update({
          where: { id: existing.id },
          data: { isActive: input.isActive },
        });
      }

      return ctx.db.userActiveAI.create({
        data: {
          userId: ctx.session.user.id,
          aiProviderId: input.aiProviderId,
          isActive: input.isActive,
        },
      });
    }),
});
