import { renderHook, act } from '@testing-library/react';
import { useRenameQueryDialogController } from './useRenameQueryDialogController';
import { ChatAPI } from '@/api/chat.api';
import { ChatData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

jest.mock('@/api/chat.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useRenameQueryDialogController', () => {
  const mockQuery: ChatData = {
    id: 'chat-123',
    title: 'Original Title',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false,
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useChatStore.setState({ queries: [] });
  });

  // ========== INITIAL STATE TESTS ==========
  it('should initialize with the correct default states', () => {
    const { result } = renderHook(
      () => useRenameQueryDialogController(mockQuery, mockOnClose),
      { wrapper: AlertProvider }
    );

    expect(result.current.newTitle).toBe('Original Title');
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isSaveDisabled).toBe(true); // Disabled because title hasn't changed
  });

  it('should enable the save button when the title changes to a valid new string', () => {
    const { result } = renderHook(
      () => useRenameQueryDialogController(mockQuery, mockOnClose),
      { wrapper: AlertProvider }
    );

    act(() => {
      result.current.setNewTitle('Brand New Title');
    });

    expect(result.current.isSaveDisabled).toBe(false);
  });

  it('should disable the save button if the title is empty or whitespace', () => {
    const { result } = renderHook(
      () => useRenameQueryDialogController(mockQuery, mockOnClose),
      { wrapper: AlertProvider }
    );

    act(() => {
      result.current.setNewTitle('   ');
    });

    expect(result.current.isSaveDisabled).toBe(true);
  });

  // ========== RENAME QUERY TESTS ==========
  describe('renameQuery', () => {
    it('should successfully rename a query, update the store, show a success message, and close', async () => {
      (ChatAPI.rename as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(
        () => useRenameQueryDialogController(mockQuery, mockOnClose),
        { wrapper: AlertProvider }
      );

      // Change the title away from original state
      act(() => {
        result.current.setNewTitle('Updated Query Title');
      });

      // Fire off async rename operation
      await act(async () => {
        await result.current.renameQuery();
      });

      // 1. Check API was run with correct parameters
      expect(ChatAPI.rename).toHaveBeenCalledWith('chat-123', 'Updated Query Title');

      // 2. Check your Zustand store mock engine tracked the action dispatch
      const storeActions = useChatStore.getState();
      expect(storeActions.updateQuery).toHaveBeenCalledWith('chat-123', { title: 'Updated Query Title' });

      // 3. Check UI Context and side effects
      expect(mockShowAlert).toHaveBeenCalledWith(true, 'Query renamed successfully.');
      expect(mockOnClose).toHaveBeenCalled();
      expect(result.current.isSaving).toBe(false);
    });

    it('should handle API errors gracefully and display an error alert', async () => {
      (ChatAPI.rename as jest.Mock).mockRejectedValue(new Error('Database connectivity issue'));

      const { result } = renderHook(
        () => useRenameQueryDialogController(mockQuery, mockOnClose),
        { wrapper: AlertProvider }
      );

      act(() => {
        result.current.setNewTitle('Failed Title Attempt');
      });

      await act(async () => {
        await result.current.renameQuery();
      });

      // API fails, store shouldn't be altered, onClose shouldn't execute
      const storeActions = useChatStore.getState();
      expect(storeActions.updateQuery).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();

      // Error banner validation
      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to rename the query. Please try again later.');
      expect(result.current.isSaving).toBe(false);
    });

    it('should immediately bail out if rename is triggered with an unchanged title string', async () => {
      const { result } = renderHook(
        () => useRenameQueryDialogController(mockQuery, mockOnClose),
        { wrapper: AlertProvider }
      );

      await act(async () => {
        await result.current.renameQuery();
      });

      expect(ChatAPI.rename).not.toHaveBeenCalled();
    });
  });

  // ========== HANDLE CANCEL TESTS ==========
  describe('handleCancel', () => {
    it('should reset the text state to the original title and dismiss the view wrapper', () => {
      const { result } = renderHook(
        () => useRenameQueryDialogController(mockQuery, mockOnClose),
        { wrapper: AlertProvider }
      );

      // Simulate a user typing a temporary change
      act(() => {
        result.current.setNewTitle('Accidental changes...');
      });
      expect(result.current.newTitle).toBe('Accidental changes...');

      // Trigger cancel routine
      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.newTitle).toBe('Original Title'); // Reverted back
      expect(mockOnClose).toHaveBeenCalled(); // Dialog dismissed
    });
  });
});
