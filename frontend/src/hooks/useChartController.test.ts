import { renderHook, waitFor } from '@testing-library/react';
import { useChartController } from './useChartController';
import { AnalysisAPI } from '@/api/analysis.api';
import { ChatData } from '@/types/chat';

import useChatStore from '@/stores/useChatStore';
import useMapStore from '@/stores/useMapStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { AlertProvider, mockShowAlert } from '@/contexts/__mocks__/alertContext';

jest.mock('@/api/analysis.api');
jest.mock('@/stores/useChatStore');
jest.mock('@/stores/useMapStore');
jest.mock('@/stores/useAnalyticsStore');
jest.mock('@/utils/supabase.utils');
jest.mock('@/contexts/alertContext', () => (
  require('@/contexts/__mocks__/alertContext')
));

describe('useChartController - fetchGeoAnalysisData', () => {
  const mockQuery: ChatData = {
    id: 'chat-999',
    title: 'Deforestation Monitoring',
    created_at: '2026-06-04T12:00:00Z',
    is_pinned: false,
  };

  // Mock payload structured exactly to match complex nested application logic
  const mockAnalysisItem = {
    id: 'geo-123',
    location: 'Analamanga Region',
    dataset: 'Hansen GFC',
    center_point: { type: 'Point', coordinates: [47.5, -18.9] }, // [lng, lat]
    start_year: '2020-01-01T00:00:00Z',
    end_year: '2026-01-01T00:00:00Z',
    analytics: {
      insights: {
        metadata: { source: 'UMD' },
        time_series: [10, 12, 15],
      },
      land_cover: {
        metadata: { legend: 'LC' },
        distribution: {
          'Dense Forest': { color: '#006400', percent: 85 },
          'Grassland': { color: '#7CFC00', percent: 15 },
        },
      },
      stats: {
        area_coverage_ha: 50000,
        global_average: 12.4,
        total_change_percent: -4.2,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default pristine store setups
    useChatStore.setState({ currentQuery: null });
    useAnalyticsStore.setState({ isChartOpen: false });
  });

  // ========== EDGE CASE 1: EMPTY RESPONSE ARRAYS ==========
  it('should close the chart view frame and reset store states if backend analysis query yields zero items', async () => {
    useChatStore.setState({ currentQuery: mockQuery });
    useAnalyticsStore.setState({ isChartOpen: true }); // Open by default to see if it closes

    // API returns a successful response structure but with an empty list container
    (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({ data: [] });

    renderHook(() => useChartController(), { wrapper: AlertProvider });

    await waitFor(() => {
      expect(AnalysisAPI.getAll).toHaveBeenCalledWith('chat-999');
    });

    const analyticsStoreActions = useAnalyticsStore.getState();
    expect(analyticsStoreActions.closeChart).toHaveBeenCalled();
    expect(analyticsStoreActions.resetAnalyticsData).toHaveBeenCalled();
    
    const mapStoreActions = useMapStore.getState();
    expect(mapStoreActions.clearMap).not.toHaveBeenCalled(); // Shouldn't map parse if empty
  });

  // ========== EDGE CASE 2: SUCCESSFUL PROCESSING (CHOOSE LATEST RECORD) ==========
  it('should clear old map geometries, parse the latest data item, and update all stores correctly', async () => {
    useChatStore.setState({ currentQuery: mockQuery });
    useAnalyticsStore.setState({ isChartOpen: false });

    // Provide multiple responses to prove your logic picks the LAST array entry: [oldAnalysis, mockAnalysisItem]
    (AnalysisAPI.getAll as jest.Mock).mockResolvedValue({
      data: [{ id: 'geo-old' }, mockAnalysisItem],
    });

    renderHook(() => useChartController(), { wrapper: AlertProvider });

    await waitFor(() => {
      expect(AnalysisAPI.getAll).toHaveBeenCalled();
    });

    // 1. Map Layer Store Assertions
    const mapStoreActions = useMapStore.getState();
    expect(mapStoreActions.clearMap).toHaveBeenCalled();
    expect(mapStoreActions.setLocation).toHaveBeenCalledWith('Analamanga Region');
    // Coords array must correctly flip [lng, lat] from GeoJSON into Leaflet map [lat, lng] format!
    expect(mapStoreActions.setCoords).toHaveBeenCalledWith([-18.9, 47.5]);

    // 2. Analytics Configuration Assertions
    const analyticsStoreActions = useAnalyticsStore.getState();
    expect(analyticsStoreActions.openChart).toHaveBeenCalled();
    expect(analyticsStoreActions.setDataset).toHaveBeenCalledWith('Hansen GFC', { source: 'UMD' });
    
    // Check distribution parsing mapping conversions
    expect(analyticsStoreActions.setLandCover).toHaveBeenCalledWith(
      { legend: 'LC' },
      [
        { category: 'Dense Forest', color: '#006400', percent: 85 },
        { category: 'Grassland', color: '#7CFC00', percent: 15 },
      ]
    );

    // Check complete metrics parsing including the Date extraction loops
    expect(analyticsStoreActions.setAnalyticsData).toHaveBeenCalledWith({
      geo_analysis_id: 'geo-123',
      range_times: { start: 2020, end: 2026 },
      area_coverage: 50000,
      global_average: 12.4,
      total_change: -4.2,
      dataset_time_series: [10, 12, 15],
    });

    expect(mockShowAlert).not.toHaveBeenCalled();
  });

  // ========== EDGE CASE 3: BACKEND API OUTAGES / UNHANDLED REJECTIONS ==========
  it('should reset active store details to default on severe script/server failures and alert user', async () => {
    useChatStore.setState({ currentQuery: mockQuery });
    (AnalysisAPI.getAll as jest.Mock).mockRejectedValue(new Error('Internal Database Timeout Error'));

    const { result } = renderHook(() => useChartController(), { wrapper: AlertProvider });

    await waitFor(() => {
      expect(AnalysisAPI.getAll).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    // Validates that it handles failures gracefully without deadlocking state
    const analyticsStoreActions = useAnalyticsStore.getState();
    expect(analyticsStoreActions.resetAnalyticsData).toHaveBeenCalled();

    // Error communication check
    expect(mockShowAlert).toHaveBeenCalledWith(false, 'Failed to retrieve insight. Please try again later.');
  });
});
