import useMapStore from "@/stores/useMapStore";
import useChatStore from "@/stores/useChatStore";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { useCallback, useEffect, useContext, useState } from "react";
import { AlertContext } from '@/contexts/alertContext';
import { supabase } from "@/utils/supabase.utils";
import { AnalysisAPI } from "@/api/analysis.api";

export const useChartController = () => {
	const setDataset = useAnalyticsStore((state) => state.setDataset);
	const setLandUse = useAnalyticsStore((state) => state.setLandUse);
	const setAnalyticsData = useAnalyticsStore((state) => state.setAnalyticsData);
	const resetAnalyticsData = useAnalyticsStore((state) => state.resetAnalyticsData);

	const location = useMapStore((state) => state.location);
	const setLocation = useMapStore((state) => state.setLocation);
	const setCoords = useMapStore((state) => state.setCoords);
	const setMapId = useMapStore((state) => state.setId);
	const clearMap = useMapStore((state) => state.clearMap);

	const isOpen = useAnalyticsStore((state) => state.isChartOpen);
	const openChart = useAnalyticsStore((state) => state.openChart);
	const closeChart = useAnalyticsStore((state) => state.closeChart);
	const onToggle = useAnalyticsStore((state) => state.toggleIsChartOpen);

    const currentQuery = useChatStore((state) => state.currentQuery);

	const [isFetching, setIsFetching] = useState<boolean>(true);
    const { showAlert } = useContext(AlertContext);

	const applyAnalysisData = useCallback((data: any) => {
		const {
			id,
			location,
			coordinates,
			start_year,
			end_year,
			analytics,
			h3_grid_map_id
		} = data;

		setLocation(location);

		setCoords([
			coordinates.coordinates[1],
			coordinates.coordinates[0],
		]);

		setMapId(h3_grid_map_id);

		setDataset(analytics.insights);

		setLandUse(analytics.land_use_distribution);

		setAnalyticsData({
			geo_analysis_id: id,
			range_times: {
				start: new Date(start_year).getFullYear(),
				end: new Date(end_year).getFullYear(),
			},
			area_coverage: analytics.stats.area_coverage_ha,
			global_average: analytics.stats.global_average,
			total_change: analytics.stats.total_change_percent
		});
	}, [
		setLocation,
		setCoords,
		setDataset,
		setLandUse,
		setAnalyticsData
	]);

	const fetchGeoAnalysisData = useCallback(async () => {
		if (!currentQuery?.id) return;

		setIsFetching(true);
		try {
			const oldAnalysis = await AnalysisAPI.getAll(currentQuery.id);
			if (!oldAnalysis?.geo_analysis || oldAnalysis.geo_analysis.length === 0) {
				isOpen && closeChart();
				resetAnalyticsData();
				return;
			}

			clearMap();
			!isOpen && openChart();
			applyAnalysisData(oldAnalysis.geo_analysis[0]);
		} catch (err: any) {
			resetAnalyticsData();
			console.error("Failed to retrieve insight:", err.message);
			showAlert(false, "Failed to retrieve insight. Please try again later.");
		} finally {
			setIsFetching(false);
		}
	}, [
		currentQuery?.id, 
		resetAnalyticsData,
		openChart,
		closeChart,
		clearMap,
		showAlert
	]);

	useEffect(() => {
		fetchGeoAnalysisData();
	}, [fetchGeoAnalysisData])

	useEffect(() => {
		if (!currentQuery?.id) return;

		const channel = supabase
            .channel(`geo_analysis-${currentQuery.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "geo_analysis",
                    filter: `chat_id=eq.${currentQuery.id}`,
                },
                (payload: any) => {
					clearMap();
					openChart();
                    applyAnalysisData(payload.new);
                }
            )
            .subscribe();

		return () => {
            supabase.removeChannel(channel);
        };
	}, [currentQuery?.id, openChart, clearMap]);

	return {
        isOpen,
        onToggle,
		isFetching,
		location
	};
};
