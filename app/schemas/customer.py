from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class CustomerSignup(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class CustomerLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class CustomerResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: CustomerResponse