import { useDispatch, useSelector } from 'react-redux';
import {
    clearChatError,
    fetchConversations,
    resetChat,
    selectConversation,
    sendMessage,
    renameConversation,
    togglePinConversation,
    deleteConversation,
} from '../state/chatSlice.js';

const useChat = () => {
    const dispatch = useDispatch();
    const chatState = useSelector((state) => state.chat);

    return {
        ...chatState,
        loadConversations: () => dispatch(fetchConversations()),
        chooseConversation: (conversationId) => dispatch(selectConversation(conversationId)),
        send: (message, attachments = []) => dispatch(sendMessage({ message, attachments })),
        clearError: () => dispatch(clearChatError()),
        reset: () => dispatch(resetChat()),
        rename: (id, title) => dispatch(renameConversation({ id, title })),
        togglePin: (id) => dispatch(togglePinConversation(id)),
        remove: (id) => dispatch(deleteConversation(id)),
    };
};

export default useChat;
