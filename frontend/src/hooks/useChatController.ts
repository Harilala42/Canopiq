import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { useEffect, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { supabase } from '@/utils/supabase.utils';
import { MessageAPI } from '@/api/message.api';
import { MessageData } from '@/types/chat';
import useAnalyticsStore from '@/stores/useAnalyticsStore';

export const useChatController = () => {
    const isOpen = useChatStore((state) => state.isOpen);
    const isVisible = useChatStore((state) => state.isVisible);
    const isThinking = useMessageStore((state) => state.isThinking);
    const currentQuery = useChatStore((state) => state.currentQuery);
    
    const setMessages = useMessageStore((state) => state.setMessages);
    const setIsLoading = useMessageStore((state) => state.setIsLoading);
    const addMessage = useMessageStore((state) => state.addMessage);
    
    const openChat = useChatStore((state) => state.openChat);
    const closeChat = useChatStore((state) => state.closeChat);
    const toggleChat = useChatStore((state) => state.toggleChat);

    const setGeoAnalysisId = useAnalyticsStore((state) => state.setGeoAnalysisId);

    const { showAlert } = useContext(AlertContext);

    const retrieveChatMessages = useCallback(async () => {
        if (!currentQuery?.id || isThinking) return;
        setMessages([]);
        setIsLoading(true);

        try {
            const messageList = await MessageAPI.getAll(currentQuery.id);
            if (messageList && messageList?.messages) {
                setMessages(messageList.messages);
            }
        } catch (err: any) {
            console.error("Failed to load chat messages:", err.message);
            showAlert(false, "Failed to load chat messages. Try again later!");
        } finally {
            setIsLoading(false);
        }
    }, [currentQuery?.id, setMessages, setIsLoading, showAlert]);

    useEffect(() => {
        openChat();
        if (!currentQuery?.id) return;

        const channel = supabase
            .channel(`messages-${currentQuery.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${currentQuery.id}`
                },
                (payload: any) => {
                    const { id, role, content, created_at, geo_analysis_id } = payload.new;
                    if (role === 'user') return; // message already displays

                    const newMessage: MessageData = { id, role, content, created_at };
                    geo_analysis_id && setGeoAnalysisId(geo_analysis_id);
                    addMessage(newMessage);
                }
            )
            .subscribe();

        retrieveChatMessages();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentQuery?.id, retrieveChatMessages, addMessage]);

    return {
        isOpen,
        isVisible,
        toggleChat,
        closeChat
    };
};
