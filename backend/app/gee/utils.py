from collections import defaultdict
from app.dependencies import get_supabase as supabase

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

def update_job_progress(
	chat_id: str, 
	user_id: str,
	task_id: str, 
	status: str, 
	error_msg: str = None
):
	"""
	Updates the realtime jobs table with the current status milestone.
	"""
	client = supabase()

	payload = {
		"chat_id": chat_id,
        "user_id": user_id,
        "status": status,
        "celery_task_id": task_id
	}
	if error_msg: payload["error_message"] = error_msg
		
	client.table("jobs") \
		.upsert(payload, on_conflict="chat_id, user_id") \
		.execute()
