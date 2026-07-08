import { renderHook, act } from '@testing-library/react';
import { useChatMessagesController } from './useChatMessagesController';
import { MessageData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { supabase, mockChannels } from '@/utils/__mocks__/supabase.utils';
import { JobAPI } from '@/api/job.api';

// Mock explicit external dependencies
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/api/job.api');
jest.mock('@/utils/supabase.utils', () => {
  return jest.requireActual('@/utils/__mocks__/supabase.utils');
});
jest.mock('@/contexts/alertContext', () => {
  return jest.requireActual('@/contexts/__mocks__/alertContext');
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

  // =========================================================================
  // 3. FALLBACK POLLING SYSTEM
  // =========================================================================
  describe('Fallback Polling System', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (JobAPI.getJob as jest.Mock).mockClear();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllTimers();
    });

    it('should start polling via API when channel status drops to CHANNEL_ERROR or TIMED_OUT', async () => {
      const targetChannel = 'job-status-job-xyz-123';
      useChatStore.setState({ currentJobId: 'job-xyz-123' });

      (JobAPI.getJob as jest.Mock).mockResolvedValue({
        job: { status: 'computing_gee', err_message: null }
      });

      renderHook(() => useChatMessagesController());
      
      const msgStore = useMessageStore.getState();
      const subscribeCallback = mockChannels[targetChannel].subscribeCallback;

      // Trigger disconnection state
      act(() => { subscribeCallback('CHANNEL_ERROR', null); });

      // Fast-forward past the 5-second setInterval
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(JobAPI.getJob).toHaveBeenCalledWith('job-xyz-123');
      expect(msgStore.setCurrentStatus).toHaveBeenCalledWith('computing_gee');
    });

    it('should stop polling immediately when channel reconnects (SUBSCRIBED)', async () => {
      const targetChannel = 'job-status-job-xyz-123';
      useChatStore.setState({ currentJobId: 'job-xyz-123' });

      renderHook(() => useChatMessagesController());
      const subscribeCallback = mockChannels[targetChannel].subscribeCallback;

      // Drop connection to start poller
      act(() => { subscribeCallback('TIMED_OUT', null); });
      
      // Re-establish connection before interval fires
      act(() => { subscribeCallback('SUBSCRIBED', null); });

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // API should not have been called because stopPolling() cleared the interval
      expect(JobAPI.getJob).not.toHaveBeenCalled();
    });

    it('should finalize state correctly if polling returns completed', async () => {
      const targetChannel = 'job-status-job-xyz-123';
      useChatStore.setState({ currentJobId: 'job-xyz-123' });

      (JobAPI.getJob as jest.Mock).mockResolvedValue({
        job: { status: 'completed', err_message: null }
      });

      renderHook(() => useChatMessagesController());
      const subscribeCallback = mockChannels[targetChannel].subscribeCallback;

      act(() => { subscribeCallback('CHANNEL_ERROR', null); });

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      const chatStore = useChatStore.getState();
      const msgStore = useMessageStore.getState();
      
      expect(msgStore.setCurrentStatus).toHaveBeenCalledWith('completed');
      expect(chatStore.setCurrentJobId).toHaveBeenCalledWith(null); // Clean up
    });

    it('should trigger a permanent failure after 3 consecutive polling errors', async () => {
      const targetChannel = 'job-status-job-xyz-123';
      useChatStore.setState({ currentJobId: 'job-xyz-123' });

      // Simulate a completely dead backend where fetch throws
      (JobAPI.getJob as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderHook(() => useChatMessagesController());
      const subscribeCallback = mockChannels[targetChannel].subscribeCallback;

      act(() => { subscribeCallback('CHANNEL_ERROR', null); });

      // Fast-forward 15 seconds (3 interval ticks)
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          jest.advanceTimersByTime(5000);
        });
      }

      // It should have tried exactly 3 times
      expect(JobAPI.getJob).toHaveBeenCalledTimes(3);

      const chatStore = useChatStore.getState();
      const msgStore = useMessageStore.getState();

      // UI should reflect absolute disconnection
      expect(msgStore.setCurrentStatus).toHaveBeenCalledWith('failed');
      expect(msgStore.setErrorMessage).toHaveBeenCalledWith('Connection lost. Unable to reach the server.');
      expect(chatStore.setCurrentJobId).toHaveBeenCalledWith(null);
    });
  });
});
