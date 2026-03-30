from pydantic import BaseModel, EmailStr, Field

class RegisterForm(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=10, max_length=30)

class LoginForm(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=30)

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    username: str
    avatar_url: str | None = None
