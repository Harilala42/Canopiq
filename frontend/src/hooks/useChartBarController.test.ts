import { renderHook } from '@testing-library/react';
import { useChartBarController } from './useChartBarController';
import { DatasetMetaData, TimeSeriesData } from '@/types/analysis';

import useAnalyticsStore from '@/stores/useAnalyticsStore';

jest.mock('@/stores/useAnalyticsStore');

describe('useChartBarController', () => {
  const mockBaseMetadata: DatasetMetaData = {
    legend: 'Biomass Indicators',
    description: 'Calculated metric tracking indices',
    type: 'tree_cover',
    source: 'Global Forest Watch',
    unit: 'ha',
  };

  const mockTimeSeries: TimeSeriesData[] = [
    { year: '2024', value: 450, color: '#4CAF50', normalized: 0.45 },
    { year: '2025', value: 420, color: '#FF9800', normalized: 0.42 },
    { year: '2026', value: 510, color: '#2196F3', normalized: 0.51 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== BARDATA USEMEMO TESTS ==========
  describe('barData useMemo processing', () => {
    it('should map complex timeseries objects cleanly into valid Chart.js dataset formats', () => {
      // Seed time-series entries into the mocked store state frame
      useAnalyticsStore.setState({
        dataset: mockBaseMetadata,
        dataset_time_series: mockTimeSeries,
      });

      const { result } = renderHook(() => useChartBarController('light'));

      // 1. Verify X-Axis Labels align with chronological years
      expect(result.current.barData.labels).toEqual(['2024', '2025', '2026']);

      // 2. Verify Y-Axis Values array maps explicitly to historical data metrics
      expect(result.current.barData.datasets[0].data).toEqual([450, 420, 510]);

      // 3. Verify color profiles match the backend configurations
      expect(result.current.barData.datasets[0].backgroundColor).toEqual(['#4CAF50', '#FF9800', '#2196F3']);

      // 4. Verify style decorations are set perfectly
      expect(result.current.barData.datasets[0].borderRadius).toBe(5);
      expect(result.current.barData.datasets[0].label).toBe('');
    });

    it('should present empty labels and metrics collections smoothly if timeseries drops to empty array', () => {
      useAnalyticsStore.setState({
        dataset: mockBaseMetadata,
        dataset_time_series: [],
      });

      const { result } = renderHook(() => useChartBarController('light'));

      expect(result.current.barData.labels).toEqual([]);
      expect(result.current.barData.datasets[0].data).toEqual([]);
      expect(result.current.barData.datasets[0].backgroundColor).toEqual([]);
    });
  });

  // ========== FORMATTEDTITLE USEMEMO TESTS ==========
  describe('formattedTitle useMemo transformation', () => {
    it('should convert lower-snake_case enum parameters into capitalized regular text titles', () => {
      useAnalyticsStore.setState({
        dataset: {
          ...mockBaseMetadata,
          type: 'tree_cover',
          unit: 'ha',
        },
        dataset_time_series: mockTimeSeries,
      });

      const { result } = renderHook(() => useChartBarController('light'));

      // Expectation confirms conversion: "tree_cover" -> "Tree Cover" wrapped in template metrics
      expect(result.current.title).toBe('Yearly Tree Cover (ha)');
    });

    it('should handle alternative underscore enums like carbon_density flawlessly', () => {
      useAnalyticsStore.setState({
        dataset: {
          ...mockBaseMetadata,
          type: 'carbon_density',
          unit: 'Mg/ha',
        },
        dataset_time_series: mockTimeSeries,
      });

      const { result } = renderHook(() => useChartBarController('light'));

      // Expectation confirms conversion: "carbon_density" -> "Carbon Density" with unique unit strings
      expect(result.current.title).toBe('Yearly Carbon Density (Mg/ha)');
    });
  });
});
