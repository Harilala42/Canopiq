import { renderHook, waitFor } from '@testing-library/react';
import { useChatController } from './useChatController';
import { MessageAPI } from '@/api/message.api';
import { supabase } from '@/utils/supabase.utils';
import { ChatData, MessageData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

jest.mock('@/api/message.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/utils/supabase.utils');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useChatController - retrieveChatMessages', () => {
  const mockQuery: ChatData = {
    id: 'chat-uuid-111',
    title: 'Biomass Tracking Run',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false,
  };

  const mockMessages: MessageData[] = [
    { id: 'm1', role: 'user', content: 'Hello', created_at: '2026-06-04T12:01:00Z' },
    { id: 'm2', role: 'model', content: 'Hi there', created_at: '2026-06-04T12:01:05Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default pristine store setups
    useChatStore.setState({ currentQuery: null, isOpen: false });
    useMessageStore.setState({ messages: [], isLoading: false });
  });

  // ========== EDGE CASE 1: NO ACTIVE CHAT CONTEXT ==========
  it('should immediately break out and do nothing if currentQuery id is missing or null', () => {
    useChatStore.setState({ currentQuery: null });

    renderHook(() => useChatController(), { wrapper: AlertProvider });

    // 1. Core API should never be hit
    expect(MessageAPI.getAll).not.toHaveBeenCalled();

    // 2. Real-time engine shouldn't hook into open channels
    expect(supabase.channel).not.toHaveBeenCalled();

    // 3. UI store setup shouldn't flag loading animations
    const msgStore = useMessageStore.getState();
    expect(msgStore.setIsLoading).not.toHaveBeenCalled();
    expect(msgStore.setMessages).not.toHaveBeenCalled();
  });

  // ========== EDGE CASE 2: SUCCESSFUL FETCH & SYNCHRONIZATION ==========
  it('should clear old array frames, trigger loaders, and save new records on successful API resolve', async () => {
    useChatStore.setState({ currentQuery: mockQuery });
    (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: mockMessages });

    renderHook(() => useChatController(), { wrapper: AlertProvider });

    // Instantly checks immediate cleanup synchronization behaviors
    const msgStoreActions = useMessageStore.getState();
    expect(msgStoreActions.setMessages).toHaveBeenCalledWith([]);
    expect(msgStoreActions.setIsLoading).toHaveBeenCalledWith(true);

    // Wait for the async macro-task execution boundary to resolve smoothly
    await waitFor(() => {
      expect(MessageAPI.getAll).toHaveBeenCalledWith('chat-uuid-111');
    });

    // Check message payload allocation and loader cleanup sequence
    expect(msgStoreActions.setMessages).toHaveBeenLastCalledWith(mockMessages);
    expect(msgStoreActions.setIsLoading).toHaveBeenLastCalledWith(false);
    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  // ========== EDGE CASE 3: MALFORMED PACKAGES / EMPTY BACKEND PAYLOADS ==========
  it('should clear old items and terminate loading screen gracefully if server sends a null/empty response collection', async () => {
    useChatStore.setState({ currentQuery: mockQuery });
    
    // Server runs successfully but returns a blank or missing schema layout profile
    (MessageAPI.getAll as jest.Mock).mockResolvedValue({ messages: null });

    renderHook(() => useChatController(), { wrapper: AlertProvider });

    await waitFor(() => {
      expect(MessageAPI.getAll).toHaveBeenCalled();
    });

    const msgStoreActions = useMessageStore.getState();
    // Stores are turned off safely without appending bad references or crashing UI renders
    expect(msgStoreActions.setIsLoading).toHaveBeenLastCalledWith(false);
    expect(msgStoreActions.setMessages).toHaveBeenCalledTimes(1);
    expect(msgStoreActions.setMessages).toHaveBeenCalledWith([]);
    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  // ========== EDGE CASE 4: HARD BACKEND NETWORK FAILURES ==========
  it('should handle unhandled API exceptions by turning off loaders and broadcasting a clear context alert banner', async () => {
    useChatStore.setState({ currentQuery: mockQuery });
    
    // Simulate database deadlock, 500 crashes, or absolute disconnect conditions
    (MessageAPI.getAll as jest.Mock).mockRejectedValue(new Error('Internal Server Error 500'));

    renderHook(() => useChatController(), { wrapper: AlertProvider });

    await waitFor(() => {
      expect(MessageAPI.getAll).toHaveBeenCalled();
    });

    const msgStoreActions = useMessageStore.getState();
    // Loader must turn off to avoid infinite loading spinners on error states
    expect(msgStoreActions.setIsLoading).toHaveBeenLastCalledWith(false);
    
    // Displays accurate notification details to the client viewport window
    expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to load chat messages. Try again later!');
  });
});
