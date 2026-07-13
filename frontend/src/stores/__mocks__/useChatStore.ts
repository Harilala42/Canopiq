import { jest } from '@jest/globals';
import { ChatData } from '@/types/chat';

const initialState = {
  isOpen: false,
  queries: [] as ChatData[],
  currentQuery: null as ChatData | null,
  currentJobId: null as string | null,
};

// Mock all actions as Jest spy functions
export const mockSetQueries = jest.fn();
export const mockSetCurrentQuery = jest.fn();
export const mockSetCurrentJobId = jest.fn();
export const mockAddQuery = jest.fn();
export const mockUpdateQuery = jest.fn();
export const mockDeleteQuery = jest.fn();
export const mockOpenSidebar = jest.fn();
export const mockCloseSidebar = jest.fn();
export const mockToggleSidebar = jest.fn();

let mockState = {
  ...initialState,
  setQueries: mockSetQueries,
  setCurrentQuery: mockSetCurrentQuery,
  setCurrentJobId: mockSetCurrentJobId,
  addQuery: mockAddQuery,
  updateQuery: mockUpdateQuery,
  deleteQuery: mockDeleteQuery,
  openSidebar: mockOpenSidebar,
  closeSideBar: mockCloseSidebar,
  toggleSideBar: mockToggleSidebar,
};

// The main hook selector mock
const useChatStore = jest.fn((selector: any) => {
  return selector ? selector(mockState) : mockState;
});

// Mock vanilla Zustand utilities
(useChatStore as any).getState = jest.fn(() => mockState);

(useChatStore as any).setState = jest.fn((newState: any, replace?: boolean) => {
  mockState = replace ? { ...newState } : { ...mockState, ...newState };
});

export default useChatStore;
