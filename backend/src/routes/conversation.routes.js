import { Router } from 'express';
import protect from '../middleware/auth.middleware.js';
import { 
    getConversations, 
    handleMessage, 
    renameConversation, 
    togglePinConversation, 
    deleteConversation 
} from "../controllers/conversation.controller.js";

const conversationRouter = Router();

conversationRouter.post('/', protect, handleMessage);
conversationRouter.get('/', protect, getConversations);
conversationRouter.patch('/:id/rename', protect, renameConversation);
conversationRouter.patch('/:id/pin', protect, togglePinConversation);
conversationRouter.delete('/:id', protect, deleteConversation);

export default conversationRouter;