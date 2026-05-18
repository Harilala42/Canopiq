import { useEffect } from "react";
import { MapData } from "@/types/map";
import { supabase } from "@/utils/supabase.utils";
import { DatasetMetaData, LandCoverData, BiomeData } from "@/types/analysis";
import useAnalyticsStore from "@/stores/useAnalyticsStore";

export const useGeoAnalysisSubscription = (chatId?: string) => {
    const setAnalyticsData = useAnalyticsStore((state) => state.setAnalyticsData);

    useEffect(() => {
        if (!chatId) return;

        const channel = supabase
            .channel(`geo_analysis-${chatId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "geo_analysis",
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload: any) => {
                    const {
                        location,
                        dataset,
                        tile_layer_url,
                        center_point,
                        start_year,
                        end_year,
                        analytics,
                    } = payload.new;

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
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, setAnalyticsData]);
};
