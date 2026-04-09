import { create } from 'zustand';
import { ChatData } from '@/types/chat';

interface ChatState
{
    queries: ChatData[];
    currentQuery: ChatData | null;

    setQueries: (queries: ChatData[]) => void;
    setCurrentQuery: (query: ChatData | null) => void;

    addQuery: (query: ChatData) => void;
    updateQuery: (id: string, updates: Partial<ChatData>) => void;
    deleteQuery: (id: string) => void;
}

const useChatStore = create<ChatState>((set) => ({
    queries: [],
    currentQuery: null,

    setQueries: (queries) => set({ queries }),
    
    setCurrentQuery: (query) => set({ currentQuery: query }),

    addQuery: (query) => set((state) => ({ 
        queries: [query, ...state.queries] 
    })),

    updateQuery: (id, updates) => set((state) => ({
        queries: state.queries.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        currentChatId: 
            state.currentQuery?.id === id 
            ? { ...state.currentQuery, ...updates } 
            : state.currentQuery
    })),

    deleteQuery: (id) => set((state) => ({
        queries: state.queries.filter((q) => q.id !== id),
        currentChatId: state.currentQuery?.id === id ? null : state.currentQuery
    }))
}));

export default useChatStore;
