import useChatStore from '@/stores/useChatStore';
import { useState, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

export const useMenuOptionsController = (query: ChatData) => {
    const deleteQueryStore = useChatStore((state) => state.deleteQuery);
    const updateQueryStore = useChatStore((state) => state.updateQuery);

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [isCanceleded, setIsCanceleded] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isPinned, setIsPinned] = useState<boolean>(query.is_pinned);
    
    const { showAlert } = useContext(AlertContext);

    const deleteQuery = useCallback(async () => {
        try {
            await ChatAPI.delete(query.id);
            deleteQueryStore(query.id);
            showAlert(true, "Query deleted successfully.");
        } catch (err: any) {
            console.error("Failed to delete query:", err.message);
            showAlert(false, "Failed to delete the query. Please try again later.");
        }
    }, [query.id, deleteQueryStore, showAlert]);

    const togglePin = useCallback(async () => {
        const nextPinState = !isPinned;
        setIsPinned(nextPinState);

        try {
            await ChatAPI.togglePin(query.id, nextPinState);
            updateQueryStore(query.id, { is_pinned: nextPinState });
        } catch (err: any) {
            setIsPinned(query.is_pinned);
            console.error("Failed to toggle the query pin:", err.message);
            showAlert(false, "Failed to toggle the query pin. Please try again later.");
        }
    }, [query.id, isPinned, query.is_pinned, updateQueryStore, showAlert]);

    return {
        menuOpen,
        setMenuOpen,
        isCanceleded,
        setIsCanceleded,
        isUpdating,
        setIsUpdating,
        isPinned,
        deleteQuery,
        togglePin
    };
};
