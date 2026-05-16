import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { MessageAPI } from '@/api/message.api';
import { ChatAPI } from '@/api/chat.api';

export const useChatInputController = (chat_id?: string) => {
    const isLoading = useMessageStore((state) => state.isLoading);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);
    const addMessage = useMessageStore((state) => state.addMessage);

    const addQuery = useChatStore((state) => state.addQuery);
    const setCurrentQuery = useChatStore((state) => state.setCurrentQuery);

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
        if (!inputValue.trim() || !chat_id) return;
        setIsSending(true);

        try {
            // if (!chat_id) {
            //     const newQuery = await ChatAPI.create();
                
            //     if (newQuery && newQuery.chat) {                    
            //         addQuery(newQuery.chat);
            //         setCurrentQuery(newQuery.chat);
            //     }
            // }

            const newMessage = await MessageAPI.send(chat_id, inputValue);
            if (newMessage && newMessage?.message) {
                addMessage(newMessage.message);
                setIsThinking(true);
                setInputValue('');
            }
        } catch (err: any) {
            console.error("Failed to send message:", err.message);
            showAlert(false, "Failed to send message. Try again later!");
        } finally {
            setIsSending(false);
        }
    }, [chat_id, inputValue, addMessage, setIsThinking, showAlert]);

    return {
        textareaRef,
        inputValue,
        setInputValue,
        isSending,
        isLoading,
        handleSendMessage
    };
};
