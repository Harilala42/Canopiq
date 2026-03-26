import os
from dotenv import load_dotenv
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

security_scheme = HTTPBearer()

def get_supabase():
    return supabase

async def check_auth(token: HTTPAuthorizationCredentials = Depends(security_scheme)):
    try:
        token = token.credentials
        if not token: raise Exception("Missing token")

        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise Exception("Invalid or expired token")

        return response.user
    except Exception as err:
        raise HTTPException(status_code=401, detail=str(err))
