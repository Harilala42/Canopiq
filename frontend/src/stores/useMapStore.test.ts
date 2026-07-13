import useMapStore from './useMapStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { GridMap, HexProperties, LegendData } from '@/types/map';
import { GeoAnalysis } from '@/types/analysis';

// Mock the cross-store dependency
jest.mock('@/stores/useAnalyticsStore');

describe('useMapStore', () => {
  const mockH3Cells: HexProperties[] = [
    { color: '#2ca02c', hex_id: 'hex-1', percent: 45.5 },
  ];

  const mockLegendData: LegendData[] = [
    { color: '#2ca02c', label: '0-30 tons/ha' },
  ];

  // Complete GridMap entities
  const mockMap1: GridMap = {
    id: 'map-1',
    location: 'Singapore',
    coords: [1.35, 103.82],
    h3_cells: mockH3Cells,
    legend: mockLegendData,
  };

  const mockMap2: GridMap = {
    id: 'map-2',
    location: 'Amazon Rainforest',
    coords: [-3.46, -62.21],
    h3_cells: mockH3Cells,
    legend: mockLegendData,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state to match updated interface specifications
    useMapStore.setState({
      maps: {},
      activeMapId: null,
    });
  });

  // ========== INITIAL STATE TESTS ==========
  describe('Initial state', () => {
    it('should initialize with an empty maps record and null activeMapId', () => {
      const state = useMapStore.getState();
      expect(state.maps).toEqual({});
      expect(state.activeMapId).toBeNull();
    });
  });

  // ========== ADDMAP TESTS ==========
  describe('addMap', () => {
    it('should add a new map to the record using its id and automatically make it active', () => {
      useMapStore.getState().addMap(mockMap1);

      const state = useMapStore.getState();
      expect(state.maps['map-1']).toEqual(mockMap1);
      expect(state.activeMapId).toBe('map-1');
    });

    it('should preserve existing items when adding supplementary map instances', () => {
      useMapStore.getState().addMap(mockMap1);
      useMapStore.getState().addMap(mockMap2);

      const state = useMapStore.getState();
      expect(Object.keys(state.maps)).toHaveLength(2);
      expect(state.maps['map-1']).toBeDefined();
      expect(state.maps['map-2']).toBeDefined();
      expect(state.activeMapId).toBe('map-2'); // Latest map should become active
    });
  });

  // ========== SETACTIVEMAP TESTS ==========
  describe('setActiveMap', () => {
    it('should set the activeMapId reference', () => {
      useMapStore.setState({ maps: { 'map-1': mockMap1, 'map-2': mockMap2 } });
      
      useMapStore.getState().setActiveMap('map-2');
      expect(useMapStore.getState().activeMapId).toBe('map-2');
    });
  });

  // ========== GETOWNERANALYSIS TESTS ==========
  describe('getOwnerAnalysis', () => {
    it('should select and return the parent GeoAnalysis matching the cross-store key connection', () => {
      const mockAnalysis: Partial<GeoAnalysis> = {
        id: 'analysis-xyz',
        h3_grid_map_id: 'map-1',
        location: 'Singapore',
      };

      // Mock output of useAnalyticsStore.getState()
      (useAnalyticsStore.getState as jest.Mock).mockReturnValue({
        analyses: { 'analysis-xyz': mockAnalysis },
      });

      const result = useMapStore.getState().getOwnerAnalysis('map-1');
      expect(result).toEqual(mockAnalysis);
    });

    it('should return undefined if no associated analytics item corresponds to the mapId', () => {
      (useAnalyticsStore.getState as jest.Mock).mockReturnValue({
        analyses: {},
      });

      const result = useMapStore.getState().getOwnerAnalysis('map-999');
      expect(result).toBeUndefined();
    });
  });

  // ========== CLEARMAP TESTS ==========
  describe('clearMap', () => {
    it('should wipe out all maps and nullify active selection when called without arguments', () => {
      useMapStore.setState({
        maps: { 'map-1': mockMap1, 'map-2': mockMap2 },
        activeMapId: 'map-1',
      });

      useMapStore.getState().clearMap();

      const state = useMapStore.getState();
      expect(state.maps).toEqual({});
      expect(state.activeMapId).toBeNull();
    });

    it('should remove a specified map by id and leave other records untouched', () => {
      useMapStore.setState({
        maps: { 'map-1': mockMap1, 'map-2': mockMap2 },
        activeMapId: 'map-2',
      });

      useMapStore.getState().clearMap('map-1');

      const state = useMapStore.getState();
      expect(state.maps['map-1']).toBeUndefined();
      expect(state.maps['map-2']).toBeDefined();
      expect(state.activeMapId).toBe('map-2'); // Active selection should remain unchanged
    });

    it('should nullify activeMapId if the explicitly targeted map parameter was currently active', () => {
      useMapStore.setState({
        maps: { 'map-1': mockMap1, 'map-2': mockMap2 },
        activeMapId: 'map-1',
      });

      useMapStore.getState().clearMap('map-1');

      const state = useMapStore.getState();
      expect(state.activeMapId).toBeNull();
    });
  });

  // ========== INTEGRATION TESTS ==========
  describe('Integration scenarios', () => {
    it('should maintain data state safety across dynamic data additions and removals', () => {
      // Step 1: Add Map
      useMapStore.getState().addMap(mockMap1);
      expect(useMapStore.getState().activeMapId).toBe('map-1');

      // Step 2: Add secondary Map
      useMapStore.getState().addMap(mockMap2);
      expect(useMapStore.getState().activeMapId).toBe('map-2');

      // Step 3: Switch active target selection manually
      useMapStore.getState().setActiveMap('map-1');
      expect(useMapStore.getState().activeMapId).toBe('map-1');

      // Step 4: Drop non-active variant tracking
      useMapStore.getState().clearMap('map-2');
      expect(useMapStore.getState().maps['map-2']).toBeUndefined();
      expect(useMapStore.getState().activeMapId).toBe('map-1'); // Stays active

      // Step 5: Wipe state completely
      useMapStore.getState().clearMap();
      expect(useMapStore.getState().maps).toEqual({});
      expect(useMapStore.getState().activeMapId).toBeNull();
    });
  });
});
