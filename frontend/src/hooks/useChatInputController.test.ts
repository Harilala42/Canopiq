import { renderHook, act } from '@testing-library/react';
import { useChatInputController } from './useChatInputController';
import { ChatAPI } from '@/api/chat.api';
import { MessageAPI } from '@/api/message.api';
import { JobAPI } from '@/api/job.api';
import { ChatData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

// Mock required modules
jest.mock('@/api/chat.api');
jest.mock('@/api/message.api');
jest.mock('@/api/job.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useChatInputController', () => {
  const mockChat: ChatData = {
    id: 'chat-xyz-789',
    title: 'New Analytical Query Run',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false,
  };

  const mockUUID = 'mocked-crypto-uuid-111222';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock global crypto for predictable randomUUID generation
    Object.defineProperty(global, 'crypto', {
      value: { randomUUID: () => mockUUID },
      writable: true,
    });

    // Seed empty default values into Zustand store states
    useChatStore.setState({ currentQuery: null, currentJobId: null });
    useMessageStore.setState({ isLoading: false, isThinking: false });
  });

  // =========================================================================
  // 1. MESSAGING ENGINE (handleSendMessage)
  // =========================================================================
  describe('handleSendMessage functionality', () => {
    it('should instantly bail out and make no network requests if input is empty or whitespace', async () => {
      const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

      act(() => {
        result.current.setInputValue('   ');
      });

      await act(async () => {
        await result.current.handleSendMessage();
      });

      expect(ChatAPI.create).not.toHaveBeenCalled();
      expect(MessageAPI.send).not.toHaveBeenCalled();
    });

    it('should create a new chat query context, execute optimistic rendering, and trigger a queued status if job_id is returned', async () => {
      useChatStore.setState({ currentQuery: null });
      
      (ChatAPI.create as jest.Mock).mockResolvedValue({ chat: mockChat });
      (MessageAPI.send as jest.Mock).mockResolvedValue({ job_id: 'job-abc-123' });

      const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

      act(() => {
        result.current.setInputValue('Calculate biomass distribution');
      });

      const msgStoreActions = useMessageStore.getState();
      const chatStoreActions = useChatStore.getState();

      await act(async () => {
        await result.current.handleSendMessage();
      });

      // Assert Optimistic UI Rendering triggered immediately
      expect(msgStoreActions.addMessage).toHaveBeenCalledWith(expect.objectContaining({
        id: `temp-${mockUUID}`,
        content: 'Calculate biomass distribution',
        role: 'user',
      }));
      expect(msgStoreActions.setIsThinking).toHaveBeenCalledWith(true);

      // Verify Creation Pipeline Hooks
      expect(ChatAPI.create).toHaveBeenCalled();
      expect(chatStoreActions.addQuery).toHaveBeenCalledWith(mockChat);
      expect(chatStoreActions.setCurrentQuery).toHaveBeenCalledWith({ ...mockChat, isNew: true });

      // Check message execution mapping with tracking tokens
      expect(MessageAPI.send).toHaveBeenCalledWith('chat-xyz-789', mockUUID, 'Calculate biomass distribution');

      // Verify Job Status mapping onto store contexts
      expect(msgStoreActions.setCurrentStatus).toHaveBeenCalledWith('queued');
      expect(chatStoreActions.setCurrentJobId).toHaveBeenCalledWith('job-abc-123');
      expect(msgStoreActions.setErrorMessage).toHaveBeenCalledWith(null);

      expect(result.current.inputValue).toBe('');
      expect(result.current.isSending).toBe(false);
    });

    it('should turn off the thinking screen if message returns an instant reply block directly', async () => {
      useChatStore.setState({ currentQuery: mockChat });
      (MessageAPI.send as jest.Mock).mockResolvedValue({ reply: 'Instant AI response' });

      const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

      act(() => {
        result.current.setInputValue('Hello Store');
      });

      await act(async () => {
        await result.current.handleSendMessage();
      });

      const msgStoreActions = useMessageStore.getState();
      expect(ChatAPI.create).not.toHaveBeenCalled();
      expect(msgStoreActions.setIsThinking).toHaveBeenLastCalledWith(false);
      expect(msgStoreActions.setCurrentStatus).toHaveBeenLastCalledWith(null);
    });

    it('should roll back text entry context, clean up loaders, and drop temporary text nodes if message processing throws exceptions', async () => {
      useChatStore.setState({ currentQuery: mockChat });
      (MessageAPI.send as jest.Mock).mockRejectedValue(new Error('Absolute network dropout'));

      const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

      act(() => {
        result.current.setInputValue('Rollback check text value');
      });

      await act(async () => {
        await result.current.handleSendMessage();
      });

      const msgStoreActions = useMessageStore.getState();

      // Ensure system cleans up store and preserves input message state for retries
      expect(msgStoreActions.setIsThinking).toHaveBeenCalledWith(false);
      expect(msgStoreActions.setCurrentStatus).toHaveBeenCalledWith(null);
      expect(msgStoreActions.removeMessage).toHaveBeenCalledWith(`temp-${mockUUID}`);
      expect(result.current.inputValue).toBe('Rollback check text value');
      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to send message. Try again later!');
    });
  });

  // =========================================================================
  // 2. JOB CANCELLATION ENGINE (handleCancelAnalysis)
  // =========================================================================
  describe('handleCancelAnalysis functionality', () => {
    it('should immediately exit out if currentJobId string context is missing or null', async () => {
      useChatStore.setState({ currentJobId: null });

      const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

      await act(async () => {
        await result.current.handleCancelAnalysis();
      });

      expect(JobAPI.cancelJob).not.toHaveBeenCalled();
    });

    it('should interact with the cancellations API, turn off thinking components, and clean state identifiers on success', async () => {
      useChatStore.setState({ currentJobId: 'job-active-777' });
      useMessageStore.setState({ isThinking: true });
      (JobAPI.cancelJob as jest.Mock).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

      await act(async () => {
        await result.current.handleCancelAnalysis();
      });

      const chatStoreActions = useChatStore.getState();
      const msgStoreActions = useMessageStore.getState();

      expect(JobAPI.cancelJob).toHaveBeenCalledWith('job-active-777');
      expect(msgStoreActions.setIsThinking).toHaveBeenCalledWith(false);
      expect(chatStoreActions.setCurrentJobId).toHaveBeenCalledWith(null);
      expect(msgStoreActions.setCurrentStatus).toHaveBeenCalledWith(null);
      expect(mockShowAlert).toHaveBeenCalledWith(true, 'Successfully cancelled analysis');
    });

    it('should issue a failure warning banner to users if processing cancellation actions fails downstream', async () => {
      useChatStore.setState({ currentJobId: 'job-active-777' });
      (JobAPI.cancelJob as jest.Mock).mockRejectedValue(new Error('Cancellation rejected'));

      const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

      await act(async () => {
        await result.current.handleCancelAnalysis();
      });

      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to cancel GIS analysis');
    });
  });
});
