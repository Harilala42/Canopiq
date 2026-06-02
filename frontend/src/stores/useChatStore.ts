import { create } from 'zustand';
import { ChatData } from '@/types/chat';
import useMapStore from '@/stores/useMapStore';
import useMessageStore from "@/stores/useMessageStore";
import useAnalyticsStore from '@/stores/useAnalyticsStore';

interface ChatState
{
    queries: ChatData[];
    currentQuery: ChatData | null;

    isOpen: boolean;
    isVisible: boolean;

    setQueries: (queries: ChatData[]) => void;
    setCurrentQuery: (query: ChatData | null) => void;

    addQuery: (query: ChatData) => void;
    updateQuery: (id: string, updates: Partial<ChatData>) => void;
    deleteQuery: (id: string) => void;

    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
}

const useChatStore = create<ChatState>((set, get) => ({
    queries: [],
    currentQuery: null,

    isOpen: true,
    isVisible: true,

    setQueries: (queries) => set({ queries }),
    
    setCurrentQuery: (query) => set({ currentQuery: query }),

    addQuery: (query) => set((state) => ({ 
        queries: [query, ...state.queries] 
    })),

    updateQuery: (id, updates) => set((state) => ({
        queries: state.queries.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        currentQuery: 
            state.currentQuery?.id === id 
            ? { ...state.currentQuery, ...updates } 
            : state.currentQuery
    })),

    deleteQuery: (id) => {
        const { currentQuery } = get();
        const { clearMap } = useMapStore.getState();
        const { resetMessages } = useMessageStore.getState();
        const { closeChart, resetAnalyticsData } = useAnalyticsStore.getState();

        if (currentQuery?.id === id) {
            closeChart();

            clearMap();
            resetMessages();
            resetAnalyticsData();
        }

        set((state) => ({
            queries: state.queries.filter((q) => q.id !== id),
            currentQuery: state.currentQuery?.id === id ? null : state.currentQuery
        }));
    },

    openChat: () => set({ isOpen: true, isVisible: true }),

    closeChat: () => {
        set({ isVisible: false });
        setTimeout(() => set({ isOpen: false }), 300);
    },

    toggleChat: () => {
        const state = get();
        state.isOpen ? state.closeChat() : state.openChat()
    }
}));

export default useChatStore;
