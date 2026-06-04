import useMapStore from '@/stores/useMapStore';
import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { supabase } from "@/utils/supabase.utils";
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

export const useSideBarController = () => {
    const queries = useChatStore((state) => state.queries);
    const currentQuery = useChatStore((state) => state.currentQuery);
    const setCurrentQuery = useChatStore((state) => state.setCurrentQuery);

    const setQueries = useChatStore((state) => state.setQueries);
    const updateQuery = useChatStore((state) => state.updateQuery);
    const addQuery = useChatStore((state) => state.addQuery);
    
    const isOpen = useChatStore((state) => state.isOpen);
    const openChat = useChatStore((state) => state.openChat);

    const resetAnalyticsData = useAnalyticsStore((state) => state.resetAnalyticsData);
    const resetMessages = useMessageStore((state) => state.resetMessages);
    const clearMap = useMapStore((state) => state.clearMap);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isCanceleded, setIsCanceleded] = useState<boolean>(false);
    const { showAlert } = useContext(AlertContext);

    const sortedChats = useMemo(() => {
        return [...queries].sort((a, b) => {
            const timeA = Date.parse(a.created_at) || 0;
            const timeB = Date.parse(b.created_at) || 0;
            return Number(b.is_pinned) - Number(a.is_pinned) || timeB - timeA;
        });
    }, [queries]);

    const handleSelectQuery = useCallback(async (query: ChatData) => {
        resetAnalyticsData();
        resetMessages();
        clearMap();

        setCurrentQuery(query);
    }, [setCurrentQuery, resetAnalyticsData, resetMessages]);

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
                !isOpen && openChat();
                addQuery(newQuery.chat);
                handleSelectQuery(newQuery.chat);
                showAlert(true, "New query created successfully.");
            }
        } catch (err: any) {
            console.error("Failed to create new query:", err.message);
            showAlert(false, "Failed to create a new query. Please try again later.");
        } finally {
            setIsCreating(false);
        }
    }, [addQuery, isOpen, openChat, showAlert, handleSelectQuery]);

    useEffect(() => {
        fetchQueries();
    }, [fetchQueries]);

    useEffect(() => {
        if (!currentQuery?.id) return;

        const channel = supabase
            .channel('chats-channel')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chats',
                    filter: `id=eq.${currentQuery.id}`
                },
                (payload) => {
                    const { id, title } = payload.new;
                    updateQuery(id, { title });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentQuery?.id, updateQuery]);

    return {
        queries,
        sortedChats,
        isLoading,
        isCreating,
        isCanceleded,
        setIsCanceleded,
        createNewQuery,
        handleSelectQuery
    };
};

