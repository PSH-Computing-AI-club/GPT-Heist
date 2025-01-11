import { type Prisma } from "@prisma/client"
import { db } from "./db" //Prisma client

const promptCache: Map<number, Prisma.UserPromptUncheckedCreateInput | Prisma.SystemPromptUncheckedCreateInput> = new Map()
let systemPrompts: number[] = []
let userPrompts: number[] = []

/**
 * Fetches all user's latest prompts, fetches any prompts not in promptCache, and cleans up unused prompts in promptCache
 */
export async function getLatest(){
    //Prepare some stuff
    systemPrompts = []
    userPrompts = []

    //Get users with submitted prompts
    const users = await db.user.findMany({
        where: {
            AND: [
                { latestSystemPromptId: { not: 0 } },
                { latestUserPromptId: { not: 0 } }
            ]
        }
    })

    //Keep track of which prompts are being used
    for(const user of users){
        if(user.latestSystemPromptId != 0){
            systemPrompts.push(user.latestSystemPromptId)
        }
        if(user.latestUserPromptId != 0){
            userPrompts.push(user.latestUserPromptId)
        }
    }

    //Fetch new prompts as needed
    for(const id of systemPrompts){
        if(!promptCache.has(id)){
            const fetchedPrompt = await db.systemPrompt.findFirst({ where: {id: id} })
            if(fetchedPrompt){
                promptCache.set(id, fetchedPrompt)
            } else {
                console.warn(`❌ DB: Did not find a system prompt with ID: ${id}`)
            }
        }
    }
    for(const id of userPrompts){
        if(!promptCache.has(id)){
            const fetchedPrompt = await db.userPrompt.findFirst({ where: {id: id} })
            if(fetchedPrompt){
                promptCache.set(id, fetchedPrompt)
            } else {
                console.warn(`❌ DB: Did not find a user prompt with ID: ${id}`)
            }
        }
    }

    //Clean up the cache. (Could have been run once every X function calls... but it really doesn't matter)
    for(const key of promptCache.keys()){
        if(!systemPrompts.includes(key) && !userPrompts.includes(key)){
            promptCache.delete(key)
        }
    }
}

/*
    The next section treats combinations of prompts as if they were on some matrix, and in order to get balanced usage of each prompt
    (that is, we don't have one prompt be paired up more than some other prompt), we get prompt combinations by taking the diagonal.
    After we're done with the diagonal, we shift the diagonal down by one, and wrap around as needed to stay in bounds.
    This strategy also works if we don't have the same number of user/system prompts

    For example, let A = {a, b, c} be the set of system prompts, let B = {1, 2, 3} be the set of user prompts
    Then we can put the Cartesian product of these sets into a matrix:
    a1 b1 c1                                              a1 b1 c1 d1
    a2 b2 c2                         (or if |A| != |B|):  a2 b2 c3 d4
    a3 b3 c3                                              a3 b3 c3 d4

    Taking the diagonal and wrapping the diagonal as needed gives us the pairs of prompts in this order:
    [a1, b2, c3,                                          [a1, b2, c3, d1,
     a2, b3, c1,                                           a2, b3, c1, d2,
     a3, b1, c2,                      (or if |A| != |B|):  a3, b1, c2, d3,
     a1, b2, c3, ...]                                      a1, b2, c3, d1, ...]
     and so on                                             and so on

    so much explanation for a few lines of code, lol
*/

type PromptPair = { userPrompt: Prisma.UserPromptUncheckedCreateInput, systemPrompt: Prisma.SystemPromptUncheckedCreateInput }
let nextPromptState = { index: 0, offset: 0 }
/**
 * An iterator-like function that returns the next combination of prompts
 * @returns `NextPrompts: {userPrompt: prompt, systemPrompt: prompt}`
 */
export function getNextPrompts(): PromptPair {
    const nextSystemPrompt = promptCache.get(systemPrompts[nextPromptState.index]) as Prisma.SystemPromptUncheckedCreateInput
    const nextUserPrompt = promptCache.get(userPrompts[(nextPromptState.index + nextPromptState.offset) % userPrompts.length]) as Prisma.UserPromptUncheckedCreateInput

    nextPromptState.index = (nextPromptState.index + 1) % systemPrompts.length
    if(nextPromptState.index == 0){
        nextPromptState.offset = (nextPromptState.offset + 1) % userPrompts.length
    }

    return { systemPrompt: nextSystemPrompt, userPrompt: nextUserPrompt }
}