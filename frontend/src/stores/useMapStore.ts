import { create } from 'zustand';
import { HexGeoJSONData, LegendData } from '@/types/map';

interface MapState
{
    location: string | null;
    map: HexGeoJSONData | null;
    coords: [number, number] | null;
    legend: LegendData[] | null;

    setMap: (map: HexGeoJSONData) => void;
    setCoords: (coords: [number, number]) => void;
    setLocation: (location: string) => void;
    setLegend: (legend: LegendData[]) => void;
    clearMap: () => void;
}

const useMapStore = create<MapState>((set) => ({
    map: null,
    coords: null,
    location: null,
    legend: null,

    setMap: (map) => set({ map }),

    setCoords: (coords) => set({ coords }),

    setLocation: (location) => set({ location }),

    setLegend: (legend) => set({ legend }),

    clearMap: () => set({ 
        map: null, 
        coords: null,
        location: null,
        legend: null
    })
}));

export default useMapStore;
