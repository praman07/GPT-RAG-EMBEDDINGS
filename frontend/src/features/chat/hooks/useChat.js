import { useDispatch, useSelector } from 'react-redux';
import {
    clearChatError,
    fetchConversations,
    resetChat,
    selectConversation,
    sendMessage,
} from '../state/chatSlice.js';

const useChat = () => {
    const dispatch = useDispatch();
    const chatState = useSelector((state) => state.chat);

    return {
        ...chatState,
        loadConversations: () => dispatch(fetchConversations()),
        chooseConversation: (conversationId) => dispatch(selectConversation(conversationId)),
        send: (message) => dispatch(sendMessage({ message })),
        clearError: () => dispatch(clearChatError()),
        reset: () => dispatch(resetChat()),
    };
};

export default useChat;
