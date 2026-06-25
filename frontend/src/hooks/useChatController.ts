import useMapStore from '@/stores/useMapStore';
import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { useEffect, useCallback, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { supabase } from '@/utils/supabase.utils';
import { AnalysisAPI } from '@/api/analysis.api';
import { MessageAPI } from '@/api/message.api';
import { MessageData } from '@/types/chat';

export const useChatController = () => {
    const currentQuery = useChatStore((state) => state.currentQuery);
    
    const setMessages = useMessageStore((state) => state.setMessages);
    const setIsLoading = useMessageStore((state) => state.setIsLoading);

    const addMessage = useMessageStore((state) => state.addMessage);
    const removeMessage = useMessageStore((state) => state.removeMessage);

    const setDataset = useAnalyticsStore((state) => state.setDataset);
    const setLandUse = useAnalyticsStore((state) => state.setLandUse);
    const setAnalyticsData = useAnalyticsStore((state) => state.setAnalyticsData);
	const resetAnalyticsData = useAnalyticsStore((state) => state.resetAnalyticsData);

    const clearMap = useMapStore((state) => state.clearMap);
    const setLocation = useMapStore((state) => state.setLocation);
	const setCoords = useMapStore((state) => state.setCoords);
	const setMapId = useMapStore((state) => state.setId);

    const { showAlert } = useContext(AlertContext);

    const retrieveChatMessages = useCallback(async () => {
        if (!currentQuery?.id || currentQuery?.isNew) return;

        setMessages([]);
        setIsLoading(true);

        try {
            const messageList = await MessageAPI.getAll(currentQuery.id);
            if (messageList && messageList?.messages)
                setMessages(messageList.messages);
        } catch (err: any) {
            console.error("Failed to load chat messages:", err.message);
            showAlert(false, "Failed to load chat messages. Try again later!");
        } finally {
            setIsLoading(false);
        }
    }, [currentQuery?.id, setMessages, setIsLoading, showAlert]);

    const applyAnalysisData = useCallback((data: any) => {
		const {
			id,
			location,
			coordinates,
			start_year,
			end_year,
			analytics,
			h3_grid_map_id
		} = data;

		setLocation(location);

        setCoords([
            coordinates.coordinates[1],
            coordinates.coordinates[0],
        ]);

        setMapId(h3_grid_map_id);

        setDataset(analytics.insights),

        setLandUse(analytics.land_use_distribution),

        setAnalyticsData({
            geo_analysis_id: id,
            range_times: {
                start: new Date(start_year).getFullYear(),
                end: new Date(end_year).getFullYear(),
            },
            area_coverage: analytics.stats.area_coverage_ha,
            global_average: analytics.stats.global_average,
            total_change: analytics.stats.total_change_percent
        });
	}, [
		setLocation,
		setCoords,
        setMapId,
		setAnalyticsData
	]);

    const fetchGeoAnalysisData = useCallback(async () => {
        if (!currentQuery?.id || currentQuery?.isNew) return;

        try {
            const oldAnalysis = await AnalysisAPI.getAll(currentQuery.id);
            if (!oldAnalysis?.geo_analysis || oldAnalysis.geo_analysis.length === 0) {
                resetAnalyticsData();
                return;
            }

            clearMap();
            applyAnalysisData(oldAnalysis.geo_analysis[0]);
        } catch (err: any) {
            resetAnalyticsData();
            console.error("Failed to retrieve insight:", err.message);
            showAlert(false, "Failed to retrieve insight. Please try again later.");
        }
    }, [
        currentQuery?.id,
        resetAnalyticsData,
        applyAnalysisData,
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
                    const { id, role, content, created_at } = payload.new;
                    if (role === 'user') removeMessage(`temp-${id}`);    // replace temporary message

                    const newMessage: MessageData = { id, role, content, created_at };
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
					clearMap();
                    applyAnalysisData(payload.new);
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
        applyAnalysisData,
        addMessage, clearMap
    ]);

    return { title: currentQuery?.title || "New Chat" }
};
