import { renderHook } from '@testing-library/react';
import { useChartDonutController } from './useChartDonutController';
import { LandCoverData } from '@/types/analysis';

import useAnalyticsStore from '@/stores/useAnalyticsStore';

jest.mock('@/stores/useAnalyticsStore');

describe('useChartDonutController - donutData useMemo', () => {
  const mockBaseLandCover: LandCoverData = {
    legend: 'Land Cover Legend',
    description: 'Satellite analytical observations',
    source: 'Copernicus Sentinel Data',
    unit: '%',
    categories: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format Chart.js dataset structure directly when all categories sit above the 2% threshold', () => {
    // 1. Setup mock store state where everything stays above the 2% filter baseline
    useAnalyticsStore.setState({
      land_cover: {
        ...mockBaseLandCover,
        categories: [
          { category: 'Dense Forest', percent: 65, color: '#006400' },
          { category: 'Grasslands', percent: 25, color: '#7CFC00' },
          { category: 'Water Bodies', percent: 10, color: '#0000FF' },
        ],
      },
    });

    const { result } = renderHook(() => useChartDonutController('light'));

    // 2. Validate clean 1-to-1 conversion pipeline layout maps correctly
    expect(result.current.donutData.labels).toEqual(['Dense Forest', 'Grasslands', 'Water Bodies']);
    expect(result.current.donutData.datasets[0].data).toEqual([65, 25, 10]);
    expect(result.current.donutData.datasets[0].backgroundColor).toEqual(['#006400', '#7CFC00', '#0000FF']);
    expect(result.current.donutData.datasets[0].borderWidth).toBe(0);
  });

  it('should intercept categories falling below 2% and compress them into an aggregated "Others" bucket', () => {
    // Setup state where minor values are present (1.5% and 0.5% = 2% total)
    useAnalyticsStore.setState({
      land_cover: {
        ...mockBaseLandCover,
        categories: [
          { category: 'Dense Forest', percent: 70, color: '#006400' },
          { category: 'Urban Infrastructure', percent: 28, color: '#808080' },
          { category: 'Shrubland', percent: 1.5, color: '#E2A76F' }, // Sub-threshold
          { category: 'Barren Soil', percent: 0.5, color: '#D2B48C' },  // Sub-threshold
        ],
      },
    });

    const { result } = renderHook(() => useChartDonutController('light'));

    // Validate that sub-threshold items are collapsed down successfully
    expect(result.current.donutData.labels).toEqual(['Dense Forest', 'Urban Infrastructure', 'Others']);
    expect(result.current.donutData.datasets[0].data).toEqual([70, 28, 2]); // 1.5 + 0.5 = 2
    expect(result.current.donutData.datasets[0].backgroundColor).toEqual(['#006400', '#808080', '#7A728F']); // Uses fallback gray color
  });

  it('should round the aggregated "Others" sum percentage computation properly', () => {
    // Setup state where decimal components aggregate together (1.2% + 1.4% = 2.6%)
    useAnalyticsStore.setState({
      land_cover: {
        ...mockBaseLandCover,
        categories: [
          { category: 'Wetlands', percent: 97.4, color: '#40E0D0' },
          { category: 'Mangroves', percent: 1.2, color: '#2E8B57' }, // Sub-threshold
          { category: 'Beaches', percent: 1.4, color: '#F5DEB3' },   // Sub-threshold
        ],
      },
    });

    const { result } = renderHook(() => useChartDonutController('light'));

    // Check that Math.round(2.6) outputs 3 exactly
    expect(result.current.donutData.labels).not.toContain('Mangroves');
    expect(result.current.donutData.labels).toContain('Others');
    expect(result.current.donutData.datasets[0].data).toEqual([97.4, 3]);
  });

  it('should adapt option color tokens on theme variant mutations dynamically', () => {
    useAnalyticsStore.setState({
      land_cover: {
        ...mockBaseLandCover,
        categories: [{ category: 'Forest', percent: 100, color: '#000' }],
      },
    });

    // Test Light Theme settings
    const { result: lightResult, rerender } = renderHook(
      ({ theme }) => useChartDonutController(theme),
      { initialProps: { theme: 'light' } }
    );
    expect(lightResult.current.options.plugins?.legend?.labels?.color).toBe('#1a1535');

    // Re-render and change props parameter cleanly to enforce Dark Theme settings
    rerender({ theme: 'dark' });
    expect(lightResult.current.options.plugins?.legend?.labels?.color).toBe('#cecbf6');
  });
});
