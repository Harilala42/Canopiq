import { renderHook, act, waitFor } from '@testing-library/react';
import { useMapController } from './useMapController';
import { AnalysisAPI } from '@/api/analysis.api';
import { MapData } from '@/types/map';
import { ChatData } from '@/types/chat';

import useMapStore from '@/stores/useMapStore';
import useChatStore from '@/stores/useChatStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

jest.mock('@/api/analysis.api');
jest.mock('@/stores/useMapStore');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useAnalyticsStore');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useMapController', () => {
  const mockMapData: MapData = {
    hex_geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'hex-1',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          },
          properties: { color: '#ff0000', hex_id: 'H1', biomass: 120.5 },
        },
      ],
    },
    legend: [{ color: '#ff0000', range: '100-150 kg' }],
  };

  const mockActiveQuery: ChatData = {
    id: 'query-999',
    title: 'Biomass Analysis Run',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useMapStore.setState({
      map: null,
      coords: [0, 0],
      location: 'Default Location',
      legend: [],
    });
    useChatStore.setState({ currentQuery: null });
    useAnalyticsStore.setState({ geo_analysis_id: null });
  });

  // ========== INITIALIZATION AND HOOK OUTPUTS ==========
  it('should initialize and cleanly present default map layer state parameters', () => {
    useMapStore.setState({
      map: mockMapData.hex_geojson,
      coords: [-20, 45],
      location: 'Madagascar Grid',
      legend: mockMapData.legend,
    });

    const { result } = renderHook(() => useMapController(), { wrapper: AlertProvider });

    expect(result.current.map).toEqual(mockMapData.hex_geojson);
    expect(result.current.coords).toEqual([-20, 45]);
    expect(result.current.location).toBe('Madagascar Grid');
    expect(result.current.legend).toEqual(mockMapData.legend);
  });

  // ========== FETCHGEOANALYSISMAP AUTOMATED CORNERSTONE TESTS ==========
  describe('fetchGeoAnalysisMap automated triggers via useEffect', () => {
    it('should immediately bail out if missing currentQuery execution baseline context', async () => {
      // Setup geo_analysis_id but keep query null
      useAnalyticsStore.setState({ geo_analysis_id: 'geo-analysis-111' });

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      expect(AnalysisAPI.getMap).not.toHaveBeenCalled();
    });

    it('should immediately bail out if missing an active geo_analysis_id token', async () => {
      // Setup query context but keep analysis context null
      useChatStore.setState({ currentQuery: mockActiveQuery });

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      expect(AnalysisAPI.getMap).not.toHaveBeenCalled();
    });

    it('should seamlessly parse map data payload and broadcast records down to map store parameters on structural alignment', async () => {
      // Arrange dependencies to pass execution guard filters
      useChatStore.setState({ currentQuery: mockActiveQuery });
      useAnalyticsStore.setState({ geo_analysis_id: 'geo-analysis-111' });

      // Mock resolved value from analysis api boundary
      (AnalysisAPI.getMap as jest.Mock).mockResolvedValue(mockMapData);

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      // 1. Verify API requested parameters accurately matching reactive inputs
      await waitFor(() => {
        expect(AnalysisAPI.getMap).toHaveBeenCalledWith('query-999', 'geo-analysis-111');
      });

      // 2. Access the custom state tracker layers on your MapStore structure
      const mapStoreActions = useMapStore.getState();
      expect(mapStoreActions.setLegend).toHaveBeenCalledWith(mockMapData.legend);
      expect(mapStoreActions.setMap).toHaveBeenCalledWith(mockMapData.hex_geojson);
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('should throw an operational exception error up to fallback banners if API sends corrupted or empty data packages', async () => {
      useChatStore.setState({ currentQuery: mockActiveQuery });
      useAnalyticsStore.setState({ geo_analysis_id: 'geo-analysis-111' });

      // API resolves but yields an empty result profile
      (AnalysisAPI.getMap as jest.Mock).mockResolvedValue(null);

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(AnalysisAPI.getMap).toHaveBeenCalled();
      });

      // Assert the store is protected and an alert notification error triggers instead
      const mapStoreActions = useMapStore.getState();
      expect(mapStoreActions.setMap).not.toHaveBeenCalled();
      expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to retrieve map. Please try again later.');
    });

    it('should handle unhandled reject crashes at the server layer and prompt notification alert layout', async () => {
      useChatStore.setState({ currentQuery: mockActiveQuery });
      useAnalyticsStore.setState({ geo_analysis_id: 'geo-analysis-111' });

      // Network level severe failure mock
      (AnalysisAPI.getMap as jest.Mock).mockRejectedValue(new Error('Internal Server Error 500'));

      renderHook(() => useMapController(), { wrapper: AlertProvider });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to retrieve map. Please try again later.');
      });
    });
  });
});
