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

    const currentQuery = useChatStore((state) => state.currentQuery);
    const setCurrentJobId = useChatStore((state) => state.setCurrentJobId);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    useEffect(() => {
        if (!currentQuery?.id) return;

        const channel = supabase
            .channel(`job-status-${currentQuery.id}`)
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'jobs', 
                    filter: `chat_id=eq.${currentQuery.id}` 
                },
                (payload) => {
                    const { status, error_message, celery_task_id } = payload.new;
                    setCurrentJobId(celery_task_id);
                    setCurrentStatus(status);
                    
                    if (status === 'failed') {
                        setErrorMessage(error_message);
                        setCurrentJobId(null);
                        setIsThinking(false); 
                    } else if (status === 'completed') {
                        setIsThinking(false);
                        setCurrentJobId(null);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Job Channel status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [
        currentQuery?.id, 
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
