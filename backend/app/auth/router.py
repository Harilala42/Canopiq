import os
from typing import Annotated
import app.auth.models as auth_models
from app.dependencies import check_auth, rate_limiter
from app.auth.schemas import RegisterForm, LoginForm, UserProfile
from fastapi import APIRouter, HTTPException, Depends, Request, Response, Cookie
from fastapi.responses import RedirectResponse

public_router = APIRouter(dependencies=[Depends(rate_limiter)])

@public_router.post("/auth/register", tags=["auth"])
async def register_user(payload: RegisterForm):
	try:
		result = auth_models.register_with_password(payload.model_dump())
		if not result or not result.user:
			raise HTTPException(
				status_code=400,
				detail={
					"code": "REGISTER_FAILED",
					"message": "User registration failed. The email may already be in use."
				}
			)
		
		user_id = result.user.id
		user = UserProfile(
			id=user_id,
			email=payload.email,
			username=payload.username,
			avatar_url=None
		)

		auth_models.set_user_profile(user.model_dump())
		
		return { "message": "User registered successfully" }
	except HTTPException:
		raise
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to register:", str(err))

		if "rate limit" in error_msg:
			raise HTTPException(
				status_code=429, 
				detail= {
					"code": "RATE_LIMITED",
					"message": "Too many registration attempts. Please try again later."
				}
			)

		if "invalid" in error_msg:
			raise HTTPException(
				status_code=401,
				detail={
					"code": "INVALID_CREDENTIALS",
					"message": "Invalid email provided. Please enter a valid email address."
				}
			)

		if "duplicate" in error_msg or "already in use" in error_msg:
			raise HTTPException(
				status_code=400,
				detail={
					"code": "EMAIL_ALREADY_USED",
					"message": "Email already in use"
				}
			)

		raise HTTPException(
			status_code=500,
			detail={
				"code": "INTERNAL_SERVER_ERROR",
				"message": "Something went wrong"
			}
		)

@public_router.post("/auth/login", tags=["auth"])
async def login_user_with_password(payload: LoginForm, response: Response):
	try:
		result = auth_models.login_with_password(payload.model_dump())
		if not result or not result.session:
			raise HTTPException(
				status_code=400,
				detail={
					"code": "LOGIN_FAILED",
					"message": "User login failed."
				}
			)
		
		access_token = result.session.access_token
		refresh_token = result.session.refresh_token

		response.set_cookie(
			key="access_token",
			value=access_token,
			httponly=True,
			samesite="none",
			secure=True
		)

		response.set_cookie(
			key="refresh_token",
			value=refresh_token,
			httponly=True,
			samesite="none",
			secure=True
		)

		return { "message": "User logged in successfully" }
	except HTTPException:
		raise
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to login:", str(err))

		if "invalid" in error_msg or "not valid" in error_msg:
			raise HTTPException(
				status_code=401,
				detail={
					"code": "INVALID_CREDENTIALS",
					"message": "Invalid email or password"
				}
			)
		
		if "not confirmed" in error_msg:
			raise HTTPException(
				status_code=403,
				detail={
					"code": "EMAIL_NOT_CONFIRMED",
					"message": "Email still not confirmed. Please verify your email."
				}
			)

		raise HTTPException(
			status_code=500,
			detail={
				"code": "INTERNAL_SERVER_ERROR",
				"message": "Something went wrong"
			}
		)

@public_router.post("/auth/logout", tags=["auth"])
async def logout(response: Response):
	response.delete_cookie(
		key="access_token",
		httponly=True,
		samesite="none",
		secure=True
	)

	response.delete_cookie(
		key="refresh_token",
		httponly=True,
		samesite="none",
		secure=True
	)

	return { "message": "Logged out successfully" }

@public_router.post("/auth/refresh", tags=["auth"])
async def refresh_access_token(
	response: Response,
	refresh_token: Annotated[str | None, Cookie()]
):
	if not refresh_token:
		raise HTTPException(
			status_code=401,
			detail={
				"code": "MISSING_REFRESH_TOKEN",
				"message": "Missing refresh token"
			}
		)

	try:
		result = auth_models.refresh_session(refresh_token)
		if not result or not result.session:
			raise HTTPException(
				status_code=400,
				detail={
					"code": "REFRESH_FAILED",
					"message": "Refresh token failed."
				}
			)
		
		new_access_token = result.session.access_token

		response.set_cookie(
			key="access_token",
			value=new_access_token,
			httponly=True,
			samesite="none",
			secure=True
		)

		return { "message": "Session refreshed successfully" }
	except HTTPException:
		raise
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to refresh token:", str(err))

		if "invalid" in error_msg or "not valid" in error_msg:
			raise HTTPException(
				status_code=401,
				detail={
					"code": "INVALID_REFRESH_TOKEN",
					"message": "Invalid refresh token"
				}
			)

		raise HTTPException(
			status_code=500,
			detail={
				"code": "INTERNAL_SERVER_ERROR",
				"message": "Something went wrong"
			}
		)
	
@public_router.get("/auth/google", tags=["auth"])
async def login_with_google():
	try:
		result, code_verifier = auth_models.login_with_google()
		if not result or not result.url:
			raise HTTPException(
				status_code=400,
				detail={
					"code": "MISSING_REDIRECT_URL",
					"message": "Missing redirect url"
				}
			)
		
		redirect = RedirectResponse(url=result.url)
		
		redirect.set_cookie(
			key="pkce_verifier",
			value=code_verifier,
			httponly=True,
			samesite="none",
			secure=True,
			max_age=600
		)

		return redirect
	except HTTPException:
		raise
	except Exception as err:
		print("ERROR: Failed to login with Google:", str(err))

		raise HTTPException(
			status_code=500,
			detail={
				"code": "INTERNAL_SERVER_ERROR",
				"message": "Something went wrong"
			}
		)

@public_router.get("/auth/google/callback", tags=["auth"])
async def google_callback(
	code: str, 
	request: Request,
	response: Response
):
	code_verifier = request.cookies.get("pkce_verifier")
	if not code or not code_verifier:
		raise HTTPException(
			status_code=401,
			detail={
				"code": "MISSING_AUTH_CODE",
				"message": "Missing authorization code"
			}
		)

	try:
		result = auth_models.handle_google_callback(code, code_verifier)
		if not result or not result.session:
			raise HTTPException(
				status_code=400,
				detail={
					"code": "GOOGLE_AUTH_FAILED",
					"message": "Google OAuth callback failed"
				}
			)
		
		user = UserProfile(
			id=result.user.id,
			email=result.user.email,
			username=result.user.user_metadata["name"].split(" ")[0],
			avatar_url=None
		)

		auth_models.set_user_profile(user.model_dump())
		
		access_token = result.session.access_token
		refresh_token = result.session.refresh_token
		
		response.set_cookie(
			key="access_token",
			value=access_token,
			httponly=True,
			samesite="none",
			secure=True
		)

		response.set_cookie(
			key="refresh_token",
			value=refresh_token,
			httponly=True,
			samesite="none",
			secure=True
		)

		return { "url": os.environ.get("FRONTEND_URL") }
	except HTTPException:
		raise
	except Exception as err:
		print("ERROR: Google OAuth callback failed:", str(err))

		raise HTTPException(
			status_code=500,
			detail={
				"code": "INTERNAL_SERVER_ERROR",
				"message": "Something went wrong"
			}
		)
	
router = APIRouter(dependencies=[
	Depends(check_auth),
	Depends(rate_limiter)
])

@router.get("/auth/session", tags=["auth"])
async def get_auth_session(access_token: Annotated[str | None, Cookie()]):
    try:
        if not access_token:
            raise HTTPException(
				status_code=401,
				detail={
					"code": "MISSING_ACCESS_TOKEN",
					"message": "Missing access token"
				}
			)
            
        return { "access_token": access_token }
    except Exception as err:
        print("ERROR: Failed to retrieve session:", str(err))
        raise HTTPException(status_code=500, detail="Internal server error")
	
@router.get("/auth/me", tags=["auth"])
async def check_user_profile(request: Request):
	try:
		user_id = request.state.user.id
		user_data = auth_models.get_user_profile(user_id)
		if not user_data:
			raise HTTPException(
				status_code=404,
				detail={
					"code": "RESOURCE_NOT_FOUND",
					"message": "User profile not found"
				}
			)

		return user_data
	except HTTPException:
		raise
	except Exception as err:
		print("ERROR: Failed to retrieve user's data:", str(err))

		raise HTTPException(
			status_code=500,
			detail={
				"code": "INTERNAL_SERVER_ERROR",
				"message": "Something went wrong"
			}
		)
