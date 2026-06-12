from app.dependencies import get_supabase as supabase

def get_chat_message(chat_id: str, user_id: str):
    client = supabase()

    messages_list = client.table("messages") \
        .select("role", "content", "id", "created_at") \
        .eq("chat_id", str(chat_id)) \
        .eq("user_id", str(user_id)) \
        .order("created_at", desc=False) \
        .execute()
    
    if messages_list is None: return None
    
    return messages_list.data if messages_list and messages_list.data else []

def save_chat_message(chat_id: str, user_id: str, role: str, content: str):
    client = supabase()

    response = client.table("messages") \
        .insert({
            "chat_id": str(chat_id),
            "user_id": str(user_id),
            "role": role,
            "content": content
        }).execute()

    return response.data if response and response.data else None

def chat_exists(chat_id: str, user_id: str) -> bool:
    client = supabase()

    response = client.table("chats") \
        .select("id") \
        .eq("id", str(chat_id)) \
        .eq("user_id", str(user_id)) \
        .execute()
    
    return bool(response.data)

def create_new_chat(user_id: str):
    client = supabase()

    response = client.table("chats") \
        .insert({ "user_id": user_id }) \
        .execute()

    return response.data if response and response.data else None

def delete_chat(chat_id: str, user_id: str):
    client = supabase()

    client.table("chats") \
        .delete() \
        .eq("id", str(chat_id)) \
        .eq("user_id", str(user_id)) \
        .execute()

def get_user_chats(user_id: str):
    client = supabase()

    response = client.table("chats") \
        .select("id, created_at, title, is_pinned") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    
    return response.data if response and response.data else []

def rename_chat(chat_id: str, user_id: str, new_title: str):
    client = supabase()

    response = client.table("chats") \
        .update({ "title": new_title }) \
        .eq("id", chat_id) \
        .eq("user_id", user_id) \
        .execute()
    
    return response.data if response and response.data else None

def toggle_chat_pin(chat_id: str, user_id: str, is_pinned: bool):
    client = supabase()

    response = client.table("chats") \
        .update({ "is_pinned": is_pinned }) \
        .eq("id", chat_id) \
        .eq("user_id", user_id) \
        .execute()
    
    return response.data if response and response.data else None
