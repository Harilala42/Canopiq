export interface RangeTimesData
{
    start: number;
	end: number;
}

export type datasetType = "carbon_density" | "tree_cover";

export interface TimeSeriesData
{
	year: string;
	value: number;
	color: string;
	normalized: number;
}

export interface BiomeData
{
	category: string;
	value: number;
	color: string;
}

export interface DatasetData
{
	legend: string;
	description: string;
	type: datasetType;
	time_series: TimeSeriesData[];
	source: string;
	unit: string;
}

export interface LandUseData
{
	legend: string;
	description: string;
	categories: BiomeData[];
	source: string;
	unit: string;
}
