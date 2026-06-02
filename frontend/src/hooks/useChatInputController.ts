import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { MessageAPI } from '@/api/message.api';
import { ChatAPI } from '@/api/chat.api';

export const useChatInputController = () => {
    const isLoading = useMessageStore((state) => state.isLoading);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);
    const addMessage = useMessageStore((state) => state.addMessage);

    const addQuery = useChatStore((state) => state.addQuery);
    const currentQuery = useChatStore((state) => state.currentQuery);
    const setCurrentQuery = useChatStore((state) => state.setCurrentQuery);
    const setCurrentStatus = useMessageStore((state) => state.setCurrentStatus);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const { showAlert } = useContext(AlertContext);

    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [inputValue]);

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim()) return;
        setIsSending(true);

        try {
            let query = currentQuery;
            if (!query) {
                const newQuery = await ChatAPI.create();
                
                if (newQuery && newQuery.chat) {                    
                    addQuery(newQuery.chat);
                    setCurrentQuery(newQuery.chat);
                    query = newQuery.chat;
                } else
                    throw new Error("Query creation failed");
            }

            const newMessage = await MessageAPI.send(query.id, inputValue);
            if (newMessage && newMessage?.message) {
                addMessage(newMessage.message);
                setCurrentStatus("queued");
                setIsThinking(true);
                setInputValue('');
            }
        } catch (err: any) {
            console.error("Failed to send message:", err.message);
            showAlert(false, "Failed to send message. Try again later!");
        } finally {
            setIsSending(false);
        }
    }, [currentQuery, inputValue, addMessage, setIsThinking, showAlert]);

    return {
        textareaRef,
        inputValue,
        setInputValue,
        isSending,
        isLoading,
        handleSendMessage
    };
};
