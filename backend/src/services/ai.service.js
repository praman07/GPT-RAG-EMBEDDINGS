import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent, HumanMessage, AIMessage, tool } from "langchain";
import env from "../config/env.js";
import Context from "../models/context.model.js";
import * as z from "zod";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { parseOffice } from "officeparser";

const apiKey = env.MISTRALAI_API_KEY;

const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey,
});

const visionModel = new ChatMistralAI({
    model: "pixtral-12b-2409",
    apiKey,
});

// Helper: Convert Data URI to Buffer
function dataUrlToBuffer(dataUrl) {
    if (!dataUrl || typeof dataUrl !== "string") {
        return null;
    }
    const parts = dataUrl.split(",");
    if (parts.length < 2) {
        return null;
    }
    return Buffer.from(parts[1], "base64");
}

/**
 * Extracts structured text/content from a document using Mistral OCR API,
 * with fallback to pdf-parse, mammoth, and officeparser.
 */
export async function processDocumentAttachment(attachment) {
    if (!attachment || attachment.type !== "document") {
        return "";
    }

    const fileUrl = attachment.url || attachment.data || "";
    const name = attachment.name || "document";
    const mimeType = attachment.mimeType || "";

    // 1. Attempt Mistral OCR API for PDF / Scanned documents / DOCX / PPTX
    try {
        if (apiKey && fileUrl.startsWith("data:")) {
            const ocrRes = await fetch("https://api.mistral.ai/v1/ocr", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "mistral-ocr-latest",
                    document: {
                        type: "document_url",
                        document_url: fileUrl,
                    },
                }),
            });

            if (ocrRes.ok) {
                const ocrData = await ocrRes.json();
                if (ocrData?.pages?.length > 0) {
                    const ocrMarkdown = ocrData.pages
                        .map((page, idx) => `--- Page ${idx + 1} ---\n${page.markdown || ""}`)
                        .join("\n\n")
                        .trim();

                    if (ocrMarkdown) {
                        return ocrMarkdown;
                    }
                }
            }
        }
    } catch (ocrErr) {
        console.warn(`Mistral OCR notice for ${name}:`, ocrErr.message);
    }

    // 2. Fallback: Parse locally using native Node parsers
    const buffer = dataUrlToBuffer(fileUrl);
    if (!buffer) {
        return "";
    }

    try {
        if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
            if (typeof PDFParse === "function") {
                const parser = new PDFParse({ data: buffer });
                const pdfText = await parser.getText();
                if (pdfText && pdfText.trim()) {
                    return pdfText.trim();
                }
            }
        }

        if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            name.toLowerCase().endsWith(".docx")
        ) {
            const result = await mammoth.extractRawText({ buffer });
            if (result?.value?.trim()) {
                return result.value.trim();
            }
        }

        if (
            mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
            name.toLowerCase().endsWith(".pptx")
        ) {
            const text = await parseOffice(buffer);
            if (typeof text === "string" && text.trim()) {
                return text.trim();
            }
        }
    } catch (parseErr) {
        console.error(`Local document parser error for ${name}:`, parseErr.message);
    }

    return "";
}

//––––––––––––––––– tools –––––––––––––––

const readContext = tool(
    async ({ userId }) => {
        const context = await Context.findOne({ user: userId });
        return context ? context.context : "No long-term context saved for this user yet.";
    },
    {
        name: "readContext",
        description: "Reads the context for the current user.",
        schema: z.object({
            userId: z.string().describe("The ID of the user to read the context for."),
        }),
    }
);

const updateContext = tool(
    async ({ userId, context }) => {
        const updatedContext = await Context.findOneAndUpdate(
            { user: userId },
            { context },
            { new: true, upsert: true }
        );
        return updatedContext.context;
    },
    {
        name: "updateContext",
        description: "Updates the context for the current user.",
        schema: z.object({
            userId: z.string().describe("The ID of the user to update the context for."),
            context: z.string().describe("The new context to save for the user."),
        }),
    }
);

export const getStream = async ({ messages, userId }) => {
    let hasImageAttachment = false;

    const formattedMessages = messages.map((msg) => {
        const textContent = msg.content || "";
        const attachments = msg.attachments || [];

        const hasImages = attachments.some((att) => att.type === "image");
        if (hasImages) {
            hasImageAttachment = true;
        }

        const docTexts = attachments
            .filter((att) => att.type === "document" && att.extractedText)
            .map((att) => `[Document: ${att.name}]\n${att.extractedText}`)
            .join("\n\n");

        if (msg.author === "user") {
            if (hasImages) {
                const messageContent = [];

                if (textContent || docTexts) {
                    const fullText = [textContent, docTexts].filter(Boolean).join("\n\n");
                    messageContent.push({
                        type: "text",
                        text: fullText || "Examine this image:",
                    });
                }

                for (const att of attachments) {
                    if (att.type === "image" && att.url) {
                        messageContent.push({
                            type: "image_url",
                            image_url: { url: att.url },
                        });
                    }
                }

                return new HumanMessage({ content: messageContent });
            } else {
                const combinedText = [textContent, docTexts].filter(Boolean).join("\n\n");
                return new HumanMessage(combinedText);
            }
        } else {
            return new AIMessage(textContent);
        }
    });

    const activeModel = hasImageAttachment ? visionModel : model;

    const agent = createAgent({
        model: activeModel,
        tools: [readContext, updateContext],
        systemPrompt: `
        You are Override AI, a powerful, intelligent AI assistant.
        Update the context for the current user whenever you find information that is relevant for weeks/months.
        Read the current user context whenever you need to know about the user.
        Current userId is ${userId}.
        Current Date is ${new Date().toDateString()}.
        `,
    });

    const stream = await agent.stream(
        { messages: formattedMessages },
        { streamMode: "messages" }
    );

    return stream;
};

export const generateTitle = async ({ message, attachments = [] }) => {
    const docNames = attachments.map((a) => a.name).join(", ");
    const promptInput = [message, docNames ? `[Files: ${docNames}]` : ""].filter(Boolean).join(" ");

    const response = await model.invoke([
        new HumanMessage(
            `Generate a concise, 3-5 word title summarizing this message. Do not use quotes or punctuation: ${promptInput.slice(0, 300)}`
        ),
    ]);

    return response.content ? response.content.toString().trim() : "New Chat";
};