import { type ClientOptions, OpenAI as OpenAIClient } from "openai"
import { type Prisma } from "@prisma/client"
import OpenAI from "openai";

type PromptPair = { userPrompt: Prisma.PromptUncheckedCreateInput, systemPrompt: Prisma.PromptUncheckedCreateInput }


/**
 * Sends API calls to a LocalAi instance. Intended to be used in parallel with other `ChatWorker`s
 */
export class ChatWorker {
    client: OpenAIClient
    // nextTaskCallback: () => PromptPair

    constructor(options: Omit<ClientOptions, "apiKey">){
        this.client = new OpenAI({...options, apiKey: ""})
    }

    async doChat(prompts: PromptPair){
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

        return result
    }
}