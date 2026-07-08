import useChatStore from "@/stores/useChatStore";
import useMessageStore from "@/stores/useMessageStore";
import { useEffect, useCallback, useRef, useContext } from "react";
import { AlertContext } from "@/contexts/alertContext";
import { supabase } from "@/utils/supabase.utils";
import { JobData, JobStatus } from "@/types/job";
import { JobAPI } from "@/api/job.api";

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
    const { showAlert } = useContext(AlertContext);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    const finalizeJobState = useCallback((status: JobStatus, err: string = null) => {
        setIsThinking(false);
        setCurrentJobId(null);
        setCurrentStatus(status);
        err && setErrorMessage(err);
    }, [
        setCurrentStatus, 
        setCurrentJobId,
        setIsThinking, 
        setErrorMessage
    ]);

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef<number>(0);
    const MAX_POLL_RETRIES: number = 3;

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    // FallBack polling in case of unexpected websocket disconnection 
    const startPolling = useCallback(() => {
        if (pollIntervalRef.current) return;
        pollIntervalRef.current = setInterval(async () => {
            try {
                const result = await JobAPI.getJob(currentJobId);
                if (result?.job) {
                    const { status, err_message } = result.job as JobData;
                    setCurrentStatus(status);
                    if (status === 'failed' || status === 'completed') {
                        finalizeJobState(status, err_message);
                    }
                }

                reconnectAttempts.current = 0;
            } catch (err: any) {
                reconnectAttempts.current += 1;
                if (reconnectAttempts.current >= MAX_POLL_RETRIES) {
                    stopPolling();
                    finalizeJobState('failed', 'Connection lost. Unable to reach the server.');
                }
            }
        }, 5000);       // polling scheduled every 5s
    }, [currentJobId, setCurrentStatus, finalizeJobState, stopPolling]);

    useEffect(() => {
        if (!currentJobId) return;

        const jobChannel = supabase
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
                    // Sync local state with real-time database changes
                    const { status, err_message } = payload.new;
                    setCurrentStatus(status);
                    if (status === 'failed' || status === 'completed') {
                        finalizeJobState(status, err_message);
                    }
                }
            )
            .subscribe(async (status, err) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    startPolling();     // keep checking until it either resolves or reconnects
                } else if (status === 'SUBSCRIBED') {
                    stopPolling();      // realtime is back, no need to poll anymore
                }
            });

        return () => {
            supabase.removeChannel(jobChannel);
            stopPolling();
        };
    }, [
        currentJobId, 
        setCurrentStatus, 
        setErrorMessage, 
        setIsThinking,
        finalizeJobState,
        startPolling,
        stopPolling,
        showAlert
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
