import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { useEffect, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { supabase } from '@/utils/supabase.utils';
import { MessageAPI } from '@/api/message.api';
import { MessageData } from '@/types/chat';

export const useChatController = () => {
    const isOpen = useChatStore((state) => state.isOpen);
    const isVisible = useChatStore((state) => state.isVisible);
    const currentQuery = useChatStore((state) => state.currentQuery);
    
    const setMessages = useMessageStore((state) => state.setMessages);
    const setIsLoading = useMessageStore((state) => state.setIsLoading);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);
    const addMessage = useMessageStore((state) => state.addMessage);
    
    const toggleChat = useChatStore((state) => state.toggleChat);
    const closeChat = useChatStore((state) => state.closeChat);
    const { showAlert } = useContext(AlertContext);

    const retrieveChatMessages = useCallback(async () => {
        if (!currentQuery?.id) return;
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
                    const { id, role, content, created_at } = payload.new;
                    const newMessage: MessageData = { id, role, content, created_at };

                    if (role === 'model') setIsThinking(false);
                    addMessage(newMessage);
                }
            )
            .subscribe();

        retrieveChatMessages();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentQuery?.id, retrieveChatMessages, addMessage, setIsThinking]);

    return {
        isOpen,
        isVisible,
        toggleChat,
        closeChat
    };
};
