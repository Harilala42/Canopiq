from pydantic import BaseModel, EmailStr, Field

class RegisterForm(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=10, max_length=30)

class LoginForm(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=30)
