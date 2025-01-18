import { type Prisma } from "@prisma/client"
import { db } from "./db" //Prisma client

const promptCache: Map<number, Prisma.PromptUncheckedCreateInput> = new Map()
const resultCache: Map<{systemPromptId: number, userPromptId: number}, number> = new Map()
let systemPrompts: number[] = []
let userPrompts: number[] = []

let CACHE_CLEANUP_DELAY = 20 //How many times getLatest() will run before the cache maps get cleaned up
let cacheCleanupCounter = 0

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
            const fetchedPrompt = await db.prompt.findFirst({ where: {id: id} })
            if(fetchedPrompt){
                promptCache.set(id, fetchedPrompt)
            } else {
                console.warn(`❌ DB: Did not find a system prompt with ID: ${id}`)
            }
        }
    }
    for(const id of userPrompts){
        if(!promptCache.has(id)){
            const fetchedPrompt = await db.prompt.findFirst({ where: {id: id} })
            if(fetchedPrompt){
                promptCache.set(id, fetchedPrompt)
            } else {
                console.warn(`❌ DB: Did not find a user prompt with ID: ${id}`)
            }
        }
    }

    //Clean up the cache.
    cacheCleanupCounter++
    if(cacheCleanupCounter >= CACHE_CLEANUP_DELAY){
        for(const key of promptCache.keys()){
            if(!systemPrompts.includes(key) && !userPrompts.includes(key)){
                promptCache.delete(key)
            }
        }
        for(const key of resultCache.keys()){
            if(!systemPrompts.includes(key.systemPromptId) || !userPrompts.includes(key.userPromptId)){
                resultCache.delete(key)
            }
        }
    }
}

/**
 * Saves the result id to the system and user prompts. Also marks the prompt pair as complete in a cache.
 * Note: The scheduling algorithm does *not* look at the database and uses an internal map to determine if a result exists
 */
export function saveChatResultId(systemPromptId: number, userPromptId: number, resultId: number){
    db.prompt.update({
        where: { id: userPromptId },
        data: { chatResultId: resultId }
    })
    db.prompt.update({
        where: { id: systemPromptId },
        data: { chatResultId: resultId }
    })

    resultCache.set({systemPromptId: systemPromptId, userPromptId: userPromptId}, resultId)
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

type PromptPair = { userPrompt: Prisma.PromptUncheckedCreateInput, systemPrompt: Prisma.PromptUncheckedCreateInput }
let nextPromptState = { index: 0, offset: 0 }
/**
 * An iterator-like function that returns the next combination of prompts
 * @returns `PromptPair: {userPrompt: prompt, systemPrompt: prompt} OR null if no prompts are available`
 */
export function getNextPrompts(): PromptPair | null {
    if(systemPrompts.length < 1 || userPrompts.length < 1){
        return null
    }

    const startPromptState = structuredClone(nextPromptState) //Keep track if we looped back to the start or not
    let nextPromptPair: PromptPair | null = null

    //Loop through all system+user prompt combinations at least once to find one without (cached) results
    do {
        const systemPromptIndex = nextPromptState.index
        const userPromptIndex = (nextPromptState.index + nextPromptState.offset) % userPrompts.length

        //nudge the state for next time
        nextPromptState.index = (nextPromptState.index + 1) % systemPrompts.length
        if(nextPromptState.index == 0){
            nextPromptState.offset = (nextPromptState.offset + 1) % userPrompts.length
        }

        //get our prompts if it doesn't have a (cached) result yet
        if(!resultCache.get({systemPromptId: systemPrompts[systemPromptIndex], userPromptId: userPrompts[userPromptIndex]})){
            return nextPromptPair = {
                userPrompt: promptCache.get(systemPrompts[systemPromptIndex]) as Prisma.PromptUncheckedCreateInput,
                systemPrompt: promptCache.get(userPrompts[userPromptIndex]) as Prisma.PromptUncheckedCreateInput
            }
        }
    } while(nextPromptState.index != startPromptState.index && nextPromptState.offset != startPromptState.offset)


    return null
}