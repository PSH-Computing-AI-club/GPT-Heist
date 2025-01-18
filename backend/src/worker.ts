import { type ClientOptions, OpenAI as OpenAIClient } from "openai"
import { type ChatCompletion } from "openai/resources"
import { type Prisma } from "@prisma/client"
import OpenAI from "openai";

type PromptPair = { userPrompt: Prisma.PromptUncheckedCreateInput, systemPrompt: Prisma.PromptUncheckedCreateInput }


/**
 * Sends API calls to a LocalAi instance. Intended to be used in parallel with multiple instances of `ChatWorker`
 */
export class ChatWorker {
    client: OpenAIClient
    busy: boolean
    // nextTaskCallback: () => PromptPair

    constructor(options: Omit<ClientOptions, "apiKey">){
        this.client = new OpenAI({...options, apiKey: ""})
        this.busy = false
    }

    async doChat(prompts: PromptPair): Promise<{userPromptId: number, systemPromptId: number, chatCompletion: ChatCompletion}> {
        this.busy = true
        console.log(`✨▶️ System-User IDs: ${prompts.systemPrompt.id}-${prompts.userPrompt.id}; System: ${prompts.systemPrompt.prompt}; User:${prompts.userPrompt.prompt}`)
        const stopwatch = Date.now()

        let result = await this.client.chat.completions.create({
            model: "llama-3.2-3b-instruct:q4_k_m",
            messages: [
                {role: "developer", content: prompts.systemPrompt.prompt},
                {role: "user", content: prompts.userPrompt.prompt},
            ],
            stream: false
        })

        const timeTaken = Date.now() - stopwatch
        const tokensPerSec = (result.usage?.total_tokens || 0) / (timeTaken/1000)
        console.log(`✨✔️ System-User IDs: ${prompts.systemPrompt.id}-${prompts.userPrompt.id}; ${tokensPerSec} Tokens/sec for ${timeTaken} ms`)
        this.busy = false

        return {userPromptId: 1, systemPromptId: 1, chatCompletion: result}
    }
}



/*
Left off: worker-aware load balancer

function scheduleWork()
    if no work
        return

    for each worker
        if work is available
            make that worker do the task

end

for each worker
    worker.onTaskComplete(scheduleWork)

setInterval(fetchPrompts && scheduleWork(), FETCH_INTERVAL)

*/