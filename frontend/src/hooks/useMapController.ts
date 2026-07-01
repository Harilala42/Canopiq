import useMapStore from '@/stores/useMapStore';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { useEffect, useContext, useCallback } from 'react';
import { AlertContext } from '@/contexts/alertContext';
import { AnalysisAPI } from '@/api/analysis.api';
import { GridMap } from '@/types/map';

export const useMapController = () => {
    const maps = useMapStore((state) => state.maps);
    const addMap = useMapStore((state) => state.addMap);
    const getOwnerAnalysis = useMapStore((state) => state.getOwnerAnalysis);
    const activeMapId = useMapStore((state) => state.activeMapId);
    const activeMap = activeMapId ? maps[activeMapId] : null;

    const analyses = useAnalyticsStore((state) => state.analyses);

    const { showAlert } = useContext(AlertContext);

    const fetchGeoAnalysisMap = useCallback(async () => {
        if (!activeMapId || maps[activeMapId]) return;
        const owningAnalysis = getOwnerAnalysis(activeMapId);

        try {
            const mapData: GridMap = await AnalysisAPI.getMap(activeMapId);
            if (!mapData) throw new Error("No map data received");

            addMap({
                id: activeMapId,
                location: owningAnalysis?.location ?? "",
                coords: owningAnalysis
                    ? [
                        owningAnalysis.coordinates.coordinates[1],
                        owningAnalysis.coordinates.coordinates[0],
                      ]
                    : [0, 0],
                hex_geojson: mapData.hex_geojson,
                legend: mapData.legend,
            });
        } catch (err: any) {
            console.error("Error fetching geo-analysis map:", err);
            showAlert(false, "Failed to retrieve map. Please try again later.");
        }
    }, [activeMapId, maps, analyses, addMap, showAlert]);

    useEffect(() => {
        fetchGeoAnalysisMap();
    }, [activeMapId, fetchGeoAnalysisMap]);

    return {
        map: activeMap?.hex_geojson ?? null,
        coords: activeMap?.coords ?? null,
        location: activeMap?.location ?? null,
        legend: activeMap?.legend ?? null,
    };
};
