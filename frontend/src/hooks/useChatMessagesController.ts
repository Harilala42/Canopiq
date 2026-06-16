import useChatStore from "@/stores/useChatStore";
import useMessageStore from "@/stores/useMessageStore";
import { supabase } from "@/utils/supabase.utils";
import { useEffect, useRef } from "react";

export const useChatMessagesController = () => {
    const messages = useMessageStore((state) => state.messages);
    const isLoading = useMessageStore((state) => state.isLoading);
    const isThinking = useMessageStore((state) => state.isThinking);
    const currentStatus = useMessageStore((state) => state.currentStatus);
    const errMessage = useMessageStore((state) => state.errorMessage);

    const setCurrentStatus = useMessageStore((state) => state.setCurrentStatus);
    const setErrorMessage = useMessageStore((state) => state.setErrorMessage);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);

    const currentJobId = useChatStore((state) => state.currentJobId);
    const setCurrentJobId = useChatStore((state) => state.setCurrentJobId);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    useEffect(() => {
        if (!currentJobId) return;

        const channel = supabase
            .channel(`job-status-${currentJobId}`)
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'jobs', 
                    filter: `id=eq.${currentJobId}` 
                },
                (payload) => {
                    const { status, err_message } = payload.new;
                    setCurrentStatus(status);
                    
                    if (status === 'failed') {
                        setCurrentJobId(null);
                        setErrorMessage(err_message);
                        isThinking && setIsThinking(false); 
                    } else if (status === 'completed') {
                        setCurrentJobId(null);
                        isThinking && setIsThinking(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [
        currentJobId, 
        setCurrentStatus, 
        setErrorMessage, 
        setIsThinking
    ]);

    return {
        messages,
        isLoading,
        isThinking,
        currentStatus,
        errMessage,
        messagesEndRef
    };
};
