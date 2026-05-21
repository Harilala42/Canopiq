import useChatStore from '@/stores/useChatStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

export const useSideBarController = () => {
    const queries = useChatStore((state) => state.queries);
    const addQuery = useChatStore((state) => state.addQuery);
    const setQueries = useChatStore((state) => state.setQueries);
    const setCurrentQuery = useChatStore((state) => state.setCurrentQuery);
    const openChart = useAnalyticsStore((state) => state.openChart);
    const openChat = useChatStore((state) => state.openChat);

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
        openChart();
        openChat();
    }, [setCurrentQuery, openChart, openChat]);

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

