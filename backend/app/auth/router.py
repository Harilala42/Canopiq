from fastapi import APIRouter, HTTPException, Depends, Request, Response, Cookie
from app.auth.models import register_with_password, login_with_password, refresh_session, get_user_profile
from app.auth.schemas import RegisterForm, LoginForm
from app.dependencies import check_auth
from typing import Annotated

public_router = APIRouter()

# Endpoint to allow user to register
@public_router.post("/auth/register", tags=["auth"])
async def register_user(payload: RegisterForm):
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
async def login_user_with_password(payload: LoginForm, response: Response):
	try:
		result = login_with_password(payload.model_dump())
		if not result or not result.session:
			return Exception("User login failed")
		
		access_token = result.session.access_token
		refresh_token = result.session.refresh_token

		response.set_cookie(
			key="access_token",
			value=access_token,
			httponly=True,
			samesite="lax",
			secure=False
		)

		response.set_cookie(
			key="refresh_token",
			value=refresh_token,
			httponly=True,
			samesite="lax",
			secure=False
		)

		return { "message": "User logged in successfully" }
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to login:", str(err))

		if "invalid" in error_msg or "not valid" in error_msg:
			raise HTTPException(status_code=401, detail="Invalid email or password")
		
		if "not confirmed" in error_msg:
			raise HTTPException(
				status_code=403,
				message="Email still not confirmed. Please verify your email."
			)

		raise HTTPException(status_code=500, detail="Something went wrong.")

# Endpoint to logout user's session	
@public_router.post("/auth/logout", tags=["auth"])
async def logout(response: Response):
	response.delete_cookie(
		key="access_token",
		httponly=True,
		samesite="lax",
		secure=False
	)

	response.delete_cookie(
		key="refresh_token",
		httponly=True,
		samesite="lax",
		secure=False
	)

	return { "message": "Logged out successfully" }
	
router = APIRouter(dependencies=[Depends(check_auth)])
	
# Endpoint to refresh access token
@router.post("/auth/refresh", tags=["auth"])
async def refresh_access_token(
	response: Response,
	refresh_token: Annotated[str | None, Cookie()]
):
	if not refresh_token:
		raise HTTPException(status_code=401, detail="Missing refresh token")

	try:
		result = refresh_session(refresh_token)
		if not result or not result.session:
			raise Exception("Refresh token failed")
		
		new_access_token = result.session.access_token

		response.set_cookie(
			key="access_token",
			value=new_access_token,
			httponly=True,
			samesite="lax",
			secure=False
		)

		return { "message": "Session refreshed successfully" }
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to refresh token:", str(err))

		if "invalid" in error_msg or "not valid" in error_msg:
			raise HTTPException(status_code=401, detail="Invalid refresh token")

		raise HTTPException(status_code=500, detail="Something went wrong.")
	
# Endpoint to retrieve user's data
@router.get("/auth/me", tags=["auth"])
async def check_user_profile(request: Request):
	try:
		user_id = request.state.user.id
		user_data = get_user_profile(user_id)

		if not user_data:
			raise HTTPException(status_code=404, detail="User profile not found")

		return user_data
	except Exception as err:
		print("ERROR: Failed to retrieve user's data:", str(err))

		raise HTTPException(status_code=500, detail="Something went wrong.")