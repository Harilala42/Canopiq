import os
from typing import Annotated
from dotenv import load_dotenv
from redis.asyncio import Redis
from supabase import create_client
from fastapi import HTTPException, Cookie, Request

load_dotenv()

redis_url = os.environ.get("UPSTASH_REDIS_URL")
redis_client = Redis.from_url(redis_url, decode_responses=True)

def get_supabase():
    return create_client(
        supabase_url=os.environ.get("SUPABASE_URL"),
        supabase_key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    )

async def check_auth(
    request: Request,
    access_token: Annotated[str | None, Cookie()] = None
):
    client = get_supabase()

    if not access_token:
        raise HTTPException(
            status_code=401, 
            detail= {
                "code": "MISSING_ACCESS_TOKEN",
                "message": "Not authenticated"
            }
        )

    try:
        response = client.auth.get_user(access_token)
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
    
async def rate_limiter(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}"
    
    rate_limit = 50
    window = 60

    async with redis_client.pipeline(transaction=True) as pipe:
        pipe.incr(key)
        pipe.expire(key, window)
        results = await pipe.execute()

    current_count = results[0]

    if current_count > rate_limit:
        raise HTTPException(
            status_code=429, 
            detail={
                "code": "TOO_MANY_REQUESTS",
                "message": "Rate limit exceeded. Please try again later."
            }
        )

    return rate_limit - current_count
