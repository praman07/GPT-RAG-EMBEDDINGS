import ConversationModel from "../models/conversation.model.js";
import MessageModel from "../models/message.model.js";
import { generateTitle, getStream } from "../services/ai.service.js";


export const handleMessage = async (req, res) => {
    const { message, conversationId } = req.body;

    let conversation = null

    if (!conversationId) {
        const title = await generateTitle({ message })

        conversation = await ConversationModel.create({
            title,
            user: req.user.id,
        })
    } else {
        conversation = await ConversationModel.findById(conversationId)
    }


    const userMessage = await MessageModel.create({
        conversation: conversation._id,
        content: message,
        author: 'user'
    })


    const stream = await getStream({ message })


    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const [ token, metadata ] of stream) {
        process.stdout.write(token.text);
        res.write(`data: ${token.text}\n\n`);
    }

    res.end();

}