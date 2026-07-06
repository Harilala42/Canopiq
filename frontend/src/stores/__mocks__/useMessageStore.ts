import { jest } from '@jest/globals';
import { MessageData, JobStatus } from '@/types/chat';

const initialState = {
  messages: [] as MessageData[],
  isLoading: false,
  isThinking: false,
  currentStatus: null as JobStatus | null,
  errorMessage: null as string | null,
};

// Mock all actions as Jest spy functions
export const mockSetMessages = jest.fn();
export const mockSetIsThinking = jest.fn();
export const mockSetIsLoading = jest.fn();
export const mockSetCurrentStatus = jest.fn();
export const mockSetErrorMessage = jest.fn();
export const mockAddMessage = jest.fn();
export const mockRemoveMessage = jest.fn();
export const mockResetMessages = jest.fn();

let mockState = {
  ...initialState,
  setMessages: mockSetMessages,
  setIsThinking: mockSetIsThinking,
  setIsLoading: mockSetIsLoading,
  setCurrentStatus: mockSetCurrentStatus,
  setErrorMessage: mockSetErrorMessage,
  addMessage: mockAddMessage,
  removeMessage: mockRemoveMessage,
  resetMessages: mockResetMessages,
};

// The main hook selector mock
const useMessageStore = jest.fn((selector: any) => {
  return selector ? selector(mockState) : mockState;
});

// Mock vanilla Zustand utilities
(useMessageStore as any).getState = jest.fn(() => mockState);

(useMessageStore as any).setState = jest.fn((newState: any, replace?: boolean) => {
  mockState = replace ? { ...newState } : { ...mockState, ...newState };
});

export default useMessageStore;
