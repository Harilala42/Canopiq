from collections import defaultdict
from app.dependencies import get_supabase as supabase

def save_analysis_to_db(chat_id: str, user_id: str, query: dict, gis_analysis: dict):
	client = supabase()
	
	b = query['bbox']
	wkt_boundary = f"POLYGON(({b[0]} {b[1]}, {b[2]} {b[1]}, {b[2]} {b[3]}, {b[0]} {b[3]}, {b[0]} {b[1]}))"
	wkt_center = f"POINT({query['longitude']} {query['latitude']})"
	 
	global_average = compute_global_average(gis_analysis["time_series"])
	yearly_average = compute_yearly_average(gis_analysis["time_series"])
	total_change_percent = compute_total_change_percent(yearly_average)
	monthly_ndvi = isolate_monthly_ndvi(gis_analysis["time_series"])

	carbon_stock_metadata = {
		"legend": "Biomass Carbon Density",
		"description": "Estimated above-ground carbon biomass",
		"source": "WCMC/biomass_carbon_density/v1_0",
		"unit": "tC/ha"
	}

	tree_cover_metadata = {
		"legend": "Percent Tree Cover",
		"description": "Fraction of land covered by tree canopy",
		"source": "MODIS/006/MOD44B",
		"unit": "%"
	}

	ndvi_metadata = {
		"legend": "Normalized Difference Vegetation Index (NDVI)",
		"description": "Vegetation health and density indicator derived from red and near-infrared reflectance",
		"source": "COPERNICUS/S2_SR_HARMONIZED",
		"unit": "unitless index (-1 to 1)",
	}
	
	response = client.table("geo_analysis") \
		.insert({
			"chat_id": chat_id,
			"user_id": user_id,
			"location": query['location'],
			"dataset": query['data_set'],
			"start_year": str(query["start_time"]),
			"end_year": str(query["end_time"]),
			"boundary": wkt_boundary,
			"center_point": wkt_center,
			"tile_layer_url": gis_analysis["tile_url"],
			"analytics": {
				"stats": {
					"global_average": global_average,
					"area_coverage_ha": gis_analysis["area_ha"],
					"total_change_percent": total_change_percent
				},
				"insights": {
					"monthly_health_line": {
						"time_series": monthly_ndvi,
						"medatata": ndvi_metadata
					},
					"yearly_dataset_bars": {
						"time_series": yearly_average,
						"metadata": (
							carbon_stock_metadata 
							if query['data_set'] == "carbon_stock" 
							else tree_cover_metadata
						)
					}
				}
			}
		}).execute()

	return response.data if response and response.data else None

def compute_global_average(time_series: list[dict]) -> float:
	if not time_series: return 0.0
	
	total = sum(item['pred'] for item in time_series)
	avg = total / len(time_series)
	
	return round(avg, 2)

def compute_yearly_average(time_series: list[dict]) -> list[dict]:
	yearly_bundles = defaultdict(list)
	
	for item in time_series:
		year = item['date'].split('-')[0]
		yearly_bundles[year].append(item['pred'])
		
	bar_chart_data = []
	for year in sorted(yearly_bundles.keys()):
		values = yearly_bundles[year]
		avg_val = sum(values) / len(values)
		
		bar_chart_data.append({
			"year": year,
			"value": round(avg_val, 2)
		})
		
	return bar_chart_data

def compute_total_change_percent(yearly_data: list[dict]) -> float:
	if len(yearly_data) < 2: return 0.0
	
	first_year_val = yearly_data[0]["value"]
	last_year_val = yearly_data[-1]["value"]
	
	if first_year_val == 0: return 0.0
		
	change_percent = ((last_year_val - first_year_val) / first_year_val) * 100
	
	return round(change_percent, 2)

def isolate_monthly_ndvi(time_series: list[dict]) -> list[dict]:
	return [
		{
			"date": item['date'], 
			"value": round(item['ndvi'], 2)
		} 
		for item in time_series
	]
