import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { promptRouter } from "~/server/api/routers/prompts";

export const appRouter = createTRPCRouter({
  prompts: promptRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
