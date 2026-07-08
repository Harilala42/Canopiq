from collections import defaultdict

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

	yearly_avg = []
	for year in sorted(yearly_bundles.keys()):
		values = yearly_bundles[year]
		avg_val = sum(values) / len(values)

		yearly_avg.append({
			"year": year,
			"value": round(avg_val, 2)
		})

	values_only = [x["value"] for x in yearly_avg]
	vmin = min(values_only)
	vmax = max(values_only)

	if vmax == vmin: vmax += 1

	for item in yearly_avg:
		norm = (item["value"] - vmin) / (vmax - vmin) * 100
		item["normalized"] = round(norm, 2)

		if norm >= 75:
			item["color"] = "#287662"
		elif norm >= 50:
			item["color"] = "#4b907f"
		elif norm >= 25:
			item["color"] = "#b37a3f"
		else:
			item["color"] = "#a34b3c"

	return yearly_avg

def compute_total_change_percent(yearly_data: list[dict]) -> float:
	if len(yearly_data) < 2: return 0.0
	
	first_year_val = yearly_data[0]["value"]
	last_year_val = yearly_data[-1]["value"]
	
	if first_year_val == 0: return 0.0
		
	change_percent = ((last_year_val - first_year_val) / first_year_val) * 100
	
	return round(change_percent, 2)

def format_biome_insights(land_use: dict, threshold: float = 3.0) -> list:
	main_biomes = []
	others_total_value = 0.0
	for label, stats in land_use.items():
		value = stats["value"]
		if value >= threshold:
			main_biomes.append({
				"category": label, 
				"value": value, 
				"color": stats["color"]
			})
		else:
			others_total_value += value
	
	main_biomes.sort(key=lambda x: x["value"], reverse=True)

	if others_total_value > 0:
		main_biomes.append({
			"category": "Others",
			"value": round(others_total_value),
			"color": "#807bb8"
		})

	return main_biomes
