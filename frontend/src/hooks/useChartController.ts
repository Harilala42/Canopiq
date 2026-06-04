import useMapStore from "@/stores/useMapStore";
import useChatStore from "@/stores/useChatStore";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { useCallback, useEffect, useContext, useState } from "react";
import { AlertContext } from '@/contexts/alertContext';
import { supabase } from "@/utils/supabase.utils";
import { AnalysisAPI } from "@/api/analysis.api";
import { BiomeData } from "@/types/analysis";

export const useChartController = () => {
	const setDataset = useAnalyticsStore((state) => state.setDataset);
	const setLandCover = useAnalyticsStore((state) => state.setLandCover);
	const setAnalyticsData = useAnalyticsStore((state) => state.setAnalyticsData);
	const resetAnalyticsData = useAnalyticsStore((state) => state.resetAnalyticsData);

	const location = useMapStore((state) => state.location);
	const setLocation = useMapStore((state) => state.setLocation);
	const setCoords = useMapStore((state) => state.setCoords);
	const clearMap = useMapStore((state) => state.clearMap);

	const isOpen = useAnalyticsStore((state) => state.isChartOpen);
	const openChart = useAnalyticsStore((state) => state.openChart);
	const closeChart = useAnalyticsStore((state) => state.closeChart);
	const onToggle = useAnalyticsStore((state) => state.toggleIsChartOpen);

    const currentQuery = useChatStore((state) => state.currentQuery);

	const [isLoading, setIsLoading] = useState(true);
    const { showAlert } = useContext(AlertContext);

	const applyAnalysisData = useCallback((data: any) => {
		const {
			id,
			location,
			dataset,
			center_point,
			start_year,
			end_year,
			analytics,
		} = data;

		setLocation(location);

		setCoords([
			center_point.coordinates[1],
			center_point.coordinates[0],
		]);

		setDataset(dataset, analytics.insights.metadata);

		setLandCover(
			analytics.land_cover.metadata,
			Object.entries(analytics.land_cover.distribution).map(
				([category, value]: any) => ({
					category,
					color: value.color,
					percent: value.percent,
				})
			) as BiomeData[]
		);

		setAnalyticsData({
			geo_analysis_id: id,
			range_times: {
				start: new Date(start_year).getFullYear(),
				end: new Date(end_year).getFullYear(),
			},
			area_coverage: analytics.stats.area_coverage_ha,
			global_average: analytics.stats.global_average,
			total_change: analytics.stats.total_change_percent,
			dataset_time_series: analytics.insights.time_series,
		});
	}, [
		setLocation,
		setCoords,
		setDataset,
		setLandCover,
		setAnalyticsData
	]);

	const fetchGeoAnalysisData = useCallback(async () => {
		setIsLoading(true);
		try {
			const oldAnalysis = await AnalysisAPI.getAll(currentQuery.id);
			if (!oldAnalysis?.data || oldAnalysis.data.length === 0) {
				isOpen && closeChart();
				resetAnalyticsData();
				return;
			}

			clearMap();
			!isOpen && openChart();
			applyAnalysisData(oldAnalysis.data[oldAnalysis.data.length - 1]);
		} catch (err: any) {
			resetAnalyticsData();
			console.error("Failed to retrieve insight:", err.message);
			showAlert(false, "Failed to retrieve insight. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	}, [currentQuery?.id, resetAnalyticsData, showAlert]);

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

		fetchGeoAnalysisData();

		return () => {
            supabase.removeChannel(channel);
        };
	}, [currentQuery?.id, fetchGeoAnalysisData]);

	return {
        isOpen,
        onToggle,
		isLoading,
		location
	};
};
