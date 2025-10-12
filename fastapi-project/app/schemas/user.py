"""
User Schemas (Pydantic Models)
-------------------------------
Schemas define the DATA STRUCTURE for API requests and responses

KEY DIFFERENCE: Models vs Schemas
- MODELS (SQLAlchemy) = Database tables (what's stored)
- SCHEMAS (Pydantic) = API data format (what's sent/received)

Why separate?
- You don't want to send hashed_password to users!
- API might need different fields than database
- Validation happens here
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# 1. Base Schema - Common fields for all user schemas
class UserBase(BaseModel):
    """Base user fields that appear in multiple schemas"""
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    email: EmailStr = Field(..., description="Valid email address")


# 2. User Registration - What user sends to create account
class UserCreate(UserBase):
    """
    Schema for user registration (POST /auth/register)

    Includes password field (which UserBase doesn't have)
    This is what the user sends when signing up
    """
    password: str = Field(..., min_length=8, max_length=100, description="Password (min 8 characters)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "johndoe",
                "email": "john@example.com",
                "password": "secretpassword123"
            }
        }
    )


# 3. User Response - What API sends back (NO PASSWORD!)
class UserResponse(UserBase):
    """
    Schema for user data in API responses

    Note: No password field! Never send passwords back to users.
    This is what API returns after registration or login
    """
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,  # Allows creating from SQLAlchemy models
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "johndoe",
                "email": "john@example.com",
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        }
    )


# 4. Login Schema - What user sends to login
class UserLogin(BaseModel):
    """
    Schema for login requests (POST /auth/login)

    Can login with either username or email + password
    """
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "johndoe",
                "password": "secretpassword123"
            }
        }
    )


# 5. Token Response - What API sends after successful login
class Token(BaseModel):
    """
    Schema for JWT token response

    After successful login, user receives a JWT token
    They include this token in future requests to prove identity
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }
    )


# 6. Token Data - What's stored inside the JWT token
class TokenData(BaseModel):
    """
    Data extracted from JWT token

    When user sends token, we decode it to get this info
    Used internally, not sent to/from API
    """
    username: str | None = None
