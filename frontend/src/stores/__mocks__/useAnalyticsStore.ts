import { jest } from '@jest/globals';

const initialState = {
  isChartOpen: false,
  dataset: null,
  range_times: null,
  geo_analysis_id: null,
  area_coverage: 0,
  global_average: 0,
  total_change: 0,
  dataset_time_series: [],
  land_cover: null,
};

export const mockOpenChart = jest.fn();
export const mockCloseChart = jest.fn();
export const mockToggleIsChartOpen = jest.fn();
export const mockSetGeoAnalysisId = jest.fn();
export const mockSetDataset = jest.fn();
export const mockSetRangeTimes = jest.fn();
export const mockSetAreaCoverage = jest.fn();
export const mockSetGlobalAverage = jest.fn();
export const mockSetTotalChange = jest.fn();
export const mockSetDatasetTimeSeries = jest.fn();
export const mockSetLandCover = jest.fn();
export const mockSetAnalyticsData = jest.fn();
export const mockResetAnalyticsData = jest.fn();

let mockState = {
    ...initialState,
    openChart: mockOpenChart,
    closeChart: mockCloseChart,
    toggleIsChartOpen: mockToggleIsChartOpen,
    setGeoAnalysisId: mockSetGeoAnalysisId,
    setDataset: mockSetDataset,
    setRangeTimes: mockSetRangeTimes,
    setAreaCoverage: mockSetAreaCoverage,
    setGlobalAverage: mockSetGlobalAverage,
    setTotalChange: mockSetTotalChange,
    setDatasetTimeSeries: mockSetDatasetTimeSeries,
    setLandCover: mockSetLandCover,
    setAnalyticsData: mockSetAnalyticsData,
    resetAnalyticsData: mockResetAnalyticsData,
  };

const useAnalyticsStore = jest.fn((selector: any) => {
  return selector ? selector(mockState) : mockState;
});

(useAnalyticsStore as any).getState = jest.fn(() => mockState);

(useAnalyticsStore as any).setState = jest.fn((newState: any, replace?: boolean) => {
  mockState = replace ? { ...newState } : { ...mockState, ...newState };
});

export default useAnalyticsStore;
