import { getLatest, getNextPrompts } from "./promptFetcher"
import { ChatWorker } from "./worker"


async function main() {
    let worker = new ChatWorker({baseURL: "http://localhost:3333"})
    await getLatest()
    for(let i=0; i < 100; i++){
        await worker.doChat(getNextPrompts())
    }
}

main()