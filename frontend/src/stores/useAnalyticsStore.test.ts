import useAnalyticsStore from './useAnalyticsStore';
import { GeoAnalysis } from '@/types/analysis';

describe('useAnalyticsStore', () => {
  // Mock data setup matching the updated GeoAnalysis PostGIS geometry shape
  const mockAnalysis1: GeoAnalysis = {
    id: 'analysis-1',
    location: 'Singapore',
    dataset: 'carbon_density',
    bbox: {
      type: 'Polygon',
      coordinates: [[[103.8, 1.3], [103.9, 1.3], [103.9, 1.4], [103.8, 1.4], [103.8, 1.3]]]
    },
    coordinates: {
      type: 'Point',
      coordinates: [103.82, 1.35], // [lng, lat]
    },
    h3_grid_map_id: 'map-123',
    start_year: '2018',
    end_year: '2022',
    analytics: {
      stats: { global_average: 13.5, area_coverage_ha: 477300, total_change_percent: 10.2 },
      insights: [],
      metadata: {
        kind: 'time_series',
        type: 'carbon_density',
        unit: 'tC/ha',
        legend: 'Carbon Density',
        source: 'WCMC Biomass Carbon Density',
        description: 'Analysis from 2018 to 2022',
      },
    },
  };

  const mockAnalysis2: GeoAnalysis = {
    id: 'analysis-2',
    location: 'Amazon Rainforest',
    dataset: 'tree_cover',
    bbox: {
      type: 'Polygon',
      coordinates: [[[-62.3, -3.5], [-62.1, -3.5], [-62.1, -3.4], [-62.3, -3.4], [-62.3, -3.5]]]
    },
    coordinates: {
      type: 'Point',
      coordinates: [-62.21, -3.46], // [lng, lat]
    },
    h3_grid_map_id: 'map-456',
    start_year: '2020',
    end_year: '2026',
    analytics: {
      stats: { global_average: 85.2, area_coverage_ha: 5000000, total_change_percent: -2.4 },
      insights: [],
      metadata: {
        kind: 'time_series',
        type: 'tree_cover',
        unit: '%',
        legend: 'Tree Cover',
        source: 'Hansen Global Forest Change',
        description: 'Deforestation tracking',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state before each test execution
    useAnalyticsStore.setState({
      analyses: {},
      activeAnalysis: null,
    });
  });

  // ========== SETANALYSES TESTS ==========
  describe('setAnalyses', () => {
    it('should transform an array of analyses into a Record object mapped by id', () => {
      useAnalyticsStore.getState().setAnalyses([mockAnalysis1, mockAnalysis2]);

      const state = useAnalyticsStore.getState();
      expect(state.analyses).toEqual({
        'analysis-1': mockAnalysis1,
        'analysis-2': mockAnalysis2,
      });
    });

    it('should replace existing elements in the analyses record', () => {
      useAnalyticsStore.getState().setAnalyses([mockAnalysis1]);
      expect(Object.keys(useAnalyticsStore.getState().analyses)).toHaveLength(1);

      useAnalyticsStore.getState().setAnalyses([mockAnalysis2]);
      const state = useAnalyticsStore.getState();
      expect(Object.keys(state.analyses)).toHaveLength(1);
      expect(state.analyses['analysis-2']).toBeDefined();
      expect(state.analyses['analysis-1']).toBeUndefined();
    });

    it('should handle an empty array gracefully', () => {
      useAnalyticsStore.getState().setAnalyses([mockAnalysis1]);
      useAnalyticsStore.getState().setAnalyses([]);

      expect(useAnalyticsStore.getState().analyses).toEqual({});
    });
  });

  // ========== SETACTIVEANALYSIS TESTS ==========
  describe('setActiveAnalysis', () => {
    it('should set the active analysis reference', () => {
      useAnalyticsStore.getState().setActiveAnalysis(mockAnalysis1);
      expect(useAnalyticsStore.getState().activeAnalysis).toEqual(mockAnalysis1);
    });

    it('should overwrite the existing active analysis target', () => {
      useAnalyticsStore.getState().setActiveAnalysis(mockAnalysis1);
      useAnalyticsStore.getState().setActiveAnalysis(mockAnalysis2);

      expect(useAnalyticsStore.getState().activeAnalysis).toEqual(mockAnalysis2);
    });
  });

  // ========== ADDANALYSIS TESTS ==========
  describe('addAnalysis', () => {
    it('should insert a new item into the record and automatically set it to active', () => {
      useAnalyticsStore.getState().addAnalysis(mockAnalysis1);

      const state = useAnalyticsStore.getState();
      expect(state.analyses['analysis-1']).toEqual(mockAnalysis1);
      expect(state.activeAnalysis).toEqual(mockAnalysis1);
    });

    it('should preserve previously existing records when a new one is appended', () => {
      useAnalyticsStore.getState().addAnalysis(mockAnalysis1);
      useAnalyticsStore.getState().addAnalysis(mockAnalysis2);

      const state = useAnalyticsStore.getState();
      expect(Object.keys(state.analyses)).toHaveLength(2);
      expect(state.activeAnalysis).toEqual(mockAnalysis2); // Latest added becomes active
    });
  });

  // ========== UPDATEANALYSIS TESTS ==========
  describe('updateAnalysis', () => {
    it('should apply partial updates (patch) to a specific record by id', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1 },
      });

      useAnalyticsStore.getState().updateAnalysis('analysis-1', {
        location: 'New Singapore Boundary',
      });

      const updated = useAnalyticsStore.getState().analyses['analysis-1'];
      expect(updated.location).toBe('New Singapore Boundary');
      expect(updated.dataset).toBe(mockAnalysis1.dataset); // Other fields left untouched
    });

    it('should safely handle patches targeting structural sub-properties', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1 },
      });

      const newStats = { global_average: 14.1, area_coverage_ha: 477300, total_change_percent: 11.0 };
      useAnalyticsStore.getState().updateAnalysis('analysis-1', {
        analytics: {
          ...mockAnalysis1.analytics,
          stats: newStats,
        },
      });

      expect(useAnalyticsStore.getState().analyses['analysis-1'].analytics.stats.global_average).toBe(14.1);
    });
  });

  // ========== GETANALYSISBYID TESTS ==========
  describe('getAnalysisById', () => {
    it('should return a filtered array containing the item if matching id is found', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1, 'analysis-2': mockAnalysis2 },
      });

      const result = useAnalyticsStore.getState().getAnalysisById('analysis-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockAnalysis1);
    });

    it('should return an empty array if no matching id is found', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1 },
      });

      const result = useAnalyticsStore.getState().getAnalysisById('non-existent-id');
      expect(result).toEqual([]);
    });
  });

  // ========== REMOVEANALYSIS TESTS ==========
  describe('removeAnalysis', () => {
    it('should delete the target analysis from the analyses record object', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1, 'analysis-2': mockAnalysis2 },
      });

      useAnalyticsStore.getState().removeAnalysis('analysis-1');

      const state = useAnalyticsStore.getState();
      expect(state.analyses['analysis-1']).toBeUndefined();
      expect(state.analyses['analysis-2']).toBeDefined();
    });

    it('should clear activeAnalysis to null if the removed record was currently active', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1 },
        activeAnalysis: mockAnalysis1,
      });

      useAnalyticsStore.getState().removeAnalysis('analysis-1');

      const state = useAnalyticsStore.getState();
      expect(state.activeAnalysis).toBeNull();
    });

    it('should preserve activeAnalysis if a different, inactive record is removed', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1, 'analysis-2': mockAnalysis2 },
        activeAnalysis: mockAnalysis2,
      });

      useAnalyticsStore.getState().removeAnalysis('analysis-1');

      const state = useAnalyticsStore.getState();
      expect(state.activeAnalysis).toEqual(mockAnalysis2);
    });
  });

  // ========== RESETANALYSES TESTS ==========
  describe('resetAnalyses', () => {
    it('should drop all values back to initial empty configurations', () => {
      useAnalyticsStore.setState({
        analyses: { 'analysis-1': mockAnalysis1 },
        activeAnalysis: mockAnalysis1,
      });

      useAnalyticsStore.getState().resetAnalyses();

      const state = useAnalyticsStore.getState();
      expect(state.analyses).toEqual({});
      expect(state.activeAnalysis).toBeNull();
    });
  });
});