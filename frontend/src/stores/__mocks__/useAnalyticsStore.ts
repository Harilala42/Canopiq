import { jest } from '@jest/globals';
import { GeoAnalysis } from '@/types/analysis';

const initialState = {
  analyses: {} as Record<string, GeoAnalysis>,
  activeAnalysis: null as GeoAnalysis | null,
};

// Mock all actions as Jest spy functions
export const mockSetAnalyses = jest.fn();
export const mockSetActiveAnalysis = jest.fn();
export const mockAddAnalysis = jest.fn();
export const mockUpdateAnalysis = jest.fn();
export const mockGetAnalysisById = jest.fn(() => [] as GeoAnalysis[]);
export const mockRemoveAnalysis = jest.fn();
export const mockResetAnalyses = jest.fn();

let mockState = {
  ...initialState,
  setAnalyses: mockSetAnalyses,
  setActiveAnalysis: mockSetActiveAnalysis,
  addAnalysis: mockAddAnalysis,
  updateAnalysis: mockUpdateAnalysis,
  getAnalysisById: mockGetAnalysisById,
  removeAnalysis: mockRemoveAnalysis,
  resetAnalyses: mockResetAnalyses,
};

// The main hook selector mock
const useAnalyticsStore = jest.fn((selector: any) => {
  return selector ? selector(mockState) : mockState;
});

// Mock vanilla Zustand utilities
(useAnalyticsStore as any).getState = jest.fn(() => mockState);

(useAnalyticsStore as any).setState = jest.fn((newState: any, replace?: boolean) => {
  mockState = replace ? { ...newState } : { ...mockState, ...newState };
});

export default useAnalyticsStore;
