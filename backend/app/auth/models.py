import os
from app.dependencies import get_supabase

def register_with_password(user_data: dict):
    client = get_supabase()

    response = client.auth.sign_up({
        "email": user_data["email"],
        "password": user_data["password"]
    })

    return response

def login_with_password(user_data: dict):
    client = get_supabase()

    response = client.auth.sign_in_with_password({
        "email": user_data["email"],
        "password": user_data["password"]
    })

    return response

def login_with_google():
    client = get_supabase()

    response = client.auth.sign_in_with_oauth({
        "provider": "google",
        "options": {
            "redirect_to": os.environ.get("BACKEND_URL") + "/api/v1/auth/google/callback"
        }
    })

    storage = client.auth._storage
    storage_key = f"{client.auth._storage_key}-code-verifier"
    code_verifier = storage.get_item(storage_key)

    return response, code_verifier

def handle_google_callback(code: str, code_verifier: str):
    client = get_supabase()

    response = client.auth.exchange_code_for_session({
        "auth_code": code,
        "code_verifier": code_verifier
    })
    
    return response

def refresh_session(refresh_token: str):
    client = get_supabase()

    new_session = client.auth.refresh_session(refresh_token)
    return new_session

def get_user_profile(user_id: str):
    client = get_supabase()

    response = client.table("users") \
        .select("*") \
        .eq("id", user_id) \
        .maybe_single() \
        .execute()
    
    return response.data if response and response.data else None

def set_user_profile(user_data: dict):
    client = get_supabase()

    client.table("users").upsert(
        {
            "id": user_data["id"],
            "email": user_data["email"],
            "username": user_data["username"],
            "avatar_url": ""
        },
        on_conflict="id"
    ).execute()