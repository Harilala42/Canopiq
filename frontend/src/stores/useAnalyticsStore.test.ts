import useAnalyticsStore from './useAnalyticsStore';
import { 
  TimeSeriesData, 
  RangeTimesData, 
  DatasetMetaData, 
  LandCoverData, 
  BiomeData, 
  datasetType 
} from '@/types/analysis';

describe('useAnalyticsStore', () => {
  // Mock data
  const mockDatasetMetaData = {
    legend: 'Carbon Density',
    description: 'Forest carbon density in tons per hectare',
    source: 'NASA',
    unit: 'tons/ha',
  };

  const mockDataset: DatasetMetaData = {
    ...mockDatasetMetaData,
    type: 'carbon_density',
  };

  const mockRangeTimes: RangeTimesData = {
    start: 2015,
    end: 2023,
  };

  const mockTimeSeriesData: TimeSeriesData[] = [
    { year: '2015', value: 45.5, color: '#1f77b4', normalized: 0.5 },
    { year: '2018', value: 48.2, color: '#1f77b4', normalized: 0.7 },
    { year: '2023', value: 52.1, color: '#1f77b4', normalized: 1.0 },
  ];

  const mockBiomeData: BiomeData[] = [
    { category: 'Forest', percent: 65, color: '#2ca02c' },
    { category: 'Grassland', percent: 25, color: '#d62728' },
    { category: 'Water', percent: 10, color: '#1f77b4' },
  ];

  const mockLandCoverMetaData = {
    legend: 'Land Cover Types',
    description: 'Distribution of land cover types in the area',
    source: 'ESA',
    unit: 'percentage',
  };

  const mockLandCover: LandCoverData = {
    ...mockLandCoverMetaData,
    categories: mockBiomeData,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state before each test
    useAnalyticsStore.setState({
      isChartOpen: false,
      dataset: null,
      range_times: null,
      geo_analysis_id: null,
      area_coverage: 0,
      global_average: 0,
      total_change: 0,
      dataset_time_series: [],
      land_cover: null,
    });
  });

  // ========== INITIAL STATE TESTS ==========
  describe('Initial state', () => {
    it('should have correct initial state values', () => {
      useAnalyticsStore.setState({
        isChartOpen: false,
        dataset: null,
        range_times: null,
        geo_analysis_id: null,
        area_coverage: 0,
        global_average: 0,
        total_change: 0,
        dataset_time_series: [],
        land_cover: null,
      });

      const state = useAnalyticsStore.getState();
      expect(state.isChartOpen).toBe(false);
      expect(state.dataset).toBeNull();
      expect(state.range_times).toBeNull();
      expect(state.geo_analysis_id).toBeNull();
      expect(state.area_coverage).toBe(0);
      expect(state.global_average).toBe(0);
      expect(state.total_change).toBe(0);
      expect(state.dataset_time_series).toEqual([]);
      expect(state.land_cover).toBeNull();
    });
  });

  // ========== CHART STATE TESTS ==========
  describe('Chart state management', () => {
    it('openChart should set isChartOpen to true', () => {
      useAnalyticsStore.getState().openChart();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(true);
    });

    it('closeChart should set isChartOpen to false', () => {
      useAnalyticsStore.getState().openChart();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(true);

      useAnalyticsStore.getState().closeChart();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(false);
    });

    it('toggleIsChartOpen should toggle the state', () => {
      expect(useAnalyticsStore.getState().isChartOpen).toBe(false);

      useAnalyticsStore.getState().toggleIsChartOpen();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(true);

      useAnalyticsStore.getState().toggleIsChartOpen();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(false);
    });

    it('toggleIsChartOpen should work multiple times', () => {
      for (let i = 0; i < 5; i++) {
        useAnalyticsStore.getState().toggleIsChartOpen();
      }
      expect(useAnalyticsStore.getState().isChartOpen).toBe(true);

      for (let i = 0; i < 5; i++) {
        useAnalyticsStore.getState().toggleIsChartOpen();
      }
      expect(useAnalyticsStore.getState().isChartOpen).toBe(false);
    });
  });

  // ========== SIMPLE SETTERS TESTS ==========
  describe('Simple setters', () => {
    it('setGeoAnalysisId should set geo_analysis_id', () => {
      useAnalyticsStore.getState().setGeoAnalysisId('analysis-123');
      expect(useAnalyticsStore.getState().geo_analysis_id).toBe('analysis-123');
    });

    it('setAreaCoverage should set area_coverage', () => {
      useAnalyticsStore.getState().setAreaCoverage(150.5);
      expect(useAnalyticsStore.getState().area_coverage).toBe(150.5);
    });

    it('setGlobalAverage should set global_average', () => {
      useAnalyticsStore.getState().setGlobalAverage(42.3);
      expect(useAnalyticsStore.getState().global_average).toBe(42.3);
    });

    it('setTotalChange should set total_change', () => {
      useAnalyticsStore.getState().setTotalChange(12.5);
      expect(useAnalyticsStore.getState().total_change).toBe(12.5);
    });

    it('setDatasetTimeSeries should set dataset_time_series array', () => {
      useAnalyticsStore.getState().setDatasetTimeSeries(mockTimeSeriesData);
      expect(useAnalyticsStore.getState().dataset_time_series).toEqual(mockTimeSeriesData);
      expect(useAnalyticsStore.getState().dataset_time_series).toHaveLength(3);
    });

    it('setDatasetTimeSeries should handle empty array', () => {
      useAnalyticsStore.getState().setDatasetTimeSeries(mockTimeSeriesData);
      expect(useAnalyticsStore.getState().dataset_time_series).toHaveLength(3);

      useAnalyticsStore.getState().setDatasetTimeSeries([]);
      expect(useAnalyticsStore.getState().dataset_time_series).toEqual([]);
    });
  });

  // ========== COMPLEX SETTERS TESTS ==========
  describe('Complex setters', () => {
    it('setDataset should merge type with dataset metadata', () => {
      useAnalyticsStore.getState().setDataset('carbon_density', mockDatasetMetaData as any);
      const dataset = useAnalyticsStore.getState().dataset;

      expect(dataset).toEqual(mockDataset);
      expect(dataset?.type).toBe('carbon_density');
      expect(dataset?.legend).toBe('Carbon Density');
    });

    it('setDataset should handle different dataset types', () => {
      const types: datasetType[] = ['carbon_density', 'tree_cover'];

      types.forEach((type) => {
        useAnalyticsStore.getState().setDataset(type, mockDatasetMetaData as any);
        expect(useAnalyticsStore.getState().dataset?.type).toBe(type);
      });
    });

    it('setRangeTimes should create range_times object', () => {
      useAnalyticsStore.getState().setRangeTimes(2015, 2023);
      const rangeTimes = useAnalyticsStore.getState().range_times;

      expect(rangeTimes).toEqual({ start: 2015, end: 2023 });
      expect(rangeTimes?.start).toBe(2015);
      expect(rangeTimes?.end).toBe(2023);
    });

    it('setRangeTimes should handle different year ranges', () => {
      useAnalyticsStore.getState().setRangeTimes(2000, 2024);
      expect(useAnalyticsStore.getState().range_times).toEqual({ start: 2000, end: 2024 });

      useAnalyticsStore.getState().setRangeTimes(2020, 2021);
      expect(useAnalyticsStore.getState().range_times).toEqual({ start: 2020, end: 2021 });
    });

    it('setLandCover should merge metadata with categories', () => {
      useAnalyticsStore.getState().setLandCover(mockLandCoverMetaData as any, mockBiomeData);
      const landCover = useAnalyticsStore.getState().land_cover;

      expect(landCover).toEqual(mockLandCover);
      expect(landCover?.categories).toHaveLength(3);
      expect(landCover?.legend).toBe('Land Cover Types');
    });

    it('setLandCover should handle different category counts', () => {
      const singleCategory: BiomeData[] = [{ category: 'Forest', percent: 100, color: '#2ca02c' }];

      useAnalyticsStore.getState().setLandCover(mockLandCoverMetaData as any, singleCategory);
      expect(useAnalyticsStore.getState().land_cover?.categories).toHaveLength(1);

      useAnalyticsStore.getState().setLandCover(mockLandCoverMetaData as any, mockBiomeData);
      expect(useAnalyticsStore.getState().land_cover?.categories).toHaveLength(3);
    });
  });

  // ========== SETANALYTICSDATA TESTS ==========
  describe('setAnalyticsData (partial updates)', () => {
    it('should update single property', () => {
      useAnalyticsStore.getState().setAnalyticsData({ area_coverage: 200 });
      expect(useAnalyticsStore.getState().area_coverage).toBe(200);
    });

    it('should update multiple properties without losing others', () => {
      useAnalyticsStore.getState().setAnalyticsData({
        area_coverage: 150,
        global_average: 45,
      });

      expect(useAnalyticsStore.getState().area_coverage).toBe(150);
      expect(useAnalyticsStore.getState().global_average).toBe(45);
      expect(useAnalyticsStore.getState().total_change).toBe(0); // unchanged
    });

    it('should preserve non-updated properties', () => {
      useAnalyticsStore.getState().setDataset('carbon_density', mockDatasetMetaData as any);
      useAnalyticsStore.getState().setAreaCoverage(100);

      useAnalyticsStore.getState().setAnalyticsData({ global_average: 50 });

      expect(useAnalyticsStore.getState().dataset).toEqual(mockDataset);
      expect(useAnalyticsStore.getState().area_coverage).toBe(100);
      expect(useAnalyticsStore.getState().global_average).toBe(50);
    });

    it('should handle empty partial update', () => {
      useAnalyticsStore.getState().setAreaCoverage(100);
      useAnalyticsStore.getState().setAnalyticsData({});

      expect(useAnalyticsStore.getState().area_coverage).toBe(100);
    });

    it('should merge complex objects correctly', () => {
      useAnalyticsStore.getState().setAnalyticsData({
        dataset: mockDataset,
        range_times: mockRangeTimes,
        area_coverage: 200,
      });

      expect(useAnalyticsStore.getState().dataset).toEqual(mockDataset);
      expect(useAnalyticsStore.getState().range_times).toEqual(mockRangeTimes);
      expect(useAnalyticsStore.getState().area_coverage).toBe(200);
    });
  });

  // ========== RESETANALYTICSDATA TESTS ==========
  describe('resetAnalyticsData', () => {
    it('should reset all analytics properties to initial state', () => {
      // Setup state with data
      useAnalyticsStore.getState().setGeoAnalysisId('analysis-123');
      useAnalyticsStore.getState().setDataset('carbon_density', mockDatasetMetaData as any);
      useAnalyticsStore.getState().setRangeTimes(2015, 2023);
      useAnalyticsStore.getState().setAreaCoverage(150);
      useAnalyticsStore.getState().setGlobalAverage(45);
      useAnalyticsStore.getState().setTotalChange(12);
      useAnalyticsStore.getState().setDatasetTimeSeries(mockTimeSeriesData);
      useAnalyticsStore.getState().setLandCover(mockLandCoverMetaData as any, mockBiomeData);

      // Verify data is set
      expect(useAnalyticsStore.getState().geo_analysis_id).toBe('analysis-123');
      expect(useAnalyticsStore.getState().dataset).not.toBeNull();

      // Reset
      useAnalyticsStore.getState().resetAnalyticsData();

      // Verify all reset
      expect(useAnalyticsStore.getState().dataset).toBeNull();
      expect(useAnalyticsStore.getState().range_times).toBeNull();
      expect(useAnalyticsStore.getState().land_cover).toBeNull();
      expect(useAnalyticsStore.getState().area_coverage).toBe(0);
      expect(useAnalyticsStore.getState().global_average).toBe(0);
      expect(useAnalyticsStore.getState().total_change).toBe(0);
      expect(useAnalyticsStore.getState().dataset_time_series).toEqual([]);
      expect(useAnalyticsStore.getState().geo_analysis_id).toBeNull();
    });

    it('should not affect chart open state', () => {
      useAnalyticsStore.getState().openChart();
      useAnalyticsStore.getState().setAreaCoverage(150);

      useAnalyticsStore.getState().resetAnalyticsData();

      expect(useAnalyticsStore.getState().isChartOpen).toBe(true);
      expect(useAnalyticsStore.getState().area_coverage).toBe(0);
    });

    it('should handle reset when state is already empty', () => {
      useAnalyticsStore.getState().resetAnalyticsData();

      expect(useAnalyticsStore.getState().dataset).toBeNull();
      expect(useAnalyticsStore.getState().area_coverage).toBe(0);
    });
  });

  // ========== INTEGRATION TESTS ==========
  describe('Integration scenarios', () => {
    it('should handle complete analysis data workflow', () => {
      // Initialize
      useAnalyticsStore.getState().openChart();
      useAnalyticsStore.getState().setGeoAnalysisId('geo-001');

      // Set dataset information
      useAnalyticsStore.getState().setDataset('carbon_density', mockDatasetMetaData as any);
      useAnalyticsStore.getState().setRangeTimes(2015, 2023);

      // Set analysis metrics
      useAnalyticsStore.getState().setAreaCoverage(250.5);
      useAnalyticsStore.getState().setGlobalAverage(48.2);
      useAnalyticsStore.getState().setTotalChange(15.3);

      // Set visualizations
      useAnalyticsStore.getState().setDatasetTimeSeries(mockTimeSeriesData);
      useAnalyticsStore.getState().setLandCover(mockLandCoverMetaData as any, mockBiomeData);

      // Verify all data
      const state = useAnalyticsStore.getState();
      expect(state.isChartOpen).toBe(true);
      expect(state.geo_analysis_id).toBe('geo-001');
      expect(state.dataset?.type).toBe('carbon_density');
      expect(state.range_times).toEqual({ start: 2015, end: 2023 });
      expect(state.area_coverage).toBe(250.5);
      expect(state.dataset_time_series).toHaveLength(3);
      expect(state.land_cover?.categories).toHaveLength(3);

      // Reset
      useAnalyticsStore.getState().resetAnalyticsData();
      expect(useAnalyticsStore.getState().geo_analysis_id).toBeNull();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(true); // chart state preserved
    });

    it('should handle updating dataset and metrics independently', () => {
      useAnalyticsStore.getState().setDataset('carbon_density', mockDatasetMetaData as any);
      useAnalyticsStore.getState().setAreaCoverage(100);

      // Update metrics only
      useAnalyticsStore.getState().setAnalyticsData({
        area_coverage: 200,
        global_average: 50,
      });

      expect(useAnalyticsStore.getState().dataset?.type).toBe('carbon_density');
      expect(useAnalyticsStore.getState().area_coverage).toBe(200);
      expect(useAnalyticsStore.getState().global_average).toBe(50);

      // Change dataset
      useAnalyticsStore.getState().setDataset('tree_cover', {
        ...mockDatasetMetaData,
        legend: 'Tree Cover',
      } as any);

      expect(useAnalyticsStore.getState().dataset?.type).toBe('tree_cover');
      expect(useAnalyticsStore.getState().area_coverage).toBe(200); // metrics unchanged
    });

    it('should handle multiple chart toggles with data persistence', () => {
      useAnalyticsStore.getState().setAreaCoverage(150);
      useAnalyticsStore.getState().openChart();

      expect(useAnalyticsStore.getState().isChartOpen).toBe(true);
      expect(useAnalyticsStore.getState().area_coverage).toBe(150);

      useAnalyticsStore.getState().toggleIsChartOpen();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(false);
      expect(useAnalyticsStore.getState().area_coverage).toBe(150); // data persists

      useAnalyticsStore.getState().toggleIsChartOpen();
      expect(useAnalyticsStore.getState().isChartOpen).toBe(true);
      expect(useAnalyticsStore.getState().area_coverage).toBe(150);
    });

    it('should handle sequential dataset changes', () => {
      // First dataset
      useAnalyticsStore.getState().setDataset('carbon_density', mockDatasetMetaData as any);
      expect(useAnalyticsStore.getState().dataset?.type).toBe('carbon_density');

      // Second dataset
      useAnalyticsStore.getState().setDataset('tree_cover', {
        ...mockDatasetMetaData,
        legend: 'Tree Cover',
        description: 'Forest tree cover percentage',
      } as any);

      expect(useAnalyticsStore.getState().dataset?.type).toBe('tree_cover');
      expect(useAnalyticsStore.getState().dataset?.legend).toBe('Tree Cover');
      expect(useAnalyticsStore.getState().dataset?.description).toBe('Forest tree cover percentage');
    });
  });
});
