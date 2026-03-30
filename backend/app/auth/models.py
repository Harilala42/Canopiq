import os
from app.dependencies import get_supabase as supabase

def register_with_password(user_data: dict):
    client = supabase()

    response = client.auth.sign_up({
        "email": user_data["email"],
        "password": user_data["password"]
    })

    return response

def login_with_password(user_data: dict):
    client = supabase()

    response = client.auth.sign_in_with_password({
        "email": user_data["email"],
        "password": user_data["password"]
    })

    return response

def login_with_google():
    client = supabase()

    response = client.auth.sign_in_with_oauth({
        "provider": "google",
        "options": {
            "redirect_to": os.environ.get("BACKEND_URL") + "/api/v1/auth/google/callback"
        }
    })

    return response

def handle_google_callback(code: str):
    client = supabase()

    response = client.auth.exchange_code_for_session({
        "auth_code": code
    })
    
    return response

def refresh_session(refresh_token: str):
    client = supabase()

    new_session = client.auth.refresh_session(refresh_token)
    return new_session

def get_user_profile(user_id: str):
    client = supabase()

    response = client.table("users") \
        .select("*") \
        .eq("id", user_id) \
        .maybe_single() \
        .execute()
    
    return response.data

def set_user_profile(user_data: dict):
    client = supabase()

    client.table("users").upsert(
        {
            "id": user_data["id"],
            "email": user_data["email"],
            "username": user_data["username"],
            "avatar_url": ""
        },
        on_conflict="id"
    ).execute()
