import useChatStore from "@/stores/useChatStore";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { BiomeData, DatasetMetaData, LandCoverData } from "@/types/analysis";
import { useCallback, useEffect, useContext, useState } from "react";
import { AlertContext } from '@/contexts/alertContext';
import { AnalysisAPI } from "@/api/analysis.api";
import { MapData } from "@/types/map";

export const useChartController = () => {
    const isOpen = useAnalyticsStore((s) => s.isChartOpen);
	const onToggle = useAnalyticsStore((s) => s.toggleIsChartOpen);
	const setAnalyticsData = useAnalyticsStore((s) => s.setAnalyticsData);
	const resetAnalyticsData = useAnalyticsStore((s) => s.resetAnalyticsData);
	const location = useAnalyticsStore((s) => s.location);

    const currentQuery = useChatStore((s) => s.currentQuery);

	const [isLoading, setIsLoading] = useState(true);
    const { showAlert } = useContext(AlertContext);

	const fetchGeoAnalysisData = useCallback(async () => {
		if (!currentQuery?.id) return;

		setIsLoading(true);

		try {
			const oldAnalysis = await AnalysisAPI.getAll(currentQuery.id);

			if (!oldAnalysis?.data) {
				resetAnalyticsData();
				return;
			}

			const {
				location,
				dataset,
				tile_layer_url,
				center_point,
				start_year,
				end_year,
				analytics,
			} = oldAnalysis.data;

			const newMap: MapData = {
				description: location,
				tileLayer: tile_layer_url,
				coords: [
					center_point.coordinates[1],
					center_point.coordinates[0],
				],
			};

			const newDataset: DatasetMetaData = {
				type: dataset,
				legend: analytics.insights.metadata.legend,
				description: analytics.insights.metadata.description,
				source: analytics.insights.metadata.source,
				unit: analytics.insights.metadata.unit,
			};

			const newLandCover: LandCoverData = {
				legend: analytics.land_cover.metadata.legend,
				description: analytics.land_cover.metadata.description,
				categories: Object.entries(
					analytics.land_cover.distribution
				).map(([category, value]: any) => ({
					category,
					color: value.color,
					percent: value.percent,
				})) as BiomeData[],
				source: analytics.land_cover.metadata.source,
				unit: analytics.land_cover.metadata.unit,
			};

			setAnalyticsData({
				location: newMap,
				dataset: newDataset,
				range_times: {
					start: new Date(start_year).getFullYear(),
					end: new Date(end_year).getFullYear(),
				},
				area_coverage: analytics.stats.area_coverage_ha,
				global_average: analytics.stats.global_average,
				total_change: analytics.stats.total_change_percent,
				dataset_time_series: analytics.insights.time_series,
				land_cover: newLandCover,
			});
		} catch (err: any) {
			resetAnalyticsData();
			console.error("Failed to retrieve insight:", err.message);
			showAlert(false, "Failed to retrieve insight. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	}, [currentQuery?.id, setAnalyticsData, resetAnalyticsData, showAlert]);

	useEffect(() => {
		fetchGeoAnalysisData();
	}, [fetchGeoAnalysisData]);

	return {
        isOpen,
        onToggle,
		isLoading,
		location
	};
};
