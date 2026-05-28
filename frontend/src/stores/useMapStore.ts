import { create } from 'zustand';
import { HexGeoJSONData } from '@/types/map';

interface MapState
{
    map: HexGeoJSONData | null;
    coords: [number, number] | null;
    location: string | null;

    setMap: (map: HexGeoJSONData) => void;
    setCoords: (coords: [number, number]) => void;
    setLocation: (location: string) => void;
    clearMap: () => void;
}

const useMapStore = create<MapState>((set) => ({
    map: null,
    coords: null,
    location: null,

    setMap: (map) => set({ map }),

    setCoords: (coords) => set({ coords }),

    setLocation: (location) => set({ location }),

    clearMap: () => set({ 
        map: null, 
        coords: null,
        location: null
    })
}));

export default useMapStore;
