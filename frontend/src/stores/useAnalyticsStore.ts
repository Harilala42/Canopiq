import { create } from 'zustand';
import { MapData } from '@/types/map';
import { TimeSeriesData, RangeTimesData, DatasetMetaData, LandCoverData } from '@/types/analysis';

interface AnalyticsState
{
	location: MapData | null;
	dataset: DatasetMetaData | null;
	range_times: RangeTimesData | null;

	area_coverage: number;
	global_average: number;
	total_change: number;

	dataset_time_series: TimeSeriesData[];
	land_cover: LandCoverData | null;

	setLocation: (location: MapData) => void;

	setDataset: (dataset: DatasetMetaData) => void;

	setRangeTimes: (start: number, end: number) => void;

	setAreaCoverage: (value: number) => void;

	setGlobalAverage: (value: number) => void;

	setTotalChange: (value: number) => void;

	setDatasetTimeSeries: (
		data: TimeSeriesData[]
	) => void;

	setLandCover: (
		data: LandCoverData
	) => void;

	setAnalyticsData: (
		data: Partial<AnalyticsState>
	) => void;
}

const useAnalyticsStore = create<AnalyticsState>((set) => ({
    location: null,
	dataset: null,
	range_times: null,

	area_coverage: 0,
	global_average: 0,
	total_change: 0,

	dataset_time_series: [],
	land_cover: null,

    setLocation: (location) => set({ location }),

    setDataset: (dataset) => set({ dataset }),

    setRangeTimes: (start, end) => set({
        range_times: { start, end }
    }),

    setAreaCoverage: (value) => set({ area_coverage: value }),

	setGlobalAverage: (value) => set({ area_coverage: value }),

    setTotalChange: (value) => set({ total_change: value }),

    setDatasetTimeSeries: (data) => set({ dataset_time_series: data }),

	setLandCover: (data) => set({ land_cover: data }),

    setAnalyticsData: (data) => set((state) => ({
        ...state, ...data
    }))
}));

export default useAnalyticsStore;
