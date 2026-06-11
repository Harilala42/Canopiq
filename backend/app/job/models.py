from app.dependencies import get_supabase as supabase

def get_job_by_task_id(task_id: str, chat_id: str, user_id: str):
    """
	Retrieve the job status by task_id.
	"""
    client = supabase()

    response = client.table("jobs") \
        .select("id", "status", "error_message") \
        .eq("chat_id", str(chat_id)) \
        .eq("user_id", str(user_id)) \
        .eq("celery_task_id", str(task_id)) \
        .maybe_single() \
        .execute()
    
    return response.data if response and response.data else None

def update_job_progress(task_id: str, status: str, err_msg: str = None):
	"""
	Updates the realtime jobs table with the current status milestone.
	"""
	client = supabase()
		
	response = client.table("jobs") \
		.upsert({
			"status": status,
			"job_id": task_id,
			"err_message": err_msg
		}, on_conflict="job_id") \
		.execute()
