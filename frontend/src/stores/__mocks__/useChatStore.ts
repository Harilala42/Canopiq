import { jest } from '@jest/globals';

const initialState = {
  queries: [],
  currentQuery: null,
  isOpen: true,
};

export const mockSetQueries = jest.fn();
export const mockSetCurrentQuery = jest.fn();
export const mockAddQuery = jest.fn();
export const mockUpdateQuery = jest.fn();
export const mockDeleteQuery = jest.fn();
export const mockOpenChat = jest.fn();
export const mockCloseChat = jest.fn();
export const mockToggleChat = jest.fn();

let mockState = {
  ...initialState,
  setQueries: mockSetQueries,
  setCurrentQuery: mockSetCurrentQuery,
  addQuery: mockAddQuery,
  updateQuery: mockUpdateQuery,
  deleteQuery: mockDeleteQuery,
  openChat: mockOpenChat,
  closeChat: mockCloseChat,
  toggleChat: mockToggleChat,
};

const useChatStore = jest.fn((selector: any) => {
  return selector ? selector(mockState) : mockState;
});

(useChatStore as any).getState = jest.fn(() => mockState);

(useChatStore as any).setState = jest.fn((newState: any, replace?: boolean) => {
  mockState = replace ? { ...newState } : { ...mockState, ...newState };
});

export default useChatStore;
