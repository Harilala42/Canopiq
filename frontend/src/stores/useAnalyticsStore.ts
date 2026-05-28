import { create } from 'zustand';
import { 
	TimeSeriesData, 
	RangeTimesData, 
	DatasetMetaData, 
	LandCoverData, 
	BiomeData, 
	datasetType
} from '@/types/analysis';

interface AnalyticsState
{
	isChartOpen: boolean;

	geo_analysis_id: string;
	dataset: DatasetMetaData | null;
	range_times: RangeTimesData | null;

	area_coverage: number;
	global_average: number;
	total_change: number;

	dataset_time_series: TimeSeriesData[];
	land_cover: LandCoverData | null;

	openChart: () => void;
	toggleIsChartOpen: () => void;

	setGeoAnalysisId: (id: string) => void;

	setDataset: (
		type: datasetType, 
		dataset: Exclude<DatasetMetaData, "type">
	) => void;

	setRangeTimes: (start: number, end: number) => void;

	setAreaCoverage: (value: number) => void;

	setGlobalAverage: (value: number) => void;

	setTotalChange: (value: number) => void;

	setDatasetTimeSeries: (
		data: TimeSeriesData[]
	) => void;

	setLandCover: (
		metadata: Exclude<LandCoverData, "categories">,
		categories: BiomeData[]
	) => void;

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

	dataset_time_series: [],
	land_cover: null,

	openChart: () => set({ isChartOpen: true }),

	toggleIsChartOpen: () =>
		set((state) => ({
			isChartOpen: !state.isChartOpen,
		})),

	setGeoAnalysisId: (id) => set({ geo_analysis_id: id }),

    setDataset: (type, dataset) => set({ dataset: { ...dataset, type } }),

    setRangeTimes: (start, end) => set({
        range_times: { start, end }
    }),

    setAreaCoverage: (value) => set({ area_coverage: value }),

	setGlobalAverage: (value) => set({ global_average: value }),

    setTotalChange: (value) => set({ total_change: value }),

    setDatasetTimeSeries: (data) => set({ dataset_time_series: data }),

	setLandCover: (metadata, categories) => set({ land_cover: { ...metadata, categories } }),

    setAnalyticsData: (data) => set((state) => ({
        ...state, ...data
    })),

	resetAnalyticsData: () => set({
		isChartOpen: false,
		dataset: null,
		range_times: null,
		land_cover: null,
		area_coverage: 0,
		global_average: 0,
		total_change: 0,
		dataset_time_series: [],
		geo_analysis_id: null
	})
}));

export default useAnalyticsStore;
