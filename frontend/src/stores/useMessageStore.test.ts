import useMessageStore from './useMessageStore';
import { MessageData, JobStatus } from '@/types/chat';

describe('useMessageStore', () => {
  // Mock data
  const mockMessage1: MessageData = {
    id: '1',
    role: 'user',
    content: 'Hello, what is the biomass here?',
    created_at: '2026-01-01T00:00:00Z',
  };

  const mockMessage2: MessageData = {
    id: '2',
    role: 'model',
    content: 'The biomass in this area is approximately 50 Ct/ha.',
    created_at: '2026-01-01T00:00:05Z',
  };

  const mockMessage3: MessageData = {
    id: '3',
    role: 'user',
    content: 'Show me the trend over time.',
    created_at: '2026-01-01T00:00:10Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state before each test
    useMessageStore.setState({
      messages: [],
      isLoading: false,
      isThinking: false,
      currentStatus: 'queued',
      errorMessage: null,
    });
  });

  // ========== SETMESSAGES TESTS ==========
  describe('setMessages', () => {
    it('should set messages array', () => {
      useMessageStore.getState().setMessages([mockMessage1, mockMessage2]);

      expect(useMessageStore.getState().messages).toEqual([mockMessage1, mockMessage2]);
    });

    it('should replace existing messages', () => {
      useMessageStore.getState().setMessages([mockMessage1]);
      expect(useMessageStore.getState().messages).toHaveLength(1);

      useMessageStore.getState().setMessages([mockMessage2, mockMessage3]);
      expect(useMessageStore.getState().messages).toHaveLength(2);
      expect(useMessageStore.getState().messages).toEqual([mockMessage2, mockMessage3]);
    });

    it('should handle empty array', () => {
      useMessageStore.getState().setMessages([mockMessage1, mockMessage2]);
      expect(useMessageStore.getState().messages).toHaveLength(2);

      useMessageStore.getState().setMessages([]);
      expect(useMessageStore.getState().messages).toHaveLength(0);
    });

    it('should not affect other state properties', () => {
      useMessageStore.setState({
        isLoading: true,
        isThinking: true,
        currentStatus: 'analyzing_prompt',
        errorMessage: 'Some error',
      });

      useMessageStore.getState().setMessages([mockMessage1]);

      expect(useMessageStore.getState().isLoading).toBe(true);
      expect(useMessageStore.getState().isThinking).toBe(true);
      expect(useMessageStore.getState().currentStatus).toBe('analyzing_prompt');
      expect(useMessageStore.getState().errorMessage).toBe('Some error');
    });
  });

  // ========== ADDMESSAGE TESTS ==========
  describe('addMessage', () => {
    it('should add a new message to the array', () => {
      useMessageStore.getState().addMessage(mockMessage1);

      expect(useMessageStore.getState().messages).toHaveLength(1);
      expect(useMessageStore.getState().messages[0]).toEqual(mockMessage1);
    });

    it('should add multiple messages in order', () => {
      useMessageStore.getState().addMessage(mockMessage1);
      useMessageStore.getState().addMessage(mockMessage2);
      useMessageStore.getState().addMessage(mockMessage3);

      expect(useMessageStore.getState().messages).toHaveLength(3);
      expect(useMessageStore.getState().messages[0]).toEqual(mockMessage1);
      expect(useMessageStore.getState().messages[1]).toEqual(mockMessage2);
      expect(useMessageStore.getState().messages[2]).toEqual(mockMessage3);
    });

    it('should prevent duplicate messages by id', () => {
      useMessageStore.getState().addMessage(mockMessage1);
      expect(useMessageStore.getState().messages).toHaveLength(1);

      // Try to add the same message again
      useMessageStore.getState().addMessage(mockMessage1);
      expect(useMessageStore.getState().messages).toHaveLength(1);
    });

    it('should not add duplicate even if content differs but id is same', () => {
      useMessageStore.getState().addMessage(mockMessage1);

      const duplicateMessage = {
        ...mockMessage1,
        content: 'Different content',
      };

      useMessageStore.getState().addMessage(duplicateMessage);

      expect(useMessageStore.getState().messages).toHaveLength(1);
      expect(useMessageStore.getState().messages[0].content).toBe(mockMessage1.content);
    });

    it('should add different messages even with similar content', () => {
      const msg1: MessageData = {
        id: '1',
        role: 'user',
        content: 'Same content',
        created_at: '2026-01-01T00:00:00Z',
      };

      const msg2: MessageData = {
        id: '2',
        role: 'model',
        content: 'Same content',
        created_at: '2026-01-01T00:00:05Z',
      };

      useMessageStore.getState().addMessage(msg1);
      useMessageStore.getState().addMessage(msg2);

      expect(useMessageStore.getState().messages).toHaveLength(2);
      expect(useMessageStore.getState().messages[0].id).toBe('1');
      expect(useMessageStore.getState().messages[1].id).toBe('2');
    });

    it('should not affect other state properties when adding message', () => {
      useMessageStore.setState({
        isLoading: true,
        isThinking: true,
        currentStatus: 'computing_gee',
        errorMessage: null,
      });

      useMessageStore.getState().addMessage(mockMessage1);

      expect(useMessageStore.getState().isLoading).toBe(true);
      expect(useMessageStore.getState().isThinking).toBe(true);
      expect(useMessageStore.getState().currentStatus).toBe('computing_gee');
    });
  });

  // ========== RESETMESSAGES TESTS ==========
  describe('resetMessages', () => {
    it('should reset messages array to empty', () => {
      useMessageStore.getState().setMessages([mockMessage1, mockMessage2, mockMessage3]);
      expect(useMessageStore.getState().messages).toHaveLength(3);

      useMessageStore.getState().resetMessages();

      expect(useMessageStore.getState().messages).toHaveLength(0);
    });

    it('should reset isLoading to false', () => {
      useMessageStore.setState({ isLoading: true });
      expect(useMessageStore.getState().isLoading).toBe(true);

      useMessageStore.getState().resetMessages();

      expect(useMessageStore.getState().isLoading).toBe(false);
    });

    it('should reset isThinking to false', () => {
      useMessageStore.setState({ isThinking: true });
      expect(useMessageStore.getState().isThinking).toBe(true);

      useMessageStore.getState().resetMessages();

      expect(useMessageStore.getState().isThinking).toBe(false);
    });

    it('should reset currentStatus to queued', () => {
      useMessageStore.setState({ currentStatus: 'analyzing_prompt' });
      expect(useMessageStore.getState().currentStatus).toBe('analyzing_prompt');

      useMessageStore.getState().resetMessages();

      expect(useMessageStore.getState().currentStatus).toBe('queued');
    });

    it('should reset errorMessage to null', () => {
      useMessageStore.setState({ errorMessage: 'Error occurred' });
      expect(useMessageStore.getState().errorMessage).toBe('Error occurred');

      useMessageStore.getState().resetMessages();

      expect(useMessageStore.getState().errorMessage).toBeNull();
    });

    it('should reset all state properties together', () => {
      useMessageStore.setState({
        messages: [mockMessage1, mockMessage2],
        isLoading: true,
        isThinking: true,
        currentStatus: 'failed',
        errorMessage: 'Processing failed',
      });

      useMessageStore.getState().resetMessages();

      expect(useMessageStore.getState().messages).toEqual([]);
      expect(useMessageStore.getState().isLoading).toBe(false);
      expect(useMessageStore.getState().isThinking).toBe(false);
      expect(useMessageStore.getState().currentStatus).toBe('queued');
      expect(useMessageStore.getState().errorMessage).toBeNull();
    });
  });

  // ========== OTHER SETTERS TESTS ==========
  describe('Other setters', () => {
    it('setIsLoading should update isLoading', () => {
      useMessageStore.getState().setIsLoading(true);
      expect(useMessageStore.getState().isLoading).toBe(true);

      useMessageStore.getState().setIsLoading(false);
      expect(useMessageStore.getState().isLoading).toBe(false);
    });

    it('setIsThinking should update isThinking', () => {
      useMessageStore.getState().setIsThinking(true);
      expect(useMessageStore.getState().isThinking).toBe(true);

      useMessageStore.getState().setIsThinking(false);
      expect(useMessageStore.getState().isThinking).toBe(false);
    });

    it('setCurrentStatus should update currentStatus', () => {
      const statuses: JobStatus[] = [
        'queued',
        'analyzing_prompt',
        'computing_gee',
        'generating_report',
        'completed',
        'failed',
      ];

      statuses.forEach((status) => {
        useMessageStore.getState().setCurrentStatus(status);
        expect(useMessageStore.getState().currentStatus).toBe(status);
      });
    });

    it('setErrorMessage should set error message', () => {
      useMessageStore.getState().setErrorMessage('Network error');
      expect(useMessageStore.getState().errorMessage).toBe('Network error');

      useMessageStore.getState().setErrorMessage(null);
      expect(useMessageStore.getState().errorMessage).toBeNull();
    });
  });

  // ========== INTEGRATION TESTS ==========
  describe('Integration scenarios', () => {
    it('should handle message flow: add messages, set status, then reset', () => {
      // Add messages
      useMessageStore.getState().addMessage(mockMessage1);
      useMessageStore.getState().addMessage(mockMessage2);
      expect(useMessageStore.getState().messages).toHaveLength(2);

      // Update states
      useMessageStore.getState().setIsThinking(true);
      useMessageStore.getState().setCurrentStatus('computing_gee');
      expect(useMessageStore.getState().isThinking).toBe(true);
      expect(useMessageStore.getState().currentStatus).toBe('computing_gee');

      // Add another message
      useMessageStore.getState().addMessage(mockMessage3);
      expect(useMessageStore.getState().messages).toHaveLength(3);

      // Reset everything
      useMessageStore.getState().resetMessages();
      expect(useMessageStore.getState().messages).toHaveLength(0);
      expect(useMessageStore.getState().isThinking).toBe(false);
      expect(useMessageStore.getState().currentStatus).toBe('queued');
    });

    it('should handle error scenario: set error, prevent duplicate, then reset', () => {
      useMessageStore.getState().addMessage(mockMessage1);
      useMessageStore.getState().setCurrentStatus('failed');
      useMessageStore.getState().setErrorMessage('Failed to process');
      useMessageStore.getState().setIsThinking(false);

      expect(useMessageStore.getState().currentStatus).toBe('failed');
      expect(useMessageStore.getState().errorMessage).toBe('Failed to process');
      expect(useMessageStore.getState().isThinking).toBe(false);

      // Try to add duplicate
      useMessageStore.getState().addMessage(mockMessage1);
      expect(useMessageStore.getState().messages).toHaveLength(1);

      // Reset
      useMessageStore.getState().resetMessages();
      expect(useMessageStore.getState().currentStatus).toBe('queued');
      expect(useMessageStore.getState().errorMessage).toBeNull();
      expect(useMessageStore.getState().messages).toHaveLength(0);
    });

    it('should maintain message order through multiple operations', () => {
      useMessageStore.getState().addMessage(mockMessage1);
      useMessageStore.getState().addMessage(mockMessage2);
      useMessageStore.getState().addMessage(mockMessage3);

      expect(useMessageStore.getState().messages[0].id).toBe('1');
      expect(useMessageStore.getState().messages[1].id).toBe('2');
      expect(useMessageStore.getState().messages[2].id).toBe('3');

      // Try to add duplicate in the middle
      useMessageStore.getState().addMessage(mockMessage2);
      expect(useMessageStore.getState().messages).toHaveLength(3);

      // Order should be maintained
      expect(useMessageStore.getState().messages[0].id).toBe('1');
      expect(useMessageStore.getState().messages[1].id).toBe('2');
      expect(useMessageStore.getState().messages[2].id).toBe('3');
    });
  });
});
