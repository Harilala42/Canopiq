import { jest } from '@jest/globals';
import { GridMap } from '@/types/map';
import { GeoAnalysis } from '@/types/analysis';

const initialState = {
  activeMapId: null as string | null,
  maps: {} as Record<string, GridMap>,
};

// Mock all actions as Jest spy functions
export const mockAddMap = jest.fn();
export const mockSetActiveMap = jest.fn();
export const mockGetOwnerAnalysis = jest.fn(() => ({} as GeoAnalysis));
export const mockClearMap = jest.fn();

let mockState = {
  ...initialState,
  addMap: mockAddMap,
  setActiveMap: mockSetActiveMap,
  getOwnerAnalysis: mockGetOwnerAnalysis,
  clearMap: mockClearMap,
};

// The main hook selector mock
const useMapStore = jest.fn((selector: any) => {
  return selector ? selector(mockState) : mockState;
});

// Mock vanilla Zustand utilities
(useMapStore as any).getState = jest.fn(() => mockState);

(useMapStore as any).setState = jest.fn((newState: any, replace?: boolean) => {
  mockState = replace ? { ...newState } : { ...mockState, ...newState };
});

export default useMapStore;
