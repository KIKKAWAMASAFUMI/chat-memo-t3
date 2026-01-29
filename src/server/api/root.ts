import { snippetRouter } from "~/server/api/routers/snippet";
import { messageRouter } from "~/server/api/routers/message";
import { tagRouter } from "~/server/api/routers/tag";
import { aiProviderRouter } from "~/server/api/routers/aiProvider";
import { settingsRouter } from "~/server/api/routers/settings";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  snippet: snippetRouter,
  message: messageRouter,
  tag: tagRouter,
  aiProvider: aiProviderRouter,
  settings: settingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.snippet.getAll();
 */
export const createCaller = createCallerFactory(appRouter);
