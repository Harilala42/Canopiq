from fastapi import APIRouter, HTTPException, Depends, Response, Cookie
from app.auth.models import register_with_password, login_with_password, refresh_session
from app.auth.schemas import RegisterForm, LoginForm
from app.dependencies import check_auth
from typing import Annotated

public_router = APIRouter()

# Endpoint to allow user to register
@public_router.post("/auth/register", tags=["auth"])
async def register_user(payload: RegisterForm = Depends()):
	try:
		result = register_with_password(payload.model_dump())
		if not result:
			raise Exception("User registration failed")

		return { "message": "User registered successfully" }
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to register:", str(err))

		if "rate limit" in error_msg:
			raise HTTPException(status_code=429, detail="Too many requests! Please try again later.")

		if "invalid" in error_msg:
			raise HTTPException(status_code=400, detail="Invalid email address provided.")

		if "duplicate" in error_msg or "already in use" in error_msg:
			raise HTTPException(status_code=400, detail="Email already in use.")

		raise HTTPException(status_code=500, detail="Something went wrong.")

# Endpoint to login via email/password
@public_router.post("/auth/login", tags=["auth"])
async def login_user_with_password(payload: LoginForm = Depends(), response: Response = None):
	try:
		result = login_with_password(payload.model_dump())
		if not result or not result.session:
			return Exception("User login failed")
		
		access_token = result.session.access_token
		refresh_token = result.session.refresh_token

		response.set_cookie(
			key="refresh_token",
			value=refresh_token,
			httponly=True,
			samesite="strict",
			secure=True
		)

		return { 
			"message": "User logged in successfully",
			"access_token": access_token
		}
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to login:", str(err))

		if "invalid" in error_msg or "not valid" in error_msg:
			raise HTTPException(status_code=401, detail="Invalid email or password")
		
		if "not confirmed" in error_msg:
			raise HTTPException(
				status_code=403,
				detail="Email still not confirmed. Please verify your email."
			)

		raise HTTPException(status_code=500, detail="Something went wrong.")
	
router = APIRouter(dependencies=[Depends(check_auth)])
	
# Endpoint to refresh access token
@router.post("/auth/refresh", tags=["auth"])
async def refresh_access_token(refresh_token: Annotated[str | None, Cookie()] = None):
	if not refresh_token:
		raise HTTPException(status_code=401, detail="Missing refresh token")

	try:
		result = refresh_session(refresh_token)
		if not result or not result.session:
			raise Exception("Refresh token failed")
		
		new_access_token = result.session.access_token

		return {
			"message": "Session refreshed successfully",
			"access_token": new_access_token
		}
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to refresh token:", str(err))

		if "invalid" in error_msg or "not valid" in error_msg:
			raise HTTPException(status_code=401, detail="Invalid refresh token")

		raise HTTPException(status_code=500, detail="Something went wrong.")
