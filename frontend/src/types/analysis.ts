export interface TimeSeriesData
{
	date: string;
	value: number;
}

export interface RangeTimesData
{
    start: number;
	end: number;
}

export type DatasetType = "tree_cover" | "carbon_stock";
