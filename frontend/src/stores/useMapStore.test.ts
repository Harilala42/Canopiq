import useMapStore from './useMapStore';
import { HexGeoJSONData, GeoJSONFeature, LegendData } from '@/types/map';

describe('useMapStore', () => {
  // Mock data
  const mockHexFeature1: GeoJSONFeature = {
    type: 'Feature',
    id: 'hex-1',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    },
    properties: {
      color: '#2ca02c',
      hex_id: 'hex-1',
      biomass: 45.5,
    },
  };

  const mockHexFeature2: GeoJSONFeature = {
    type: 'Feature',
    id: 'hex-2',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [1, 0],
          [2, 0],
          [2, 1],
          [1, 1],
          [1, 0],
        ],
      ],
    },
    properties: {
      color: '#d62728',
      hex_id: 'hex-2',
      biomass: 52.3,
    },
  };

  const mockGeoJSONData: HexGeoJSONData = {
    type: 'FeatureCollection',
    features: [mockHexFeature1, mockHexFeature2],
  };

  const mockCoords: [number, number] = [51.505, -0.09];

  const mockLegendData: LegendData[] = [
    { color: '#2ca02c', range: '0-30 tons/ha' },
    { color: '#1f77b4', range: '30-60 tons/ha' },
    { color: '#d62728', range: '60+ tons/ha' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store state before each test
    useMapStore.setState({
      location: null,
      map: null,
      coords: null,
      legend: null,
    });
  });

  // ========== INITIAL STATE TESTS ==========
  describe('Initial state', () => {
    it('should have correct initial state values', () => {
      useMapStore.setState({
        location: null,
        map: null,
        coords: null,
        legend: null,
      });

      const state = useMapStore.getState();
      expect(state.location).toBeNull();
      expect(state.map).toBeNull();
      expect(state.coords).toBeNull();
      expect(state.legend).toBeNull();
    });
  });

  // ========== SETMAP TESTS ==========
  describe('setMap', () => {
    it('should set map data', () => {
      useMapStore.getState().setMap(mockGeoJSONData);
      expect(useMapStore.getState().map).toEqual(mockGeoJSONData);
    });

    it('should set map with correct feature collection structure', () => {
      useMapStore.getState().setMap(mockGeoJSONData);
      const map = useMapStore.getState().map;

      expect(map?.type).toBe('FeatureCollection');
      expect(map?.features).toHaveLength(2);
      expect(map?.features[0].id).toBe('hex-1');
      expect(map?.features[1].id).toBe('hex-2');
    });

    it('should replace existing map data', () => {
      useMapStore.getState().setMap(mockGeoJSONData);
      expect(useMapStore.getState().map?.features).toHaveLength(2);

      const newMapData: HexGeoJSONData = {
        type: 'FeatureCollection',
        features: [mockHexFeature1],
      };

      useMapStore.getState().setMap(newMapData);
      expect(useMapStore.getState().map?.features).toHaveLength(1);
      expect(useMapStore.getState().map?.features[0].id).toBe('hex-1');
    });

    it('should preserve other state properties when setting map', () => {
      useMapStore.getState().setLocation('London');
      useMapStore.getState().setCoords(mockCoords);

      useMapStore.getState().setMap(mockGeoJSONData);

      expect(useMapStore.getState().location).toBe('London');
      expect(useMapStore.getState().coords).toEqual(mockCoords);
      expect(useMapStore.getState().map).toEqual(mockGeoJSONData);
    });

    it('should handle map with empty features array', () => {
      const emptyMapData: HexGeoJSONData = {
        type: 'FeatureCollection',
        features: [],
      };

      useMapStore.getState().setMap(emptyMapData);
      expect(useMapStore.getState().map?.features).toHaveLength(0);
    });
  });

  // ========== SETCOORDS TESTS ==========
  describe('setCoords', () => {
    it('should set coordinates', () => {
      useMapStore.getState().setCoords(mockCoords);
      expect(useMapStore.getState().coords).toEqual(mockCoords);
    });

    it('should set valid latitude and longitude', () => {
      const coords: [number, number] = [40.7128, -74.006];
      useMapStore.getState().setCoords(coords);

      const stored = useMapStore.getState().coords;
      expect(stored?.[0]).toBe(40.7128); // latitude
      expect(stored?.[1]).toBe(-74.006); // longitude
    });

    it('should replace existing coordinates', () => {
      useMapStore.getState().setCoords([10, 20]);
      expect(useMapStore.getState().coords).toEqual([10, 20]);

      useMapStore.getState().setCoords([30, 40]);
      expect(useMapStore.getState().coords).toEqual([30, 40]);
    });

    it('should handle negative coordinates', () => {
      const negativeCoords: [number, number] = [-51.505, -0.09];
      useMapStore.getState().setCoords(negativeCoords);
      expect(useMapStore.getState().coords).toEqual(negativeCoords);
    });

    it('should preserve other state properties when setting coords', () => {
      useMapStore.getState().setLocation('Paris');
      useMapStore.getState().setMap(mockGeoJSONData);

      useMapStore.getState().setCoords(mockCoords);

      expect(useMapStore.getState().location).toBe('Paris');
      expect(useMapStore.getState().map).toEqual(mockGeoJSONData);
      expect(useMapStore.getState().coords).toEqual(mockCoords);
    });
  });

  // ========== SETLOCATION TESTS ==========
  describe('setLocation', () => {
    it('should set location string', () => {
      useMapStore.getState().setLocation('London, UK');
      expect(useMapStore.getState().location).toBe('London, UK');
    });

    it('should handle different location formats', () => {
      const locations = [
        'London',
        'London, UK',
        'City: London, Country: United Kingdom',
        '51.5074° N, 0.1278° W',
      ];

      locations.forEach((loc) => {
        useMapStore.getState().setLocation(loc);
        expect(useMapStore.getState().location).toBe(loc);
      });
    });

    it('should replace existing location', () => {
      useMapStore.getState().setLocation('London');
      expect(useMapStore.getState().location).toBe('London');

      useMapStore.getState().setLocation('Paris');
      expect(useMapStore.getState().location).toBe('Paris');
    });

    it('should handle empty location string', () => {
      useMapStore.getState().setLocation('');
      expect(useMapStore.getState().location).toBe('');
    });

    it('should preserve other state properties when setting location', () => {
      useMapStore.getState().setCoords(mockCoords);
      useMapStore.getState().setMap(mockGeoJSONData);

      useMapStore.getState().setLocation('Test Location');

      expect(useMapStore.getState().coords).toEqual(mockCoords);
      expect(useMapStore.getState().map).toEqual(mockGeoJSONData);
      expect(useMapStore.getState().location).toBe('Test Location');
    });
  });

  // ========== SETLEGEND TESTS ==========
  describe('setLegend', () => {
    it('should set legend data', () => {
      useMapStore.getState().setLegend(mockLegendData);
      expect(useMapStore.getState().legend).toEqual(mockLegendData);
      expect(useMapStore.getState().legend).toHaveLength(3);
    });

    it('should set legend with correct structure', () => {
      useMapStore.getState().setLegend(mockLegendData);
      const legend = useMapStore.getState().legend;

      expect(legend?.[0].color).toBe('#2ca02c');
      expect(legend?.[0].range).toBe('0-30 tons/ha');
      expect(legend?.[1].color).toBe('#1f77b4');
      expect(legend?.[2].color).toBe('#d62728');
    });

    it('should replace existing legend', () => {
      useMapStore.getState().setLegend(mockLegendData);
      expect(useMapStore.getState().legend).toHaveLength(3);

      const newLegend: LegendData[] = [
        { color: '#ff0000', range: 'High' },
        { color: '#0000ff', range: 'Low' },
      ];

      useMapStore.getState().setLegend(newLegend);
      expect(useMapStore.getState().legend).toHaveLength(2);
      expect(useMapStore.getState().legend).toEqual(newLegend);
    });

    it('should handle single legend item', () => {
      const singleLegend: LegendData[] = [{ color: '#00ff00', range: '0-100' }];
      useMapStore.getState().setLegend(singleLegend);

      expect(useMapStore.getState().legend).toHaveLength(1);
      expect(useMapStore.getState().legend?.[0].color).toBe('#00ff00');
    });

    it('should handle empty legend array', () => {
      useMapStore.getState().setLegend(mockLegendData);
      useMapStore.getState().setLegend([]);

      expect(useMapStore.getState().legend).toEqual([]);
      expect(useMapStore.getState().legend).toHaveLength(0);
    });

    it('should preserve other state properties when setting legend', () => {
      useMapStore.getState().setMap(mockGeoJSONData);
      useMapStore.getState().setCoords(mockCoords);

      useMapStore.getState().setLegend(mockLegendData);

      expect(useMapStore.getState().map).toEqual(mockGeoJSONData);
      expect(useMapStore.getState().coords).toEqual(mockCoords);
      expect(useMapStore.getState().legend).toEqual(mockLegendData);
    });
  });

  // ========== CLEARMAP TESTS ==========
  describe('clearMap', () => {
    it('should clear all map-related data', () => {
      // Setup state with all data
      useMapStore.getState().setMap(mockGeoJSONData);
      useMapStore.getState().setCoords(mockCoords);
      useMapStore.getState().setLocation('London');
      useMapStore.getState().setLegend(mockLegendData);

      // Verify data is set
      expect(useMapStore.getState().map).not.toBeNull();
      expect(useMapStore.getState().coords).not.toBeNull();
      expect(useMapStore.getState().location).not.toBeNull();
      expect(useMapStore.getState().legend).not.toBeNull();

      // Clear
      useMapStore.getState().clearMap();

      // Verify all cleared
      expect(useMapStore.getState().map).toBeNull();
      expect(useMapStore.getState().coords).toBeNull();
      expect(useMapStore.getState().location).toBeNull();
      expect(useMapStore.getState().legend).toBeNull();
    });

    it('should handle clear when state is already empty', () => {
      expect(useMapStore.getState().map).toBeNull();
      expect(useMapStore.getState().coords).toBeNull();

      useMapStore.getState().clearMap();

      expect(useMapStore.getState().map).toBeNull();
      expect(useMapStore.getState().coords).toBeNull();
    });

    it('should clear map while preserving nothing (all properties cleared)', () => {
      useMapStore.getState().setMap(mockGeoJSONData);
      useMapStore.getState().clearMap();

      const state = useMapStore.getState();
      expect(state.map).toBeNull();
      expect(state.coords).toBeNull();
      expect(state.location).toBeNull();
      expect(state.legend).toBeNull();
    });
  });

  // ========== INTEGRATION TESTS ==========
  describe('Integration scenarios', () => {
    it('should handle complete map setup flow', () => {
      useMapStore.getState().setLocation('Amazon Rainforest');
      useMapStore.getState().setCoords([-3.4653, -62.2159]);
      useMapStore.getState().setMap(mockGeoJSONData);
      useMapStore.getState().setLegend(mockLegendData);

      const state = useMapStore.getState();
      expect(state.location).toBe('Amazon Rainforest');
      expect(state.coords).toEqual([-3.4653, -62.2159]);
      expect(state.map?.features).toHaveLength(2);
      expect(state.legend).toHaveLength(3);
    });

    it('should handle multiple updates then clear', () => {
      // First location
      useMapStore.getState().setLocation('London');
      useMapStore.getState().setCoords([51.5074, -0.1278]);
      useMapStore.getState().setMap(mockGeoJSONData);

      expect(useMapStore.getState().location).toBe('London');

      // Clear
      useMapStore.getState().clearMap();
      expect(useMapStore.getState().location).toBeNull();
      expect(useMapStore.getState().coords).toBeNull();

      // Second location
      useMapStore.getState().setLocation('Paris');
      useMapStore.getState().setCoords([48.8566, 2.3522]);
      useMapStore.getState().setMap(mockGeoJSONData);

      expect(useMapStore.getState().location).toBe('Paris');
      expect(useMapStore.getState().coords).toEqual([48.8566, 2.3522]);
    });

    it('should handle partial updates after setup', () => {
      // Initial setup
      useMapStore.getState().setLocation('Berlin');
      useMapStore.getState().setCoords([52.52, 13.405]);
      useMapStore.getState().setMap(mockGeoJSONData);
      useMapStore.getState().setLegend(mockLegendData);

      // Update location only
      useMapStore.getState().setLocation('Munich');

      // Verify only location changed
      expect(useMapStore.getState().location).toBe('Munich');
      expect(useMapStore.getState().coords).toEqual([52.52, 13.405]);
      expect(useMapStore.getState().map?.features).toHaveLength(2);
      expect(useMapStore.getState().legend).toHaveLength(3);
    });

    it('should handle replacing all data sequentially', () => {
      const newMapData: HexGeoJSONData = {
        type: 'FeatureCollection',
        features: [mockHexFeature1],
      };

      const newLegend: LegendData[] = [{ color: '#ff0000', range: 'Test' }];

      // Initial setup
      useMapStore.getState().setLocation('Location1');
      useMapStore.getState().setCoords([0, 0]);
      useMapStore.getState().setMap(mockGeoJSONData);
      useMapStore.getState().setLegend(mockLegendData);

      // Replace each property
      useMapStore.getState().setLocation('Location2');
      useMapStore.getState().setCoords([10, 20]);
      useMapStore.getState().setMap(newMapData);
      useMapStore.getState().setLegend(newLegend);

      // Verify all replaced
      expect(useMapStore.getState().location).toBe('Location2');
      expect(useMapStore.getState().coords).toEqual([10, 20]);
      expect(useMapStore.getState().map?.features).toHaveLength(1);
      expect(useMapStore.getState().legend).toHaveLength(1);
    });

    it('should maintain data consistency through multiple operations', () => {
      const coords1: [number, number] = [1, 1];
      const coords2: [number, number] = [2, 2];

      useMapStore.getState().setCoords(coords1);
      expect(useMapStore.getState().coords).toEqual(coords1);

      useMapStore.getState().setMap(mockGeoJSONData);
      expect(useMapStore.getState().coords).toEqual(coords1); // unchanged

      useMapStore.getState().setCoords(coords2);
      expect(useMapStore.getState().map?.features).toHaveLength(2); // unchanged

      useMapStore.getState().setLocation('Test');
      expect(useMapStore.getState().coords).toEqual(coords2);
      expect(useMapStore.getState().map?.features).toHaveLength(2);

      useMapStore.getState().clearMap();
      expect(useMapStore.getState().coords).toBeNull();
      expect(useMapStore.getState().map).toBeNull();
      expect(useMapStore.getState().location).toBeNull();
    });
  });
});
