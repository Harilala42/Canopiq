from app.dependencies import get_supabase as supabase

def register_with_password(user_data: dict):
    client = supabase()

    response = client.auth.sign_up({
        "email": user_data["email"],
        "password": user_data["password"]
    })

    user = response.user

    if user:
        client.table("profiles").insert({
            "id": user.id,
            "email": user_data["email"],
            "username": user_data["username"],
            "avatar_url": ""
        }).execute()

    return response

def login_with_password(user_data: dict):
    client = supabase()

    response = client.auth.sign_in_with_password({
        "email": user_data["email"],
        "password": user_data["password"]
    })

    return response

def refresh_session(refresh_token: str):
    client = supabase()

    new_session = client.auth.refresh_session(refresh_token)
    return new_session
