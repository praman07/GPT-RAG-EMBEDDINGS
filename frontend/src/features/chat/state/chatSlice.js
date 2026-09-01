import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { 
    fetchConversationsApi, 
    sendMessageApi, 
    renameConversationApi, 
    togglePinConversationApi, 
    deleteConversationApi 
} from '../api/chatApi.js';

const initialState = {
    conversations: [],
    selectedConversationId: null,
    messages: [],
    isLoadingConversations: false,
    isSending: false,
    error: null,
};

const syncCurrentMessagesToSelectedConversation = (state) => {
    if (!state.selectedConversationId) {
        return;
    }

    const conversation = state.conversations.find((item) => item.id === state.selectedConversationId);
    if (!conversation) {
        return;
    }

    conversation.messages = state.messages;
    conversation.updatedAt = new Date().toISOString();
};

const removePendingAssistantMessage = (state) => {
    const lastMessage = state.messages[ state.messages.length - 1 ];

    if (lastMessage?.author === 'ai' && !lastMessage.content) {
        state.messages.pop();
    }
};

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
    try {
        const response = await fetchConversationsApi();
        return response.conversations || [];
    } catch (error) {
        return rejectWithValue(error.message || 'Unable to load conversations');
    }
});

export const renameConversation = createAsyncThunk(
    'chat/renameConversation',
    async ({ id, title }, { rejectWithValue }) => {
        try {
            const response = await renameConversationApi(id, title);
            return response.conversation;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to rename conversation');
        }
    }
);

export const togglePinConversation = createAsyncThunk(
    'chat/togglePinConversation',
    async (id, { rejectWithValue }) => {
        try {
            const response = await togglePinConversationApi(id);
            return response.conversation;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to pin/unpin conversation');
        }
    }
);

export const deleteConversation = createAsyncThunk(
    'chat/deleteConversation',
    async (id, { rejectWithValue }) => {
        try {
            await deleteConversationApi(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to delete conversation');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ message = '', attachments = [] }, { dispatch, getState, rejectWithValue }) => {
        const trimmedMessage = message.trim();

        if (!trimmedMessage && attachments.length === 0) {
            return rejectWithValue('Please enter a message or attach a file');
        }

        const previousConversationId = getState().chat.selectedConversationId;

        dispatch(appendUserMessage({ message: trimmedMessage, attachments }));
        dispatch(startAssistantMessage());

        try {
            const { conversationId, conversationTitle } = await sendMessageApi({
                message: trimmedMessage,
                attachments,
                conversationId: previousConversationId,
                onToken: (token) => {
                    dispatch(appendAssistantToken(token));
                },
            });

            return {
                conversationId,
                conversationTitle,
                previousConversationId,
            };
        } catch (error) {
            return rejectWithValue(error.message || 'Unable to send message');
        }
    },
);

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        appendUserMessage: (state, action) => {
            const { message, attachments = [] } = action.payload || {};
            state.messages.push({
                id: `user-${Date.now()}`,
                author: 'user',
                content: message || '',
                attachments,
            });

            syncCurrentMessagesToSelectedConversation(state);
        },
        startAssistantMessage: (state) => {
            state.messages.push({
                id: `ai-${Date.now()}`,
                author: 'ai',
                content: '',
            });

            syncCurrentMessagesToSelectedConversation(state);
        },
        appendAssistantToken: (state, action) => {
            const lastMessage = state.messages[ state.messages.length - 1 ];

            if (lastMessage?.author === 'ai') {
                lastMessage.content += action.payload;
                syncCurrentMessagesToSelectedConversation(state);
                return;
            }

            state.messages.push({
                id: `ai-${Date.now()}`,
                author: 'ai',
                content: action.payload,
            });

            syncCurrentMessagesToSelectedConversation(state);
        },
        selectConversation: (state, action) => {
            const selectedConversationId = action.payload;
            state.selectedConversationId = selectedConversationId;

            const conversation = state.conversations.find((item) => item.id === selectedConversationId);
            state.messages = conversation ? [ ...conversation.messages ] : [];
        },
        clearChatError: (state) => {
            state.error = null;
        },
        resetChat: (state) => {
            state.conversations = [];
            state.selectedConversationId = null;
            state.messages = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.isLoadingConversations = true;
                state.error = null;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.isLoadingConversations = false;
                state.conversations = action.payload || [];
                state.selectedConversationId = null;
                state.messages = [];
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.isLoadingConversations = false;
                state.error = action.payload || action.error.message;
            })
            .addCase(renameConversation.fulfilled, (state, action) => {
                const updated = action.payload;
                const conversation = state.conversations.find((item) => item.id === updated.id);
                if (conversation) {
                    conversation.title = updated.title;
                }
            })
            .addCase(togglePinConversation.fulfilled, (state, action) => {
                const updated = action.payload;
                const conversation = state.conversations.find((item) => item.id === updated.id);
                if (conversation) {
                    conversation.isPinned = updated.isPinned;
                    state.conversations.sort((a, b) => {
                        if (Boolean(a.isPinned) === Boolean(b.isPinned)) {
                            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                        }
                        return a.isPinned ? -1 : 1;
                    });
                }
            })
            .addCase(deleteConversation.fulfilled, (state, action) => {
                const deletedId = action.payload;
                state.conversations = state.conversations.filter((item) => item.id !== deletedId);
                if (state.selectedConversationId === deletedId) {
                    const nextSelected = state.conversations[0];
                    state.selectedConversationId = nextSelected ? nextSelected.id : null;
                    state.messages = nextSelected ? [ ...(nextSelected.messages || []) ] : [];
                }
            })
            .addCase(sendMessage.pending, (state) => {
                state.isSending = true;
                state.error = null;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isSending = false;

                const { conversationId, conversationTitle, previousConversationId } = action.payload || {};

                if (!conversationId) {
                    return;
                }

                if (!previousConversationId) {
                    state.selectedConversationId = conversationId;
                    state.conversations.unshift({
                        id: conversationId,
                        title: conversationTitle || 'New chat',
                        messages: [ ...state.messages ],
                        updatedAt: new Date().toISOString(),
                    });
                    return;
                }

                const existingConversation = state.conversations.find((item) => item.id === conversationId);
                if (existingConversation) {
                    existingConversation.messages = [ ...state.messages ];
                    existingConversation.updatedAt = new Date().toISOString();

                    if (conversationTitle) {
                        existingConversation.title = conversationTitle;
                    }

                    state.conversations = [
                        existingConversation,
                        ...state.conversations.filter((item) => item.id !== conversationId),
                    ];
                    return;
                }

                state.conversations.unshift({
                    id: conversationId,
                    title: conversationTitle || 'New chat',
                    messages: [ ...state.messages ],
                    updatedAt: new Date().toISOString(),
                });
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isSending = false;
                state.error = action.payload || action.error.message;
                removePendingAssistantMessage(state);
            });
    },
});

export const {
    appendUserMessage,
    startAssistantMessage,
    appendAssistantToken,
    selectConversation,
    clearChatError,
    resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
