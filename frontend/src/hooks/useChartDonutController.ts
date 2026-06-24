import { useMemo } from 'react';
import { LandUseData, BiomeData } from '@/types/analysis';

export const useChartDonutController = (landCover: LandUseData) => {
    const donutData = useMemo<BiomeData[]>(() => {
        if (!landCover?.categories || !Array.isArray(landCover.categories)) 
            return [];

        const threshold = 3;
        const main = landCover.categories.filter((item) => item.value >= threshold);
        const small = landCover.categories.filter((item) => item.value < threshold);
        const otherPercent = small.reduce((sum, item) => sum + item.value, 0);

        if (otherPercent > 0) {
            main.push({
                category: "Others",
                value: Math.round(otherPercent),
                color: "#a695d1ff",
            });
        }

        return main;
    }, [landCover]);

    return {
        categories: donutData,
        legend: landCover?.legend || "",
        unit: landCover?.unit || "",
        source: landCover?.source || "",
    };
};
