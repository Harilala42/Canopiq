from app.dependencies import get_supabase as supabase

def get_geo_analysis(chat_id: str, user_id: str):
    client = supabase()

    response = client.table("geo_analysis") \
        .select("*") \
        .eq("chat_id", chat_id) \
        .eq("user_id", str(user_id)) \
        .execute()
    
    return response.data if response and response.data else []
