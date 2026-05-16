import useChatStore from '@/stores/useChatStore';
import { useState, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

export const useChatDialogController = (query: ChatData, onClose: () => void) => {
    const updateQueryStore = useChatStore((state) => state.updateQuery);
    const [newTitle, setNewTitle] = useState<string>(query.title);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { showAlert } = useContext(AlertContext);

    const renameQuery = useCallback(async () => {
        if (!newTitle.trim() || newTitle === query.title) return;
        setIsSaving(true);

        try {
            await ChatAPI.rename(query.id, newTitle);
            updateQueryStore(query.id, { title: newTitle });
            showAlert(true, "Query renamed successfully.");
            onClose();
        } catch (err: any) {
            console.error("Failed to update query:", err.message);
            showAlert(false, "Failed to rename the query. Please try again later.");
        } finally {
            setIsSaving(false);
        }
    }, [query.id, newTitle, query.title, updateQueryStore, showAlert, onClose]);

    const handleCancel = useCallback(() => {
        setNewTitle(query.title);
        onClose();
    }, [query.title, onClose]);

    return {
        newTitle,
        setNewTitle,
        isSaving,
        renameQuery,
        handleCancel,
        isSaveDisabled: !newTitle.trim() || isSaving || newTitle === query.title
    };
};
