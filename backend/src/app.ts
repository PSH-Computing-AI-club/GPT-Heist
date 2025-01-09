import OpenAI from "openai";
import { getLatest } from "./dataFetcher";

const client = new OpenAI({
    baseURL: "http://localhost:8080",
    apiKey: ""
})


async function main() {
    // const stream = await client.chat.completions.create({
    //     model: "llama-3.2-3b-instruct:q4_k_m",
    //     messages: [{role: "user", content: "Provide a detailed apple pie recipe"}],
    //     stream: true
    // })

    // for await (const chunk of stream) {
    //     process.stdout.write(chunk.choices[0]?.delta?.content || "")
    // }

    getLatest()
}

main()


//New user
    //take in new user prompts
    //take in new system prompts
//Worker
    //spread out workload to available runners
    //save results
//Stats
    //See latest events
    //Worker usage