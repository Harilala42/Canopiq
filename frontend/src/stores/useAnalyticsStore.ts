import { create } from 'zustand';
import { 
	DatasetData,
	RangeTimesData, 
	LandUseData, 
	BiomeData, 
	datasetType
} from '@/types/analysis';

interface AnalyticsState
{
	isChartOpen: boolean;

	geo_analysis_id: string;
	range_times: RangeTimesData | null;

	area_coverage: number;
	global_average: number;
	total_change: number;

	dataset: DatasetData | null;
	land_use: LandUseData | null;

	openChart: () => void;
	closeChart: () => void;
	toggleIsChartOpen: () => void;

	setGeoAnalysisId: (id: string) => void;

	setDataset: (dataset: DatasetData) => void;

	setRangeTimes: (start: number, end: number) => void;

	setAreaCoverage: (value: number) => void;

	setGlobalAverage: (value: number) => void;

	setTotalChange: (value: number) => void;

	setLandUse: (data: LandUseData) => void;

	setAnalyticsData: (
		data: Partial<AnalyticsState>
	) => void;

	resetAnalyticsData: () => void;
}

const useAnalyticsStore = create<AnalyticsState>((set) => ({
	isChartOpen: false,

	dataset: null,
	range_times: null,
	geo_analysis_id: null,

	area_coverage: 0,
	global_average: 0,
	total_change: 0,

	land_use: null,

	openChart: () => set({ isChartOpen: true }),

	closeChart: () => set({ isChartOpen: false }),

	toggleIsChartOpen: () =>
		set((state) => ({
			isChartOpen: !state.isChartOpen,
		})),

	setGeoAnalysisId: (id) => set({ geo_analysis_id: id }),

    setDataset: (dataset) => set({ dataset: dataset }),

    setRangeTimes: (start, end) => set({
        range_times: { start, end }
    }),

    setAreaCoverage: (value) => set({ area_coverage: value }),

	setGlobalAverage: (value) => set({ global_average: value }),

    setTotalChange: (value) => set({ total_change: value }),

	setLandUse: (data) => {
		const landUseDistribution: LandUseData = {
			...data,
			categories: Object.entries(data.categories).map(
				([categoryName, details]: [string, any]) => ({
					category: categoryName,
					value: details.value,
					color: details.color
				})
			)
		};

		set({ land_use: landUseDistribution });
	},

    setAnalyticsData: (data) => set((state) => ({
        ...state, ...data
    })),

	resetAnalyticsData: () => set({
		dataset: null,
		range_times: null,
		land_use: null,
		area_coverage: 0,
		global_average: 0,
		total_change: 0,
		geo_analysis_id: null
	})
}));

export default useAnalyticsStore;
