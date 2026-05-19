import useChatStore from '@/stores/useChatStore';
import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { BiomeData, DatasetMetaData, LandCoverData } from '@/types/analysis';
import { AlertContext } from '@/contexts/alertContext';
import { AnalysisAPI } from '@/api/analysis.api';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';
import { MapData } from '@/types/map';
import useAnalyticsStore from '@/stores/useAnalyticsStore';

export const useSideBarController = () => {
    const queries = useChatStore((state) => state.queries);
    const addQuery = useChatStore((state) => state.addQuery);
    const setQueries = useChatStore((state) => state.setQueries);
    const setCurrentQuery = useChatStore((state) => state.setCurrentQuery);
    const openChat = useChatStore((state) => state.openChat);

    const setAnalyticsData = useAnalyticsStore((state) => state.setAnalyticsData);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    
    const { showAlert } = useContext(AlertContext);

    const sortedChats = useMemo(() => {
        return [...queries].sort((a, b) => {
            const timeA = Date.parse(a.created_at) || 0;
            const timeB = Date.parse(b.created_at) || 0;
            return Number(b.is_pinned) - Number(a.is_pinned) || timeB - timeA;
        });
    }, [queries]);

    const fetchQueries = useCallback(async () => {
        setIsLoading(true);
        try {
            const myQueries = await ChatAPI.getAll();
            if (myQueries && myQueries.chats) {
                setQueries(myQueries.chats);
            }
        } catch (err: any) {
            console.error("Failed to fetch queries:", err.message);
            showAlert(false, "Failed to load your queries. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [setQueries, showAlert]);

    const createNewQuery = useCallback(async () => {
        setIsCreating(true);
        try {
            const newQuery = await ChatAPI.create();
            if (newQuery && newQuery.chat) {
                addQuery(newQuery.chat);
                showAlert(true, "New query created successfully.");
            }
        } catch (err: any) {
            console.error("Failed to create new query:", err.message);
            showAlert(false, "Failed to create a new query. Please try again later.");
        } finally {
            setIsCreating(false);
        }
    }, [addQuery, showAlert]);

    const handleSelectQuery = useCallback(async (query: ChatData) => {
        setCurrentQuery(query);
        openChat();

        try {
            const oldAnalysis = await AnalysisAPI.getAll(query.id);
            if (!oldAnalysis?.data || !oldAnalysis.data.length) return;

            const {
                location,
                dataset,
                tile_layer_url,
                center_point,
                start_year,
                end_year,
                analytics,
            } = oldAnalysis.data[0];

            const newMap: MapData = {
                description: location,
                tileLayer: tile_layer_url,
                coords: [
                    center_point.coordinates[1],
                    center_point.coordinates[0],
                ],
            };

            const newDataset: DatasetMetaData = {
                type: dataset,
                legend: analytics.insights.metadata.legend,
                description: analytics.insights.metadata.description,
                source: analytics.insights.metadata.source,
                unit: analytics.insights.metadata.unit,
            };

            const newLandCover: LandCoverData = {
                legend: analytics.land_cover.metadata.legend,
                description: analytics.land_cover.metadata.description,
                categories: Object.entries(
                    analytics.land_cover.distribution
                ).map(([category, value]: any) => ({
                    category,
                    color: value.color,
                    percent: value.percent,
                })) as BiomeData[],
                source: analytics.land_cover.metadata.source,
                unit: analytics.land_cover.metadata.unit,
            };

            setAnalyticsData({
                location: newMap,
                dataset: newDataset,
                range_times: {
                    start: new Date(start_year).getFullYear(),
                    end: new Date(end_year).getFullYear(),
                },
                area_coverage: analytics.stats.area_coverage_ha,
                global_average: analytics.stats.global_average,
                total_change: analytics.stats.total_change_percent,
                dataset_time_series: analytics.insights.time_series,
                land_cover: newLandCover,
            });
        } catch(err: any) {
            console.error("Failed to load map:", err.message);
            showAlert(false, "Failed to load map. Please try again later.");
        }
    }, [setCurrentQuery, setAnalyticsData, openChat]);

    useEffect(() => {
        fetchQueries();
    }, [fetchQueries]);

    return {
        queries,
        sortedChats,
        isLoading,
        isCreating,
        isHovered,
        setIsHovered,
        createNewQuery,
        handleSelectQuery
    };
};

