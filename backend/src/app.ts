import { type ChatCompletion } from "openai/resources"
import { ChatWorker } from "./worker"
import { db } from "./db" //Prisma client
import { getLatest, getNextPrompts } from "./promptFetcher"

let workers: ChatWorker[] = []

/**
 * Distributes tasks to available workers
 */
async function runScheduler(){
    await getLatest()

    for(const worker of workers){
        if(worker.busy){
            continue
        }

        worker.doChat(getNextPrompts()).then(handleChatCompletion)
    }
}

async function handleChatCompletion(chatCompletion: ChatCompletion){
    if(chatCompletion.choices.length == 0 || !chatCompletion.choices[0].message.content){
        console.warn("⚠️ chatCompletion returned with no message content")
        console.warn(chatCompletion.choices.length == 0 ? chatCompletion : chatCompletion.choices[0].message)
        return
    }

    db.chatResult.create({
        data: {
            results: chatCompletion.choices[0].message.content,
        }
    })
    //left off: update the user and system prompt's result fields after creation
    //and something else in runscheduler()
}

async function main() {
    const workerURLs: string[] = process.env.WORKER_URLS?.split(";") || []
    if(workerURLs.length == 0){
        console.log("❌ No WORKER_URLS configured in .env, exiting.")
        process.exit(1)
    }

    for(const url of workerURLs){
        let worker = new ChatWorker({baseURL: url})
        workers.push(worker)
    }
}

main()