import { renderHook, act } from '@testing-library/react';
import { useChatMessagesController } from './useChatMessagesController';
import { MessageData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { supabase, mockChannels } from '@/utils/__mocks__/supabase.utils';

// Mock explicit external dependencies
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/utils/supabase.utils', () => {
  return jest.requireActual('@/utils/__mocks__/supabase.utils');
});

describe('useChatMessagesController', () => {
  const mockMessages: MessageData[] = [
    { id: 'm1', role: 'user', content: 'Give me biomass stats', created_at: '2026-07-06T12:00:00Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    for (const key in mockChannels) {
      delete mockChannels[key];
    }

    // Reset stores hooks to base pristine values
    useChatStore.setState({
      currentJobId: null,
      setCurrentJobId: jest.fn(),
    });

    useMessageStore.setState({
      messages: [],
      isLoading: false,
      isThinking: false,
      currentStatus: null,
      errorMessage: null,
      setCurrentStatus: jest.fn(),
      setErrorMessage: jest.fn(),
      setIsThinking: jest.fn(),
    });
  });

  // =========================================================================
  // 1. INITIALIZATION & ELEMENT SCROLLING
  // =========================================================================
  describe('Initialization', () => {
    it('should expose accurate initial state mappings directly out of the hooks', () => {
      useMessageStore.setState({
        messages: mockMessages,
        isLoading: true,
        isThinking: true,
        currentStatus: 'computing_gee',
        errorMessage: 'Something went wrong',
      });

      const { result } = renderHook(() => useChatMessagesController());

      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isThinking).toBe(true);
      expect(result.current.currentStatus).toBe('computing_gee');
      expect(result.current.errMessage).toBe('Something went wrong');
      expect(result.current.messagesEndRef).toBeDefined();
    });
  });

  // =========================================================================
  // 2. REAL-TIME JOB CHANNEL (Supabase postgres_changes)
  // =========================================================================
  describe('Supabase Realtime Channel Lifecycles', () => {
    it('should completely skip creating a database channel if currentJobId is null', () => {
      useChatStore.setState({ currentJobId: null });

      renderHook(() => useChatMessagesController());

      expect(supabase.channel).not.toHaveBeenCalled();
    });

    it('should establish a real-time subscription matching the structural filter constraints when a job id is active', () => {
      const targetChannel = 'job-status-job-xyz-123';
      useChatStore.setState({ currentJobId: 'job-xyz-123' });

      renderHook(() => useChatMessagesController());

      expect(supabase.channel).toHaveBeenCalledWith(targetChannel);
      
      expect(mockChannels[targetChannel].eventConfig).toEqual({
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: 'id=eq.job-xyz-123',
      });
    });

    it('should handle a "failed" job update event by updating status, providing errors, clearing the job context, and stopping loaders', () => {
      const targetChannel = 'job-status-job-xyz-123';
      useChatStore.setState({ currentJobId: 'job-xyz-123' });
      useMessageStore.setState({ isThinking: true });

      renderHook(() => useChatMessagesController());

      const chatStore = useChatStore.getState();
      const msgStore = useMessageStore.getState();

      const postgresChangesCallback = mockChannels[targetChannel].onCallback;
      act(() => {
        postgresChangesCallback({
          new: { status: 'failed', err_message: 'GIS engine out of memory allocation errors' }
        });
      });

      expect(msgStore.setCurrentStatus).toHaveBeenCalledWith('failed');
      expect(chatStore.setCurrentJobId).toHaveBeenCalledWith(null);
      expect(msgStore.setErrorMessage).toHaveBeenCalledWith('GIS engine out of memory allocation errors');
      expect(msgStore.setIsThinking).toHaveBeenCalledWith(false);
    });

    it('should handle a "completed" status change update event cleanly by nullifying the job tracking reference', () => {
      const targetChannel = 'job-status-job-xyz-123';
      useChatStore.setState({ currentJobId: 'job-xyz-123' });
      useMessageStore.setState({ isThinking: true });

      renderHook(() => useChatMessagesController());

      const chatStore = useChatStore.getState();
      const msgStore = useMessageStore.getState();

      const postgresChangesCallback = mockChannels[targetChannel].onCallback;
      act(() => {
        postgresChangesCallback({
          new: { status: 'completed', err_message: null }
        });
      });

      expect(msgStore.setCurrentStatus).toHaveBeenCalledWith('completed');
      expect(chatStore.setCurrentJobId).toHaveBeenCalledWith(null);
      expect(msgStore.setIsThinking).toHaveBeenCalledWith(false);
      expect(msgStore.setErrorMessage).not.toHaveBeenCalled();
    });

    it('should automatically destroy open channels upon hook unmounting routines', () => {
      useChatStore.setState({ currentJobId: 'job-xyz-123' });

      const { unmount } = renderHook(() => useChatMessagesController());

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    });
  });
});
