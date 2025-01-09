import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

const promptCache: Map<number, string> = new Map()
let systemPrompts: Set<number> = new Set()
let userPrompts: Set<number> = new Set()

export async function getLatest(){
    //Prepare some stuff
    systemPrompts.clear()
    userPrompts.clear()

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
            systemPrompts.add(user.latestSystemPromptId)
        }
        if(user.latestUserPromptId != 0){
            userPrompts.add(user.latestUserPromptId)
        }
    }

    //Fetch new prompts as needed
    for(const id of systemPrompts.keys()){
        if(!promptCache.has(id)){
            const fetchedPrompt = await db.systemPrompt.findFirst({ where: {id: id} })
            if(fetchedPrompt){
                promptCache.set(id, fetchedPrompt.prompt)
            } else {
                console.warn(`❌ DB: Did not find a system prompt with ID: ${id}`)
            }
        }
    }
    for(const id of userPrompts.keys()){
        if(!promptCache.has(id)){
            const fetchedPrompt = await db.userPrompt.findFirst({ where: {id: id} })
            if(fetchedPrompt){
                promptCache.set(id, fetchedPrompt.prompt)
            } else {
                console.warn(`❌ DB: Did not find a user prompt with ID: ${id}`)
            }
        }
    }

    //Clean up the cache. (Could have been run once every X function calls... but it really doesn't matter)
    for(const key of promptCache.keys()){
        if(!systemPrompts.has(key) || !userPrompts.has(key)){
            promptCache.delete(key)
        }
    }
}