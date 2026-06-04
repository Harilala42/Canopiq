import { renderHook, act, waitFor } from '@testing-library/react';
import { useSideBarController } from './useSideBarController';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

jest.mock('@/api/chat.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/stores/useAnalyticsStore');
jest.mock('@/stores/useMapStore');
jest.mock('@/utils/supabase.utils');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useSideBarController', () => {
  // Mock data
  const mockChat1: ChatData = { 
    id: '1', 
    title: 'Query 1', 
    created_at: '2026-01-01T10:00:00Z', 
    is_pinned: false
  };

  const mockChat2: ChatData = { 
    id: '2', 
    title: 'Query 2', 
    created_at: '2026-01-02T10:00:00Z', 
    is_pinned: false
  };

  const mockChat3: ChatData = { 
    id: '3', 
    title: 'Pinned Query', 
    created_at: '2026-01-03T10:00:00Z', 
    is_pinned: true
  };

  const mockChat4: ChatData = { 
    id: '4', 
    title: 'Recent Unpinned', 
    created_at: '2026-01-04T10:00:00Z', 
    is_pinned: false
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useChatStore.setState({
      queries: [],
      currentQuery: null,
      isOpen: false,
    });
  });

  // ========== SORTEDCHATS TESTS ==========
  describe('sortedChats', () => {
    it('should sort chats with pinned first, then by newest date', () => {
      useChatStore.setState({
        queries: [mockChat1, mockChat2, mockChat3, mockChat4],
      });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      expect(result.current.sortedChats).toHaveLength(4);
      expect(result.current.sortedChats[0].id).toBe('3'); // Pinned
      expect(result.current.sortedChats[1].id).toBe('4'); // Unpinned newest
      expect(result.current.sortedChats[2].id).toBe('2');
      expect(result.current.sortedChats[3].id).toBe('1');
    });

    it('should handle multiple pinned chats sorted by date', () => {
      const pinnedChat1: ChatData = { ...mockChat1, is_pinned: true, created_at: '2026-01-01T10:00:00Z' };
      const pinnedChat2: ChatData = { ...mockChat2, is_pinned: true, created_at: '2026-01-02T10:00:00Z' };
      const unpinnedChat: ChatData = { ...mockChat3, is_pinned: false, created_at: '2026-01-03T10:00:00Z' };

      useChatStore.setState({ queries: [pinnedChat1, pinnedChat2, unpinnedChat] });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      expect(result.current.sortedChats[0].id).toBe('2'); // Newest Pinned
      expect(result.current.sortedChats[1].id).toBe('1'); // Older Pinned
      expect(result.current.sortedChats[2].id).toBe('3'); // Unpinned
    });

    it('should handle empty queries array gracefully', () => {
      useChatStore.setState({ queries: [] });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });
      expect(result.current.sortedChats).toHaveLength(0);
    });
  });

  // ========== FETCHQUERIES TESTS ==========
  describe('fetchQueries', () => {
    it('should fetch and set queries successfully', async () => {
      (ChatAPI.getAll as jest.Mock).mockResolvedValue({ chats: [mockChat1, mockChat2] });

      renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      // Get store actions from your mock definitions cleanly
      const storeActions = useChatStore.getState();

      await waitFor(() => {
        expect(storeActions.setQueries).toHaveBeenCalledWith([mockChat1, mockChat2]);
      });
    });

    it('should handle API errors gracefully using alert context notifications', async () => {
      (ChatAPI.getAll as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to load your queries. Please try again later.');
      });
    });
  });

  // ========== CREATENEWQUERY TESTS ==========
  describe('createNewQuery', () => {
    it('should create a new query instance and correctly sync open views', async () => {
      (ChatAPI.create as jest.Mock).mockResolvedValue({ chat: mockChat1 });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      await act(async () => {
        await result.current.createNewQuery();
      });

      const storeActions = useChatStore.getState();
      expect(storeActions.openChat).toHaveBeenCalled();
      expect(storeActions.addQuery).toHaveBeenCalledWith(mockChat1);
      expect(storeActions.setCurrentQuery).toHaveBeenCalledWith(mockChat1);
    });

    it('should bypass calling openChat if store flag specifies it is open already', async () => {
      useChatStore.setState({ isOpen: true }); // Mock state pre-condition
      (ChatAPI.create as jest.Mock).mockResolvedValue({ chat: mockChat1 });

      const { result } = renderHook(() => useSideBarController(), { wrapper: AlertProvider });

      await act(async () => {
        await result.current.createNewQuery();
      });

      const storeActions = useChatStore.getState();
      expect(storeActions.openChat).not.toHaveBeenCalled();
    });
  });
});