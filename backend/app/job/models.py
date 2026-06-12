from app.dependencies import get_supabase as supabase

def get_job_by_task_id(job_id: str):
    """
	Retrieve the job status by task_id.
	"""
    client = supabase()

    response = client.table("jobs") \
        .select("id", "status", "error_message") \
        .eq("id", str(job_id)) \
        .maybe_single() \
        .execute()
    
    return response.data if response and response.data else None

def update_job_progress(job_id: str, status: str, err_msg: str = None):
	"""
	Updates the realtime jobs table with the current status milestone.
	"""
	client = supabase()
		
	client.table("jobs") \
		.upsert({
			"id": job_id,
			"status": status,
			"err_message": err_msg
		}, on_conflict="id") \
		.execute()
