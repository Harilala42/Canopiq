import useMapStore from "@/stores/useMapStore";
import useChatStore from "@/stores/useChatStore";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { useEffect, useContext, useCallback } from "react";
import { AlertContext } from "@/contexts/alertContext";
import { AnalysisAPI } from "@/api/analysis.api";

export const useMapController = () => {
    const map = useMapStore((state) => state.map);
    const coords = useMapStore((state) => state.coords); 
    const location = useMapStore((state) => state.location);
    const geoAnalysisId = useAnalyticsStore((state) => state.geo_analysis_id);
    const setMap = useMapStore((state) => state.setMap);

    const currentQuery = useChatStore((state) => state.currentQuery);

    const { showAlert } = useContext(AlertContext);

    const fetchGeoAnalysisMap = useCallback(async () => {
        if (!currentQuery?.id || !geoAnalysisId) return;

        try {
            const oldMap = await AnalysisAPI.getMap(currentQuery.id, geoAnalysisId);
            if (!oldMap?.data) throw new Error("No map data received");

            setMap(oldMap.data);
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
        location
    }
};
