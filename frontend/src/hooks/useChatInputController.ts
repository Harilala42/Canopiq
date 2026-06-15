import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { MessageAPI } from '@/api/message.api';
import { ChatAPI } from '@/api/chat.api';
import { JobAPI } from "@/api/job.api";

export const useChatInputController = () => {
    const isLoading = useMessageStore((state) => state.isLoading);
    const isThinking = useMessageStore((state) => state.isThinking);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);

    const addQuery = useChatStore((state) => state.addQuery);
    const currentQuery = useChatStore((state) => state.currentQuery);
    const currentJobId = useChatStore((state) => state.currentJobId);
    const setCurrentQuery = useChatStore((state) => state.setCurrentQuery);
    const setCurrentJobId = useChatStore((state) => state.setCurrentJobId);
    const setCurrentStatus = useMessageStore((state) => state.setCurrentStatus);
    const setErrorMessage = useMessageStore((state) => state.setErrorMessage);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isCanceling, setIsCanceling] = useState<boolean>(false);
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
            if (newMessage?.job_id) {
                setCurrentStatus("queued");
                setCurrentJobId(newMessage.job_id);
                setIsThinking(true);
            } 

            setErrorMessage(null);
            setInputValue('');
        } catch (err: any) {
            console.error("Failed to send message:", err.message);
            showAlert(false, "Failed to send message. Try again later!");
        } finally {
            setIsSending(false);
        }
    }, [
        currentQuery, 
        inputValue, 
        setCurrentStatus,
        setCurrentJobId,
        setIsThinking, 
        showAlert
    ]);

    const handleCancelAnalysis = useCallback(async () => {
        if (!currentQuery?.id || !currentJobId) return;

        setIsCanceling(true);
        try {
            await JobAPI.cancelJob(currentJobId);

            setIsThinking(false);
            setCurrentJobId(null);
            setCurrentStatus(null);

            showAlert(true, "Successfully cancelled analysis");
        } catch (err) {
            console.error("Canceling GIS analysis failed:", err);
            showAlert(false, "Failed to cancel GIS analysis");
        } finally {
            setIsCanceling(false);
        }
    }, [
        currentQuery, 
        currentJobId, 
        setIsThinking, 
        setCurrentJobId, 
        setCurrentStatus, 
        showAlert
    ]);

    return {
        textareaRef,
        inputValue,
        setInputValue,
        isSending,
        isLoading,
        isThinking,
        isCanceling,
        handleSendMessage,
        handleCancelAnalysis
    };
};
