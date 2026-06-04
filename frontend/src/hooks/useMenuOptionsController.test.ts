import { renderHook, act } from '@testing-library/react';
import { useMenuOptionsController } from './useMenuOptionsController';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

jest.mock('@/api/chat.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useMenuOptionsController', () => {
  const mockQuery: ChatData = {
    id: 'chat-456',
    title: 'Analytics Query',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false, // Starts unpinned
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useChatStore.setState({ queries: [] });
  });

  // ========== INITIAL STATE TESTS ==========
  it('should initialize with the correct state configuration', () => {
    const { result } = renderHook(() => useMenuOptionsController(mockQuery), {
      wrapper: AlertProvider,
    });

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.isPinned).toBe(false);
    expect(result.current.isUpdating).toBe(false);
  });

  // ========== DELETEQUERY TESTS ==========
  describe('deleteQuery', () => {
    it('should delete a query successfully, update the store, and show a success alert', async () => {
      (ChatAPI.delete as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMenuOptionsController(mockQuery), {
        wrapper: AlertProvider,
      });

      await act(async () => {
        await result.current.deleteQuery();
      });

      // 1. Verify API boundary execution
      expect(ChatAPI.delete).toHaveBeenCalledWith('chat-456');

      // 2. Verify store synchronization
      const storeActions = useChatStore.getState();
      expect(storeActions.deleteQuery).toHaveBeenCalledWith('chat-456');

      // 3. Verify success context alert
      expect(mockShowAlert).toHaveBeenCalledWith(true, 'Query deleted successfully.');
    });

    it('should catch deletion API exceptions gracefully and present an error notification', async () => {
      (ChatAPI.delete as jest.Mock).mockRejectedValue(new Error('Unauthorized request'));

      const { result } = renderHook(() => useMenuOptionsController(mockQuery), {
        wrapper: AlertProvider,
      });

      await act(async () => {
        await result.current.deleteQuery();
      });

      // Store delete operation shouldn't be executed on error
      const storeActions = useChatStore.getState();
      expect(storeActions.deleteQuery).not.toHaveBeenCalled();

      // Error banner validation
      expect(mockShowAlert).toHaveBeenCalledWith(
        false,
        'Failed to delete the query. Please try again later.'
      );
    });
  });

  // ========== TOGGLEPIN TESTS ==========
  describe('togglePin', () => {
    it('should optimistically pin a query, execute the API call, and synchronize with the store', async () => {
      (ChatAPI.togglePin as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useMenuOptionsController(mockQuery), {
        wrapper: AlertProvider,
      });

      // Trigger the optimistic state switch async operation
      await act(async () => {
        await result.current.togglePin();
      });

      // 1. Hook state should now match the toggled state (false -> true)
      expect(result.current.isPinned).toBe(true);

      // 2. API should be queried with target value
      expect(ChatAPI.togglePin).toHaveBeenCalledWith('chat-456', true);

      // 3. Main global state store should align
      const storeActions = useChatStore.getState();
      expect(storeActions.updateQuery).toHaveBeenCalledWith('chat-456', { is_pinned: true });
    });

    it('should optimistically update state but roll it back cleanly if the API fails', async () => {
      // Mock the network layer to reject the operation
      (ChatAPI.togglePin as jest.Mock).mockRejectedValue(new Error('Network loss'));

      const { result } = renderHook(() => useMenuOptionsController(mockQuery), {
        wrapper: AlertProvider,
      });

      await act(async () => {
        await result.current.togglePin();
      });

      // 1. Because the API failed, state must fall back to original baseline (false)
      expect(result.current.isPinned).toBe(false);

      // 2. Main store update should NOT have executed successfully
      const storeActions = useChatStore.getState();
      expect(storeActions.updateQuery).not.toHaveBeenCalled();

      // 3. Error announcement must be dispatched to alert user
      expect(mockShowAlert).toHaveBeenCalledWith(
        false,
        'Failed to toggle the query pin. Please try again later.'
      );
    });
  });
});
