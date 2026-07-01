import { create } from 'zustand';
import { ChatData } from '@/types/chat';
import useMapStore from '@/stores/useMapStore';
import useMessageStore from "@/stores/useMessageStore";
import useAnalyticsStore from '@/stores/useAnalyticsStore';

interface ChatState
{
    isOpen: boolean;

    queries: ChatData[];
    currentQuery: ChatData | null;
    currentJobId: string | null;

    setQueries: (queries: ChatData[]) => void;
    setCurrentQuery: (query: ChatData | null) => void;
    setCurrentJobId: (jobId: string | null) => void;

    addQuery: (query: ChatData) => void;
    updateQuery: (id: string, updates: Partial<ChatData>) => void;
    deleteQuery: (id: string) => void;

    openSidebar: () => void;
    closeSideBar: () => void;
    toggleSideBar: () => void;
}

const useChatStore = create<ChatState>((set, get) => ({
    isOpen: false,

    queries: [],
    currentQuery: null,
    currentJobId: null,

    setQueries: (queries) => set({ queries }),
    
    setCurrentQuery: (query) => set({ currentQuery: query }),

    setCurrentJobId: (jobId) => set({ currentJobId: jobId }),

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
        const { resetAnalyses } = useAnalyticsStore.getState();

        if (currentQuery?.id === id) {
            clearMap();
            resetMessages();
            resetAnalyses();
        }

        set((state) => ({
            queries: state.queries.filter((q) => q.id !== id),
            currentQuery: state.currentQuery?.id === id ? null : state.currentQuery
        }));
    },

    openSidebar: () => set({ isOpen: true }),

    closeSideBar: () => set({ isOpen: false }),

    toggleSideBar: () => {
        const state = get();
        state.isOpen ? state.closeSideBar() : state.openSidebar()
    }
}));

export default useChatStore;
