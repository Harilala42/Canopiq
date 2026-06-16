import { create } from 'zustand';
import { HexGeoJSONData, LegendData } from '@/types/map';

interface MapState
{
    id: string;
    location: string | null;
    map: HexGeoJSONData | null;
    coords: [number, number] | null;
    legend: LegendData[] | null;

    setId: (id: string) => void;
    setMap: (map: HexGeoJSONData) => void;
    setCoords: (coords: [number, number]) => void;
    setLocation: (location: string) => void;
    setLegend: (legend: LegendData[]) => void;
    clearMap: () => void;
}

const useMapStore = create<MapState>((set) => ({
    id: null,
    map: null,
    coords: null,
    location: null,
    legend: null,

    setId: (id) => set({ id }),

    setMap: (map) => set({ map }),

    setCoords: (coords) => set({ coords }),

    setLocation: (location) => set({ location }),

    setLegend: (legend) => set({ legend }),

    clearMap: () => set({ 
        id: null,
        map: null, 
        coords: null,
        location: null,
        legend: null
    })
}));

export default useMapStore;
