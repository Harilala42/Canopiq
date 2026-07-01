import { create } from 'zustand';
import { GridMap } from '@/types/map';
import { GeoAnalysis } from '@/types/analysis';
import useAnalyticsStore from '@/stores/useAnalyticsStore';

interface MapState
{
    activeMapId: string | null;
    maps: Record<string, GridMap>;

    addMap: (map: GridMap) => void;
    setActiveMap: (id: string) => void;
    getOwnerAnalysis: (mapId: string) => GeoAnalysis;
    clearMap: (id?: string) => void;
}

const useMapStore = create<MapState>((set) => ({
    maps: {},
    activeMapId: null,

    addMap: (map) => set((state) => ({ 
        maps: { ...state.maps, [map.id]: map }, 
        activeMapId: map.id 
    })),

    setActiveMap: (id) => set({ activeMapId: id }),

    getOwnerAnalysis: (mapId) => {
        const { analyses } = useAnalyticsStore.getState();

        return Object.values(analyses).find(
            (a) => a.h3_grid_map_id === mapId
        );
    },

    clearMap: (id) =>
        set((state) => {
            if (!id) return { maps: {}, activeMapId: null };

            const { [id]: _, ...rest } = state.maps;
            return { 
                maps: rest, 
                activeMapId: state.activeMapId === id ? null : state.activeMapId 
            };
        }),
}));

export default useMapStore;
