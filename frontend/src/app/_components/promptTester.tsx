"use client";

import { api } from "~/trpc/react"

export default function PromptTester() {
  const promptMutation = api.prompts.create.useMutation()

  return (
    <div className="flex">
      <div className="bg-slate-300 rounded-lg m-3 p-3">
        <p className="text-xl text-black">Submit system prompt</p>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const prompt = formData.get("prompt") as string
          if(!prompt || prompt.length < 3){
            return
          }

          promptMutation.mutate({ type: "SYSTEM", prompt: prompt })
        }}>
          <label htmlFor="prompt" className="text-black">Prompt: </label>
          <input name="prompt" className="text-black px-2"></input>

          <button className="block bg-blue-900 px-2 py-1 mt-2 rounded-md">Submit</button>
        </form>
      </div>

      <div className="bg-slate-300 rounded-lg m-3 p-3">
        <p className="text-xl text-black">Submit user prompt</p>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const prompt = formData.get("prompt") as string
          if(!prompt || prompt.length < 3){
            return
          }

          promptMutation.mutate({ type: "USER", prompt: prompt })
        }}>
          <label htmlFor="prompt" className="text-black">Prompt: </label>
          <input name="prompt" className="text-black px-2"></input>

          <button className="block bg-blue-900 px-2 py-1 mt-2 rounded-md">Submit</button>
        </form>
      </div>
    </div>
  )
}