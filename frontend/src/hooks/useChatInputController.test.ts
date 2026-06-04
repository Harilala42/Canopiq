import { renderHook, act } from '@testing-library/react';
import { useChatInputController } from './useChatInputController';
import { ChatAPI } from '@/api/chat.api';
import { MessageAPI } from '@/api/message.api';
import { ChatData, MessageData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

jest.mock('@/api/chat.api');
jest.mock('@/api/message.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMessageStore');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useChatInputController - handleSendMessage', () => {
  const mockChat: ChatData = {
    id: 'chat-xyz-789',
    title: 'New Analytical Query Run',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false,
  };

  const mockUserMessage: MessageData = {
    id: 'msg-1',
    role: 'user',
    content: 'Calculate biomass distribution in Analamanga',
    created_at: '2026-06-04T12:00:05Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useChatStore.setState({ currentQuery: null });
    useMessageStore.setState({ isLoading: false });
  });

  it('should instantly bail out and make no network requests if input is empty or whitespace', async () => {
    const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

    act(() => {
      result.current.setInputValue('   '); // White space entries
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(ChatAPI.create).not.toHaveBeenCalled();
    expect(MessageAPI.send).not.toHaveBeenCalled();
  });

  // ========== THE COLD PATH: NO ACTIVE CHAT EXISTING ==========
  it('should initialize a brand-new chat query context before transmitting message if currentQuery is null', async () => {
    useChatStore.setState({ currentQuery: null });
    
    // Setup resolutions for both sequential API operations
    (ChatAPI.create as jest.Mock).mockResolvedValue({ chat: mockChat });
    (MessageAPI.send as jest.Mock).mockResolvedValue({ message: mockUserMessage });

    const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

    act(() => {
      result.current.setInputValue('Calculate biomass distribution in Analamanga');
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    // 1. Confirm new chat query creation pipeline was hit first
    expect(ChatAPI.create).toHaveBeenCalled();
    
    // 2. Verify state allocations synchronized onto Chat Store
    const chatStoreActions = useChatStore.getState();
    expect(chatStoreActions.addQuery).toHaveBeenCalledWith(mockChat);
    expect(chatStoreActions.setCurrentQuery).toHaveBeenCalledWith(mockChat);

    // 3. Confirm text payload sent downstream attached onto the new chat session context ID
    expect(MessageAPI.send).toHaveBeenCalledWith('chat-xyz-789', 'Calculate biomass distribution in Analamanga');

    // 4. Verify messages state engine changes took place properly
    const msgStoreActions = useMessageStore.getState();
    expect(msgStoreActions.addMessage).toHaveBeenCalledWith(mockUserMessage);
    expect(msgStoreActions.setCurrentStatus).toHaveBeenCalledWith('queued');
    expect(msgStoreActions.setErrorMessage).toHaveBeenCalledWith(null);
    expect(msgStoreActions.setIsThinking).toHaveBeenCalledWith(true);

    // 5. Input value must clear out to receive next command string
    expect(result.current.inputValue).toBe('');
    expect(result.current.isSending).toBe(false);
  });

  // ========== THE WARM PATH: ACTIVE CHAT EXISTS ==========
  it('should skip creating a new chat entirely if an active currentQuery exists in store', async () => {
    // Seed an active query baseline pre-condition
    useChatStore.setState({ currentQuery: mockChat });
    (MessageAPI.send as jest.Mock).mockResolvedValue({ message: mockUserMessage });

    const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

    act(() => {
      result.current.setInputValue('Calculate biomass distribution in Analamanga');
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    // Chat already exists! Guard clause should skip creation
    expect(ChatAPI.create).not.toHaveBeenCalled();

    // Sends the message directly using our existing pre-loaded store ID context token
    expect(MessageAPI.send).toHaveBeenCalledWith('chat-xyz-789', 'Calculate biomass distribution in Analamanga');
    
    const msgStoreActions = useMessageStore.getState();
    expect(msgStoreActions.addMessage).toHaveBeenCalledWith(mockUserMessage);
    expect(result.current.inputValue).toBe('');
  });

  // ========== FAULT TOLERANCE AND ERROR RUNNING LIFECYCLES ==========
  it('should intercept issues during session creation and avoid firing off messages', async () => {
    useChatStore.setState({ currentQuery: null });
    
    // Simulate query creation crash or unexpected response format parameters
    (ChatAPI.create as jest.Mock).mockResolvedValue(null); 

    const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

    act(() => {
      result.current.setInputValue('Calculate biomass distribution in Analamanga');
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(ChatAPI.create).toHaveBeenCalled();
    expect(MessageAPI.send).not.toHaveBeenCalled(); // Safely aborted!
    
    // Alert context error announced to UI frame
    expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to send message. Try again later!');
    expect(result.current.isSending).toBe(false);
  });

  it('should gracefully handle message submission crashes when the server drops mid-delivery', async () => {
    useChatStore.setState({ currentQuery: mockChat });
    
    // Message delivery fails over the wire network level
    (MessageAPI.send as jest.Mock).mockRejectedValue(new Error('Gateway Timeout 504'));

    const { result } = renderHook(() => useChatInputController(), { wrapper: AlertProvider });

    act(() => {
      result.current.setInputValue('Calculate biomass distribution in Analamanga');
    });

    await act(async () => {
      await result.current.handleSendMessage();
    });

    // Error captured, UI flags safe rollback parameters, input state kept intact
    expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to send message. Try again later!');
    expect(result.current.isSending).toBe(false);
  });
});
