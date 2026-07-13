import { renderHook, act, waitFor } from '@testing-library/react';
import { useSideBarController } from './useSideBarController';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

import useMapStore from '@/stores/useMapStore';
import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { supabase, mockChannels } from '@/utils/__mocks__/supabase.utils';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

// Mock explicit external endpoints and modules
jest.mock('@/api/chat.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/stores/useAnalyticsStore');
jest.mock('@/stores/useMapStore');
jest.mock('@/utils/supabase.utils');
jest.mock('@/utils/supabase.utils', () => {
  return require('@/utils/__mocks__/supabase.utils');
});
jest.mock('@/contexts/alertContext', () => {
  return require('@/contexts/__mocks__/alertContext');
});

describe('useSideBarController', () => {
  const mockChat1: ChatData = { id: '1', title: 'Query 1', created_at: '2026-01-01T10:00:00Z', is_pinned: false };
  const mockChat2: ChatData = { id: '2', title: 'Query 2', created_at: '2026-01-02T10:00:00Z', is_pinned: false };
  const mockChat3: ChatData = { id: '3', title: 'Pinned Query', created_at: '2026-01-03T10:00:00Z', is_pinned: true };
  const mockChat4: ChatData = { id: '4', title: 'Recent Unpinned', created_at: '2026-01-04T10:00:00Z', is_pinned: false };

  beforeEach(() => {
    jest.clearAllMocks();

    for (const key in mockChannels) {
      delete mockChannels[key];
    }

    // Reset store hooks to base pristine values
    useChatStore.setState({
      queries: [],
      currentQuery: null,
      isOpen: false,
      setQueries: jest.fn(),
      addQuery: jest.fn(),
      updateQuery: jest.fn(),
      setCurrentQuery: jest.fn(),
    });

    useMessageStore.setState({ resetMessages: jest.fn() });
    useAnalyticsStore.setState({ resetAnalyses: jest.fn() });
    useMapStore.setState({ clearMap: jest.fn() });
  });

  // ========== SORTED CHATS TESTS ==========
  describe('sortedChats sorting logic', () => {
    it('should sort chats with pinned first, then descending by newest date', () => {
      useChatStore.setState({ queries: [mockChat1, mockChat2, mockChat3, mockChat4] });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      expect(result.current.sortedChats).toHaveLength(4);
      expect(result.current.sortedChats[0].id).toBe('3'); // Pinned
      expect(result.current.sortedChats[1].id).toBe('4'); // Unpinned newest
      expect(result.current.sortedChats[2].id).toBe('2');
      expect(result.current.sortedChats[3].id).toBe('1');
    });

    it('should fall back onto safe parsing structures if date parameters are malformed or missing strings', () => {
      const brokenChat1: ChatData = { ...mockChat1, created_at: 'not-a-date' };
      const brokenChat2: ChatData = { ...mockChat2, created_at: '2026-01-05T00:00:00Z' };

      useChatStore.setState({ queries: [brokenChat1, brokenChat2] });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });
      expect(result.current.sortedChats[0].id).toBe('2'); // Valid Date evaluated higher than 0
    });
  });

  // ========== HANDLE SELECTQUERY TESTS ==========
  describe('handleSelectQuery transition lifecycle', () => {
    it('should instantly step out and do nothing if matching query is already active', async () => {
      useChatStore.setState({ currentQuery: mockChat1 });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      await act(async () => {
        await result.current.handleSelectQuery(mockChat1);
      });

      expect(useMessageStore.getState().resetMessages).not.toHaveBeenCalled();
      expect(useChatStore.getState().setCurrentQuery).not.toHaveBeenCalled();
    });

    it('should flush cross-store dependencies completely before establishing new active query state', async () => {
      useChatStore.setState({ currentQuery: mockChat1 });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });
      const msgStore = useMessageStore.getState();
      const analyticsStore = useAnalyticsStore.getState();
      const mapStore = useMapStore.getState();
      const chatStore = useChatStore.getState();

      await act(async () => {
        await result.current.handleSelectQuery(mockChat2);
      });

      expect(msgStore.resetMessages).toHaveBeenCalled();
      expect(analyticsStore.resetAnalyses).toHaveBeenCalled();
      expect(mapStore.clearMap).toHaveBeenCalled();
      expect(chatStore.setCurrentQuery).toHaveBeenCalledWith(mockChat2);
    });
  });

  // ========== FETCH QUERIES TESTS ==========
  describe('fetchQueries execution rules', () => {
    it('should pull backend historical items and feed them to the state array accurately', async () => {
      (ChatAPI.getAll as jest.Mock).mockResolvedValue({ chats: [mockChat1, mockChat2] });

      renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      const chatStore = useChatStore.getState();
      await waitFor(() => {
        expect(ChatAPI.getAll).toHaveBeenCalled();
        expect(chatStore.setQueries).toHaveBeenCalledWith([mockChat1, mockChat2]);
      });
    });

    it('should push message layout errors up to the context handler array if api encounters issues', async () => {
      (ChatAPI.getAll as jest.Mock).mockRejectedValue(new Error('Internal Gateway Error'));

      renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to load your queries. Please try again later.');
      });
    });
  });

  // ========== CREATE NEWQUERY TESTS ==========
  describe('createNewQuery structural workflow', () => {
    it('should register a new query and trigger a confirmation toast notification on resolution success', async () => {
      (ChatAPI.create as jest.Mock).mockResolvedValue({ chat: mockChat1 });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });
      const chatStore = useChatStore.getState();

      await act(async () => {
        await result.current.createNewQuery();
      });

      expect(ChatAPI.create).toHaveBeenCalled();
      expect(chatStore.addQuery).toHaveBeenCalledWith(mockChat1);
      expect(chatStore.setCurrentQuery).toHaveBeenCalledWith(mockChat1);
      expect(mockShowAlert).toHaveBeenCalledWith(true, 'New query created successfully.');
    });

    it('should execute a fallback error layout banner if session initialization fails', async () => {
      (ChatAPI.create as jest.Mock).mockRejectedValue(new Error('DB Unique Constraint Failure'));

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      mockShowAlert.mockClear();

      await act(async () => {
        await result.current.createNewQuery();
      });

      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to create a new query. Please try again later.');
    });
  });

  // ========== REALTIME CHANNELS UPDATE TESTS ==========
  describe('Supabase Realtime Channel operations via useEffect', () => {
    it('should register a database listening channel only when a current query is selected', () => {
      useChatStore.setState({ currentQuery: null });
      renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      expect(supabase.channel).not.toHaveBeenCalled();
    });

    it('should set up listeners and handle title updates properly when real-time edits arrive', () => {
      useChatStore.setState({ currentQuery: mockChat1 });

      renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      expect(supabase.channel).toHaveBeenCalledWith('chats-channel');
      expect(mockChannels['chats-channel'].eventConfig).toEqual({
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${mockChat1.id}`,
      });

      // Extract and fire the callback mock function to mimic supabase database events
      act(() => {
        mockChannels['chats-channel'].onCallback({ new: { id: '1', title: 'Updated Query Title' } });
      });

      expect(useChatStore.getState().updateQuery).toHaveBeenCalledWith('1', { title: 'Updated Query Title' });
    });
  });
});
