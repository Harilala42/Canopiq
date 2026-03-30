import os
from typing import Annotated
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import HTTPException, Cookie, Request

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def get_supabase():
    return supabase

async def check_auth(
    request: Request,
    access_token: Annotated[str | None, Cookie()] = None
):
    if not access_token:
        raise HTTPException(
            status_code=401, 
            detail= {
                "code": "MISSING_ACCESS_TOKEN",
                "message": "Not authenticated"
            }
        )

    try:
        response = supabase.auth.get_user(access_token)
        if not response or not response.user:
            raise Exception("Invalid or expired session")

        request.state.user = response.user
        return response.user
    except Exception as err:
        print("ERROR: Auth Error:", str(err))
        
        raise HTTPException(
            status_code=401, 
            detail= {
                "code": "TOKEN_EXPIRED",
                "message": "Session expired or invalid"
            }
        )
