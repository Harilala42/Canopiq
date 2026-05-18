import { useMemo } from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import useAnalyticsStore from '@/stores/useAnalyticsStore';

export const useChartBarController = (theme: string) => {
    const datasetMetaData = useAnalyticsStore((state) => state.dataset);
    const datasetTimeSeries = useAnalyticsStore((state) => state.dataset_time_series);
    const isDark = theme === "dark";

    const barData = useMemo<ChartData<"bar", number[], string>>(() => {
        return {
            labels: datasetTimeSeries.map((item) => item.year),
            datasets: [
                {
                    label: "",
                    data: datasetTimeSeries.map((item) => item.value),
                    backgroundColor: datasetTimeSeries.map((item) => item.color),
                    borderRadius: 5,
                }
            ]
        };
    }, [datasetTimeSeries]);

    const chartOptions = useMemo<ChartOptions<"bar">>(() => {
        const tickColor = isDark ? "#cecbf6" : "#1a1535";
        return {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: tickColor },
                    grid: { color: tickColor }
                },
                y: {
                    ticks: { color: tickColor },
                    grid: { color: tickColor }
                }
            }
        };
    }, [theme]);

    const formattedTitle = useMemo(() => {
        return `Yearly ${datasetMetaData.type
            .split("_")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")} (${datasetMetaData.unit})`;
    }, [datasetMetaData.type, datasetMetaData.unit]);

    return {
        barData,
        chartOptions,
        source: datasetMetaData.source,
        title: formattedTitle
    };
};
