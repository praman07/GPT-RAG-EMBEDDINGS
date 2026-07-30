import { Router } from 'express';
import protect from '../middleware/auth.middleware.js';
import { getConversations, handleMessage } from "../controllers/conversation.controller.js"


const conversationRouter = Router();


conversationRouter.post('/', protect, handleMessage);
conversationRouter.get('/', protect, getConversations);


export default conversationRouter;