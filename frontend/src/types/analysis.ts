export type DatasetType = "carbon_density" | "tree_cover" | "land_use_distribution";
export type InsightKind = "categorical" | "time_series";

export interface TimeSeriesInsight
{
	year: string;
	value: number;
	color: string;
	normalized: number;
}

export interface BiomeInsight 
{
	category: string;
	value: number;
	color: string;
}

export interface AnalyticsStats 
{
	global_average: number | null;
	area_coverage_ha: number;
	total_change_percent: number | null;
}

export interface AnalyticsMetadata 
{
	kind: InsightKind;
	type: DatasetType;
	unit: string;
	legend: string;
	source: string;
	description: string;
}

export interface AnalyticsPayload 
{
	stats: AnalyticsStats;
	insights: TimeSeriesInsight[] | BiomeInsight[];
	metadata: AnalyticsMetadata;
}

export interface GeoAnalysis 
{
	id: string;
	location: string;
	boundary: string;
	dataset: DatasetType;
	coordinates: [number, number];
	analytics: AnalyticsPayload;
	start_year: string | null;
	end_year: string | null;
	h3_grid_map_id: string;
}
