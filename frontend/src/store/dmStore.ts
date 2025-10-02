import { create } from 'zustand';

interface DMConversation {
  id: string;
  isGroup: boolean;
  name?: string;
  participants: any[];
  messages?: any[];
  updatedAt: string;
}

interface DMMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
  edited: boolean;
  sender: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

interface DMState {
  conversations: DMConversation[];
  currentConversation: DMConversation | null;
  messages: Record<string, DMMessage[]>;
  setConversations: (conversations: DMConversation[]) => void;
  setCurrentConversation: (conversation: DMConversation | null) => void;
  addConversation: (conversation: DMConversation) => void;
  setMessages: (conversationId: string, messages: DMMessage[]) => void;
  addMessage: (conversationId: string, message: DMMessage) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<DMMessage>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
}

export const useDMStore = create<DMState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  addConversation: (conversation) =>
    set((state) => ({ conversations: [conversation, ...state.conversations] })),
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),
  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    })),
  deleteMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.filter((msg) => msg.id !== messageId),
      },
    })),
}));
