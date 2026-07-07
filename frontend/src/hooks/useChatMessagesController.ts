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
        if (currentJobId) return;

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
            } catch (err) {
                console.error("Poll failed:", err);
            }
        }, 5000);       // polling scheduled every 5s
    }, [currentJobId, finalizeJobState]);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

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
                    const { status, err_message } = payload.new;
                    setCurrentStatus(status);
                    
                    if (status === 'failed' || status === 'completed') {
                        finalizeJobState(status, err_message);
                    }
                }
            )
            .subscribe(async (connectionStatus, err) => {
                if (connectionStatus === 'CHANNEL_ERROR' || connectionStatus === 'TIMED_OUT') {
                    startPolling();     // keep checking until it either resolves or reconnects
                } else if (connectionStatus === 'SUBSCRIBED') {
                    stopPolling();      // realtime is back, no need to poll anymore
                } else if (connectionStatus === 'CLOSED') {
                    stopPolling();
                    console.log("WebSocket disconneted...")
                    
                    try {
                        // 3. Double-check the job's actual server status before canceling
                        const result = await JobAPI.getJob(currentJobId);
                        const serverStatus = result?.job?.status;

                        // If it's already done or failed, just finalize local state
                        if (serverStatus === 'completed' || serverStatus === 'failed') {
                            finalizeJobState(serverStatus, result.job?.err_message);
                            return;
                        }

                        // 4. If it's STILL running but the socket permanently closed, kill it safely
                        await JobAPI.cancelJob(currentJobId);
                        showAlert(false, "Geo-analysis has been canceled due to connection loss.");
                        finalizeJobState("canceled");

                    } catch (err) {
                        console.error("Failed to safely resolve closed channel:", err);
                        // Fallback: If the network is entirely dead (API fails), finalize as canceled
                        finalizeJobState("canceled");
                    }
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
