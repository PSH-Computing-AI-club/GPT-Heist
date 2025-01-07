import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"

export const promptRouter = createTRPCRouter({
    create: publicProcedure
        .input(
            z.object({
                type: z.enum(["SYSTEM","USER"]),
                prompt: z.string()
            })
        )
        .mutation(async ({ctx, input}) => {
            if(input.type == "SYSTEM"){
                await ctx.db.systemPrompt.create({
                    data: {
                        prompt: input.prompt,
                        userId: 1
                    }
                })
            } else if(input.type == "USER"){
                await ctx.db.userPrompt.create({
                    data: {
                        prompt: input.prompt,
                        userId: 1
                    }
                })
            }

            console.log("Created prompt")
        })
})