import useMapStore from "@/stores/useMapStore";
import { useEffect, useContext, useCallback } from "react";
import { AlertContext } from "@/contexts/alertContext";
import { AnalysisAPI } from "@/api/analysis.api";
import { MapData } from "@/types/map";

export const useMapController = () => {
    const map = useMapStore((state) => state.map);
    const coords = useMapStore((state) => state.coords); 
    const location = useMapStore((state) => state.location);
    const legend = useMapStore((state) => state.legend);

    const setMap = useMapStore((state) => state.setMap);
    const setLegend = useMapStore((state) => state.setLegend);
    const currentMapId = useMapStore((state) => state.id);

    const { showAlert } = useContext(AlertContext);

    const fetchGeoAnalysisMap = useCallback(async () => {
        if (!currentMapId) return;

        try {
            const oldMap: MapData = await AnalysisAPI.getMap(currentMapId);
            if (!oldMap) throw new Error("No map data received");

            setMap(oldMap.hex_geojson);
            setLegend(oldMap.legend);
        } catch (err: any) {
            console.error("Error fetching geo-analysis map:", err);
            showAlert(false, "Failed to retrieve map. Please try again later.");
        }
    }, [currentMapId, setMap, setLegend, showAlert]);

    useEffect(() => {
        fetchGeoAnalysisMap();
    }, [currentMapId, fetchGeoAnalysisMap]);

    return {
        map,
        coords,
        location,
        legend
    }
};
