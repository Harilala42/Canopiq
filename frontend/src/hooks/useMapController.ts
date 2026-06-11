import useMapStore from "@/stores/useMapStore";
import useChatStore from "@/stores/useChatStore";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { useEffect, useContext, useCallback } from "react";
import { AlertContext } from "@/contexts/alertContext";
import { AnalysisAPI } from "@/api/analysis.api";
import { fetchWithRetry } from "@/utils/utils";
import { MapData } from "@/types/map";

export const useMapController = () => {
    const map = useMapStore((state) => state.map);
    const coords = useMapStore((state) => state.coords); 
    const location = useMapStore((state) => state.location);
    const legend = useMapStore((state) => state.legend);

    const setMap = useMapStore((state) => state.setMap);
    const setLegend = useMapStore((state) => state.setLegend);
    const geoAnalysisId = useAnalyticsStore((state) => state.geo_analysis_id);

    const currentQuery = useChatStore((state) => state.currentQuery);

    const { showAlert } = useContext(AlertContext);

    const fetchGeoAnalysisMap = useCallback(async () => {
        if (!currentQuery?.id || !geoAnalysisId) return;

        try {
            const oldMap: MapData = await fetchWithRetry(
                () => AnalysisAPI.getMap(currentQuery.id!, geoAnalysisId)
            )
            if (!oldMap) throw new Error("No map data received");

            setLegend(oldMap.legend);
            setMap(oldMap.hex_geojson);
        } catch (err: any) {
            console.error("Error fetching geo-analysis map:", err);
            showAlert(false, "Failed to retrieve map. Please try again later.");
        }
    }, [geoAnalysisId, setMap, showAlert]);

    useEffect(() => {
        fetchGeoAnalysisMap();
    }, [geoAnalysisId, fetchGeoAnalysisMap]);

    return {
        map,
        coords,
        location,
        legend
    }
};
