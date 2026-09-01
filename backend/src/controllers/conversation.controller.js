import ConversationModel from "../models/conversation.model.js";
import MessageModel from "../models/message.model.js";
import { generateTitle, getStream, processDocumentAttachment } from "../services/ai.service.js";
import { AIMessageChunk } from "langchain";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateAndSanitizeAttachments(rawAttachments = []) {
    const processed = [];

    for (const att of rawAttachments) {
        if (!att || typeof att !== "object") {
            continue;
        }

        const type = att.type;
        const name = (att.name || "file").replace(/[^a-zA-Z0-9_.\- ]/g, "");
        const mimeType = (att.mimeType || "").toLowerCase();
        const url = att.url || att.data || "";

        if (!type || !url) {
            throw new Error(`Invalid attachment format for ${name}`);
        }

        // Validate size if base64
        if (url.startsWith("data:")) {
            const base64Length = url.split(",")[1]?.length || 0;
            const approxBytes = Math.round((base64Length * 3) / 4);
            if (approxBytes > MAX_FILE_SIZE_BYTES) {
                throw new Error(`File ${name} exceeds maximum size limit of 10MB`);
            }
        }

        if (type === "image") {
            const isImageMime = ALLOWED_IMAGE_TYPES.includes(mimeType) || /\.(png|jpe?g|webp)$/i.test(name);
            if (!isImageMime) {
                throw new Error(`Unsupported image type for ${name}. Allowed: PNG, JPEG, JPG, WEBP`);
            }
        } else if (type === "document") {
            const isDocMime = ALLOWED_DOC_TYPES.includes(mimeType) || /\.(pdf|docx|pptx)$/i.test(name);
            if (!isDocMime) {
                throw new Error(`Unsupported document type for ${name}. Allowed: PDF, DOCX, PPTX`);
            }
        } else {
            throw new Error(`Unsupported attachment type: ${type}`);
        }

        processed.push({
            type,
            name,
            mimeType: mimeType || (type === "image" ? "image/png" : "application/pdf"),
            url,
            extractedText: "",
        });
    }

    return processed;
}

export const getConversations = async (req, res, next) => {
    try {
        const conversations = await ConversationModel.find({ user: req.user.id })
            .sort({ isPinned: -1, updatedAt: -1 })
            .lean();

        if (!conversations.length) {
            return res.status(200).json({
                success: true,
                conversations: [],
            });
        }

        const conversationIds = conversations.map((conversation) => conversation._id);

        const messages = await MessageModel.find({
            conversation: { $in: conversationIds },
        })
            .sort({ createdAt: 1 })
            .lean();

        const messagesByConversation = new Map();

        for (const message of messages) {
            const key = message.conversation.toString();
            if (!messagesByConversation.has(key)) {
                messagesByConversation.set(key, []);
            }

            messagesByConversation.get(key).push({
                id: message._id,
                author: message.author,
                content: message.content || "",
                attachments: message.attachments || [],
                createdAt: message.createdAt,
            });
        }

        const responseConversations = conversations.map((conversation) => ({
            id: conversation._id,
            title: conversation.title,
            isPinned: Boolean(conversation.isPinned),
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messages: messagesByConversation.get(conversation._id.toString()) || [],
        }));

        return res.status(200).json({
            success: true,
            conversations: responseConversations,
        });
    } catch (error) {
        next(error);
    }
};

export const handleMessage = async (req, res, next) => {
    try {
        const { message = "", conversationId, attachments: rawAttachments = [] } = req.body;
        const user = req.user;

        const trimmedMessage = message.trim();

        if (!trimmedMessage && rawAttachments.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message or select a file attachment.",
            });
        }

        // Validate and sanitize attachments
        let sanitizedAttachments = [];
        try {
            sanitizedAttachments = validateAndSanitizeAttachments(rawAttachments);
        } catch (valErr) {
            return res.status(400).json({
                success: false,
                message: valErr.message,
            });
        }

        // Process document attachments for OCR / text extraction
        for (const att of sanitizedAttachments) {
            if (att.type === "document") {
                try {
                    att.extractedText = await processDocumentAttachment(att);
                } catch (ocrErr) {
                    console.error("Document text extraction error:", ocrErr.message);
                }
            }
        }

        let conversation = null;

        if (!conversationId) {
            const title = await generateTitle({ message: trimmedMessage, attachments: sanitizedAttachments });
            conversation = await ConversationModel.create({
                title,
                user: req.user.id,
            });
        } else {
            conversation = await ConversationModel.findOne({
                _id: conversationId,
                user: req.user.id,
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: "Conversation not found",
                });
            }
        }

        // Save user message with attachments to MongoDB
        await MessageModel.create({
            conversation: conversation._id,
            content: trimmedMessage,
            attachments: sanitizedAttachments,
            author: "user",
        });

        const messages = await MessageModel.find({ conversation: conversation._id })
            .sort({ createdAt: 1 })
            .lean();

        let stream;
        try {
            stream = await getStream({ messages, userId: user.id });
        } catch (aiErr) {
            console.error("Mistral AI Service Error:", aiErr.message);
            return res.status(500).json({
                success: false,
                message: "Unable to process request with Mistral API. Please check your API key and connection.",
            });
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        res.setHeader("X-Conversation-Id", conversation._id.toString());
        res.setHeader("X-Conversation-Title", conversation.title);
        res.setHeader("Access-Control-Expose-Headers", "X-Conversation-Id, X-Conversation-Title");

        let assistantReply = "";

        for await (const chunk of stream) {
            let token = Array.isArray(chunk) ? chunk[0] : chunk;
            if (!token) continue;

            // 1. Skip non-AI messages (e.g. ToolMessage, SystemMessage, HumanMessage)
            const type = typeof token._getType === "function" ? token._getType() : token.type;
            if (type && type !== "ai") {
                continue;
            }

            // 2. Skip AI messages that are requesting tool execution
            if (
                (token.tool_calls && token.tool_calls.length > 0) ||
                (token.tool_call_chunks && token.tool_call_chunks.length > 0)
            ) {
                continue;
            }

            let tokenText = "";
            if (typeof token.content === "string") {
                tokenText = token.content;
            } else if (Array.isArray(token.content)) {
                tokenText = token.content
                    .filter((c) => c.type === "text" || typeof c === "string")
                    .map((c) => (typeof c === "string" ? c : c.text || ""))
                    .join("");
            } else if (typeof token.text === "string") {
                tokenText = token.text;
            }

            if (!tokenText) continue;

            assistantReply += tokenText;

            const lines = tokenText.split("\n");
            for (const line of lines) {
                res.write(`data: ${line}\n`);
            }
            res.write("\n");
        }

        if (assistantReply.trim()) {
            await MessageModel.create({
                conversation: conversation._id,
                content: assistantReply,
                author: "ai",
            });
        }

        await ConversationModel.updateOne(
            { _id: conversation._id },
            { $set: { updatedAt: new Date() } }
        );

        res.end();
    } catch (error) {
        if (!res.headersSent) {
            next(error);
        } else {
            console.error("Error during streaming response:", error);
            res.end();
        }
    }
};

export const renameConversation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        const conversation = await ConversationModel.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { $set: { title: title.trim() } },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found" });
        }

        return res.status(200).json({
            success: true,
            conversation: {
                id: conversation._id,
                title: conversation.title,
                isPinned: Boolean(conversation.isPinned),
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const togglePinConversation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const conversation = await ConversationModel.findOne({ _id: id, user: req.user.id });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found" });
        }

        conversation.isPinned = !conversation.isPinned;
        await conversation.save();

        return res.status(200).json({
            success: true,
            conversation: {
                id: conversation._id,
                title: conversation.title,
                isPinned: conversation.isPinned,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteConversation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const conversation = await ConversationModel.findOneAndDelete({ _id: id, user: req.user.id });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found" });
        }

        await MessageModel.deleteMany({ conversation: id });

        return res.status(200).json({
            success: true,
            message: "Conversation deleted successfully",
            id: id,
        });
    } catch (error) {
        next(error);
    }
};