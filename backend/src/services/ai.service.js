import { ChatMistralAI } from "@langchain/mistralai"
import { createAgent, toolStrategy, HumanMessage } from "langchain"
import * as z from "zod"
import env from "../config/env.js";


const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: env.MISTRALAI_API_KEY,
})

export async function generateTitle({ message }) {

    const agent = createAgent({
        model,
        systemPrompt: "Your role is to generate the title for the conversation on the basis of user first message",
        responseFormat: toolStrategy(z.object({
            title: z.string().describe("The title of the conversation based on the message"),
        }))
    })

    const response = await agent.invoke({
        messages: [
            new HumanMessage(message)
        ]
    })

    return response.structuredResponse.title

}


export async function getStream({ message }) {

    const agent = createAgent({
        model,
        tools: [],
    })

    const stream = agent.stream({
        messages: [
            new HumanMessage(message)
        ]
    }, {
        streamMode: "messages"
    })

    return stream
}