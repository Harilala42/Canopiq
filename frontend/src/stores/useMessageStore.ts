import { create } from 'zustand';
import { MessageData } from '@/types/chat';

interface MessageState
{
    messages: MessageData[];
    isLoading: boolean;
    isThinking: boolean;

    setMessages: (messages: MessageData[]) => void; 
    setIsThinking: (isThinking: boolean) => void;
    setIsLoading: (isLoading: boolean) => void;

    addMessage: (message: MessageData) => void;
}

const useMessageStore = create<MessageState>((set) => ({
    messages: [],
    isLoading: false,
    isThinking: false,

    setMessages: (messages) => set({ messages }),

    setIsThinking: (isThinking) => set({ isThinking }),
    
    setIsLoading: (isLoading) => set({ isLoading }),

    addMessage: (newMessage) => set((state) => {
        const isDuplicate = state.messages.some((msg) => msg.id === newMessage.id);
        if (isDuplicate) return (state);
        
        return { messages: [...state.messages, newMessage] };
    })
}));

export default useMessageStore;
