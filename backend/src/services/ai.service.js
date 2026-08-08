import { ChatMistralAI } from "@langchain/mistralai"
import { createAgent, toolStrategy, HumanMessage, AIMessage, tool } from "langchain"
import env from "../config/env.js";
import Context from "../models/context.model.js";
import * as z from "zod"


const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: env.MISTRALAI_API_KEY,
})

//––––––––––––––––– tools –––––––––––––––

const readContext = tool(
    async ({ userId }) => {
        const context = await Context.findOne({ user: userId })

        return context ? context.context : "no context found for this user"
    },
    {
        name: "readContext",
        description: "Reads the context for the current user.",
        schema: z.object({
            userId: z.string().describe("The ID of the user to read the context for."),
        })
    }
)

const updateContext = tool(
    async ({ userId, context }) => {
        const contextDoc = await Context.findOneAndUpdate(
            {
                user: userId
            },
            {
                context: context
            },
            {
                new: true,
                upsert: true
            }
        )

        return "context updated successfully"
    },
    {
        name: "updateContext",
        description: "Overwrites the context for the current user with the provided context.",
        schema: z.object({
            userId: z.string().describe("The ID of the user to update the context for."),
            context: z.string().describe("The new context to set for the user.")
        })
    }
)

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


export async function getStream({ messages, userId }) {

    const agent = createAgent({
        model,
        tools: [ readContext, updateContext ],
        systemPrompt: `
        


        Update the context for the current user whenever you found information that is relevant for weeks/months.

        read the current user context whenever you need to know about the user.

        current userId is ${userId}

        Current Date is ${new Date().toDateString()}
        `
    })

    const stream = agent.stream({
        messages: messages.map(msg => {
            if (msg.author == "user") {
                return new HumanMessage(msg.content)
            } else {
                return new AIMessage(msg.content)
            }
        })
    }, {
        streamMode: "messages"
    })

    return stream
}