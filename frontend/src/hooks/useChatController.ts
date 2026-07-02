import useMapStore from '@/stores/useMapStore';
import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { useEffect, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { supabase } from '@/utils/supabase.utils';
import { AnalysisAPI } from '@/api/analysis.api';
import { MessageAPI } from '@/api/message.api';
import { GeoAnalysis } from '@/types/analysis';
import { MessageData } from '@/types/chat';

export const useChatController = () => {
    const currentQuery = useChatStore((state) => state.currentQuery);
    
    const setMessages = useMessageStore((state) => state.setMessages);
    const setIsLoading = useMessageStore((state) => state.setIsLoading);

    const addMessage = useMessageStore((state) => state.addMessage);
    const removeMessage = useMessageStore((state) => state.removeMessage);

    const addAnalysis = useAnalyticsStore((state) => state.addAnalysis);
    const setAnalyses = useAnalyticsStore((state) => state.setAnalyses);
	const resetAnalyses = useAnalyticsStore((state) => state.resetAnalyses);
    const setActiveAnalysis = useAnalyticsStore((state) => state.setActiveAnalysis);

    const setActiveMap = useMapStore((state) => state.setActiveMap);
    const clearMap = useMapStore((state) => state.clearMap);

    const { showAlert } = useContext(AlertContext);

    const retrieveChatMessages = useCallback(async () => {
        if (!currentQuery?.id || currentQuery?.isNew) return;

        setMessages([]);
        setIsLoading(true);

        try {
            const messageList = await MessageAPI.getAll(currentQuery.id);
            if (messageList && messageList?.messages)
                setMessages(messageList.messages as MessageData[]);
        } catch (err: any) {
            console.error("Failed to load chat messages:", err.message);
            showAlert(false, "Failed to load chat messages. Try again later!");
        } finally {
            setIsLoading(false);
        }
    }, [currentQuery?.id, setMessages, setIsLoading, showAlert]);

    const fetchGeoAnalysisData = useCallback(async () => {
        if (!currentQuery?.id || currentQuery?.isNew) return;

        resetAnalyses();
        clearMap();

        try {
            const result = await AnalysisAPI.getAll(currentQuery.id);
            if (result && result?.geo_analysis) {
                const oldAnalyses: GeoAnalysis[] = result.geo_analysis;

                setAnalyses(oldAnalyses);
                if (oldAnalyses.length > 0) {
                    setActiveAnalysis(oldAnalyses[0]);
                    setActiveMap(oldAnalyses[0].h3_grid_map_id);
                }
            }
        } catch (err: any) {
            console.error("Failed to retrieve insight:", err.message);
            showAlert(false, "Failed to retrieve insight. Please try again later.");
        }
    }, [
        currentQuery?.id,
        resetAnalyses,
        addAnalysis,
        clearMap,
        showAlert
    ]);

    useEffect(() => {
        if (!currentQuery?.id) return;

        const messageChannel = supabase
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
                    const newMessage: MessageData = payload.new;
                    if (newMessage.role === 'user') 
                        removeMessage(`temp-${newMessage.id}`);    // replace temporary message
                    addMessage(newMessage);
                }
            )
            .subscribe();

        const geoanalysisChannel = supabase
            .channel(`geo_analysis-${currentQuery.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "geo_analysis",
                    filter: `chat_id=eq.${currentQuery.id}`,
                },
                (payload: any) => {
                    const newAnalysis: GeoAnalysis = payload.new;

                    addAnalysis(newAnalysis);
                    setActiveAnalysis(newAnalysis);
                    setActiveMap(newAnalysis.h3_grid_map_id);
                }
            )
            .subscribe();

        retrieveChatMessages();
        fetchGeoAnalysisData();

        return () => {
            supabase.removeChannel(messageChannel);
            supabase.removeChannel(geoanalysisChannel);
        };
    }, [
        currentQuery?.id, 
        retrieveChatMessages, 
        fetchGeoAnalysisData,
        addMessage,
        removeMessage,
        addAnalysis,
        setActiveAnalysis,
        setActiveMap,
        clearMap
    ]);

    return { title: currentQuery?.title || "New Chat" }
};
