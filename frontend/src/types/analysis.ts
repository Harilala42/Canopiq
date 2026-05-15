export interface TimeSeriesData
{
	year: string;
	value: number;
	color: string;
	normalized: number;
}

export interface RangeTimesData
{
    start: number;
	end: number;
}

type datasetType = "carbon_density" | "tree_cover";

export interface DatasetMetaData
{
	legend: string;
	description: string;
	type: datasetType;
	source: string;
	unit: string;
}

export interface BiomeData
{
	category: string;
	percent: number;
	color: string;
}

export interface LandCoverData
{
	legend: string;
	description: string;
	categories: BiomeData[];
	source: string;
	unit: string;
}
