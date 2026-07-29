import { Router } from 'express';
import protect from '../middleware/auth.middleware.js';
import { handleMessage } from "../controllers/conversation.controller.js"


const conversationRouter = Router();


conversationRouter.post('/', protect, handleMessage);


export default conversationRouter;