import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const MAX_CUSTOM_AIS = 20;

export const settingsRouter = createTRPCRouter({
  // Get user settings (create if not exists)
  get: protectedProcedure.query(async ({ ctx }) => {
    let settings = await ctx.db.userSettings.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!settings) {
      settings = await ctx.db.userSettings.create({
        data: {
          userId: ctx.session.user.id,
          userName: "あなた",
          customAINames: [],
          defaultDisplayMode: "markdown",
        },
      });
    }

    return settings;
  }),

  // Update user settings
  update: protectedProcedure
    .input(
      z.object({
        userName: z.string().optional(),
        defaultDisplayMode: z.enum(["markdown", "plain"]).optional(),
        customAINames: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure settings exist
      let settings = await ctx.db.userSettings.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!settings) {
        settings = await ctx.db.userSettings.create({
          data: {
            userId: ctx.session.user.id,
            userName: input.userName ?? "あなた",
            customAINames: input.customAINames ?? [],
            defaultDisplayMode: input.defaultDisplayMode ?? "markdown",
          },
        });
        return settings;
      }

      return ctx.db.userSettings.update({
        where: { userId: ctx.session.user.id },
        data: input,
      });
    }),

  // Update user name
  updateUserName: protectedProcedure
    .input(z.object({ userName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userSettings.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          userName: input.userName,
          customAINames: [],
          defaultDisplayMode: "markdown",
        },
        update: { userName: input.userName },
      });
    }),

  // Update default display mode
  updateDisplayMode: protectedProcedure
    .input(z.object({ displayMode: z.enum(["markdown", "plain"]) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userSettings.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          userName: "あなた",
          customAINames: [],
          defaultDisplayMode: input.displayMode,
        },
        update: { defaultDisplayMode: input.displayMode },
      });
    }),

  // Add custom AI name
  addCustomAI: protectedProcedure
    .input(z.object({ aiName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.db.userSettings.findUnique({
        where: { userId: ctx.session.user.id },
      });

      const currentNames = settings?.customAINames ?? [];

      if (currentNames.length >= MAX_CUSTOM_AIS) {
        throw new Error(`Maximum ${MAX_CUSTOM_AIS} custom AIs allowed`);
      }

      if (currentNames.includes(input.aiName)) {
        throw new Error("AI name already exists");
      }

      return ctx.db.userSettings.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          userName: "あなた",
          customAINames: [input.aiName],
          defaultDisplayMode: "markdown",
        },
        update: {
          customAINames: [...currentNames, input.aiName],
        },
      });
    }),

  // Remove custom AI name
  removeCustomAI: protectedProcedure
    .input(z.object({ aiName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.db.userSettings.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!settings) {
        throw new Error("Settings not found");
      }

      const updatedNames = settings.customAINames.filter(
        (name) => name !== input.aiName
      );

      return ctx.db.userSettings.update({
        where: { userId: ctx.session.user.id },
        data: { customAINames: updatedNames },
      });
    }),
});
