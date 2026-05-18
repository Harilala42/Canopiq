import { useMemo } from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import useAnalyticsStore from '@/stores/useAnalyticsStore';

export const useChartDonutController = (theme: string) => {
    const landCover = useAnalyticsStore((state) => state.land_cover);
    const isDark = theme === "dark";

    const donutData = useMemo<ChartData<"doughnut", number[], string>>(() => {
        const threshold = 3;
        const main = landCover.categories.filter((item) => item.percent >= threshold);
        const small = landCover.categories.filter((item) => item.percent < threshold);
        const otherPercent = small.reduce((sum, item) => sum + item.percent, 0);

        if (otherPercent > 0) {
            main.push({ 
                category: "Others",
                percent: Math.round(otherPercent),
                color: "#7A728F" 
            });
        }

        return {
            labels: main.map((item) => item.category),
            datasets: [
                {
                    data: main.map((item) => item.percent),
                    backgroundColor: main.map((item) => item.color),
                    borderWidth: 0
                }
            ]
        };
    }, [landCover]);

    const options = useMemo<ChartOptions<"doughnut">>(() => {
        return {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        color: isDark ? "#cecbf6" : "#1a1535",
                        font: { size: 12, weight: "bold" },
                        padding: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw}%`
                    }
                }
            }
        };
    }, [theme]);

    return {
        donutData,
        options,
        legend: landCover.legend,
        unit: landCover.unit,
        source: landCover.source
    };
};
