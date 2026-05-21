import { create } from 'zustand';
import { MessageData, JobStatus } from '@/types/chat';

interface MessageState
{
    messages: MessageData[];
    isLoading: boolean;
    isThinking: boolean;

    currentStatus: JobStatus;
    errorMessage: string | null;

    setMessages: (messages: MessageData[]) => void; 
    setIsThinking: (isThinking: boolean) => void;
    setIsLoading: (isLoading: boolean) => void;

    setCurrentStatus: (status: JobStatus) => void;
    setErrorMessage: (message: string | null) => void;

    addMessage: (message: MessageData) => void;
    resetMessages: () => void;
}

const useMessageStore = create<MessageState>((set) => ({
    messages: [],
    isLoading: false,
    isThinking: false,

    currentStatus: 'queued',
    errorMessage: null,

    setMessages: (messages) => set({ messages }),

    setIsThinking: (isThinking) => set({ isThinking }),
    
    setIsLoading: (isLoading) => set({ isLoading }),

    setCurrentStatus: (currentStatus) => set({ currentStatus }),

    setErrorMessage: (errorMessage) => set({ errorMessage }),

    addMessage: (newMessage) => set((state) => {
        const isDuplicate = state.messages.some((msg) => msg.id === newMessage.id);
        if (isDuplicate) return (state);
        
        return { messages: [...state.messages, newMessage] };
    }),

    resetMessages: () => set({
        messages: [],
        isLoading: false,
        isThinking: false,
        currentStatus: 'queued',
        errorMessage: null
    })
}));

export default useMessageStore;
