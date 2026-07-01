import { useMemo } from 'react';
import { GeoAnalysis, BiomeInsight, AnalyticsMetadata } from '@/types/analysis';

export const useChartDonutController = (donutData: GeoAnalysis) => {
    const data = donutData.analytics.insights as BiomeInsight[];
    const meta = donutData.analytics.metadata as AnalyticsMetadata;

    const landUse = useMemo<BiomeInsight[]>(() => {
        if (!data || !Array.isArray(data)) return [];

        const threshold = 3;
        const main = data.filter((item) => item.value >= threshold);
        const small = data.filter((item) => item.value < threshold);
        const otherPercent = small.reduce((sum, item) => sum + item.value, 0);

        if (otherPercent > 0) {
            main.push({
                category: "Others",
                value: Math.round(otherPercent),
                color: "#a695d1ff",
            });
        }

        return main;
    }, [donutData]);

    return {
        data: landUse ?? null,
        legend: meta?.legend ?? "",
        unit: meta?.unit ?? "",
        source: meta?.source ?? "",
    };
};
