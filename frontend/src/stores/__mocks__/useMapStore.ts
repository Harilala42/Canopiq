import { jest } from '@jest/globals';

const initialState = {
  location: null,
  map: null,
  coords: null,
  legend: null,
};

export const mockSetMap = jest.fn();
export const mockSetCoords = jest.fn();
export const mockSetLocation = jest.fn();
export const mockSetLegend = jest.fn();
export const mockClearMap = jest.fn();

let mockState = {
  ...initialState,
  setMap: mockSetMap,
  setCoords: mockSetCoords,
  setLocation: mockSetLocation,
  setLegend: mockSetLegend,
  clearMap: mockClearMap,
};

const useMapStore = jest.fn((selector: any) => {
  return selector ? selector(mockState) : mockState;
});

(useMapStore as any).getState = jest.fn(() => mockState);

(useMapStore as any).setState = jest.fn((newState: any, replace?: boolean) => {
  mockState = replace ? { ...newState } : { ...mockState, ...newState };
});

export default useMapStore;
