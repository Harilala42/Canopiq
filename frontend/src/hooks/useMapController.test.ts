import { renderHook, waitFor } from '@testing-library/react';
import { useMapController } from './useMapController';
import { AnalysisAPI } from '@/api/analysis.api';
import { GridMap, HexGeoJSONData, LegendData } from '@/types/map';
import { GeoAnalysis } from '@/types/analysis';

import useMapStore from '@/stores/useMapStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

// Mock explicit external dependencies
jest.mock('@/api/analysis.api');
jest.mock('@/stores/useMapStore');
jest.mock('@/stores/useAnalyticsStore');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useMapController', () => {
  const mockGeoJSONData: HexGeoJSONData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'hex-1',
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
        properties: { color: '#ff0000', hex_id: 'H1', biomass: 120.5 },
      },
    ],
  };

  const mockLegendData: LegendData[] = [{ color: '#ff0000', label: '100-150 kg' }];

  const mockGridMap: GridMap = {
    id: 'map-111',
    location: 'Madagascar Grid',
    coords: [-20, 45],
    hex_geojson: mockGeoJSONData,
    legend: mockLegendData,
  };

  const mockGeoAnalysis: Partial<GeoAnalysis> = {
    id: 'analysis-999',
    location: 'Madagascar Grid',
    h3_grid_map_id: 'map-111',
    coordinates: {
      type: 'Point',
      coordinates: [45, -20], // [lng, lat]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default pristine state assignments for the slice records
    useMapStore.setState({
      maps: {},
      activeMapId: null,
      addMap: jest.fn(),
      getOwnerAnalysis: jest.fn().mockReturnValue(undefined),
    });

    useAnalyticsStore.setState({
      analyses: {},
    });
  });

  // ========== INITIALIZATION AND HOOK OUTPUTS ==========
  describe('Initialization and Hook Outputs', () => {
    it('should present null fields if there is no active map ID selected', () => {
      useMapStore.setState({ maps: {}, activeMapId: null });

      const { result } = renderHook(() => useMapController(), { wrapper: AlertProvider });

      expect(result.current.map).toBeNull();
      expect(result.current.coords).toBeNull();
      expect(result.current.location).toBeNull();
      expect(result.current.legend).toBeNull();
    });

    it('should cleanly pull and expose values from the active map object if it exists in the store collection', () => {
      useMapStore.setState({
        maps: { 'map-111': mockGridMap },
        activeMapId: 'map-111',
      });

      const { result } = renderHook(() => useMapController(), { wrapper: AlertProvider });

      expect(result.current.map).toEqual(mockGeoJSONData);
      expect(result.current.coords).toEqual([-20, 45]);
      expect(result.current.location).toBe('Madagascar Grid');
      expect(result.current.legend).toEqual(mockLegendData);
    });
  });

  // ========== FETCH GEOANALYSIS MAP AUTOMATED TRIGGERS ==========
  describe('fetchGeoAnalysisMap automated triggers via useEffect', () => {
    it('should immediately bail out if activeMapId is null or missing', async () => {
      useMapStore.setState({ activeMapId: null });

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      expect(AnalysisAPI.getMap).not.toHaveBeenCalled();
    });

    it('should skip requesting data from the backend if the map layer data is already loaded in the state records', async () => {
      useMapStore.setState({
        maps: { 'map-111': mockGridMap },
        activeMapId: 'map-111',
      });

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      expect(AnalysisAPI.getMap).not.toHaveBeenCalled();
    });

    it('should successfully fetch map configuration parameters and insert them into the store records with mapped coordinates', async () => {
      const mockAddMap = jest.fn();
      const mockGetOwnerAnalysis = jest.fn().mockReturnValue(mockGeoAnalysis);

      useMapStore.setState({
        maps: {}, // Empty maps so it attempts to load
        activeMapId: 'map-111',
        addMap: mockAddMap,
        getOwnerAnalysis: mockGetOwnerAnalysis,
      });

      (AnalysisAPI.getMap as jest.Mock).mockResolvedValue(mockGridMap);

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(AnalysisAPI.getMap).toHaveBeenCalledWith('map-111');
      });

      // Validates owner analysis mapping coordinates flipping from GeoJSON [Long, Lat] to Map [Lat, Long]
      expect(mockGetOwnerAnalysis).toHaveBeenCalledWith('map-111');
      expect(mockAddMap).toHaveBeenCalledWith({
        id: 'map-111',
        location: 'Madagascar Grid',
        coords: [-20, 45], 
        hex_geojson: mockGeoJSONData,
        legend: mockLegendData,
      });
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('should fall back to safe zero-coordinates and empty strings if no owning analysis model correlates with the key', async () => {
      const mockAddMap = jest.fn();
      const mockGetOwnerAnalysis = jest.fn().mockReturnValue(undefined); // No structural parent analysis found

      useMapStore.setState({
        maps: {},
        activeMapId: 'map-111',
        addMap: mockAddMap,
        getOwnerAnalysis: mockGetOwnerAnalysis,
      });

      (AnalysisAPI.getMap as jest.Mock).mockResolvedValue(mockGridMap);

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(AnalysisAPI.getMap).toHaveBeenCalled();
      });

      expect(mockAddMap).toHaveBeenCalledWith({
        id: 'map-111',
        location: '',
        coords: [0, 0],
        hex_geojson: mockGeoJSONData,
        legend: mockLegendData,
      });
    });

    it('should trigger an alert error dialogue when API payloads resolve as null structural elements', async () => {
      const mockAddMap = jest.fn();
      useMapStore.setState({
        maps: {},
        activeMapId: 'map-111',
        addMap: mockAddMap,
        getOwnerAnalysis: jest.fn().mockReturnValue(undefined),
      });

      (AnalysisAPI.getMap as jest.Mock).mockResolvedValue(null);

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(AnalysisAPI.getMap).toHaveBeenCalled();
      });

      expect(mockAddMap).not.toHaveBeenCalled();
      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to retrieve map. Please try again later.');
    });

    it('should capture thrown exceptions or server timeouts gracefully via visual contextual warnings', async () => {
      useMapStore.setState({
        maps: {},
        activeMapId: 'map-111',
        getOwnerAnalysis: jest.fn().mockReturnValue(undefined),
      });

      (AnalysisAPI.getMap as jest.Mock).mockRejectedValue(new Error('Gateway Timeout 504'));

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to retrieve map. Please try again later.');
      });
    });
  });
});
