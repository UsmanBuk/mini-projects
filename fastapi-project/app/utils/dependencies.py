"""
FastAPI Dependencies
--------------------
Dependencies are reusable functions that FastAPI runs before route handlers

Main use case: Get current authenticated user from JWT token
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.security import verify_token

# ============================================================================
# OAuth2 Setup
# ============================================================================

# This tells FastAPI where to get the token from
# tokenUrl="auth/login" means the login endpoint is at /auth/login
# When user isn't authenticated, FastAPI's docs will show a login button
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ============================================================================
# Get Current User Dependency
# ============================================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),  # Extract token from Authorization header
    db: Session = Depends(get_db)         # Get database session
) -> User:
    """
    Dependency to get currently authenticated user from JWT token

    How it works:
    1. FastAPI extracts token from Authorization header
       (Header looks like: "Authorization: Bearer eyJhbGci...")
    2. Verify token and extract username
    3. Look up user in database
    4. Return user object (or raise error if invalid)

    Usage in routes:
        @router.get("/me")
        def get_me(current_user: User = Depends(get_current_user)):
            return current_user

    This is FastAPI's "Dependency Injection" pattern:
    - You declare what you need (current_user)
    - FastAPI automatically runs this function to get it
    - If token is invalid, user never reaches your route
    """

    # Exception to raise if authentication fails
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Verify token and extract username
    username = verify_token(token)
    if username is None:
        raise credentials_exception

    # 2. Look up user in database
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    # 3. Return user object
    return user


# ============================================================================
# Optional: Get Current Active User (for future use)
# ============================================================================

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active (not disabled)

    We don't have an 'is_active' field yet, but this shows how to
    chain dependencies. You could add:
        - is_active check
        - is_verified check (for email verification)
        - is_admin check (for admin-only routes)

    Example:
        @router.delete("/admin/users/{user_id}")
        def delete_user(
            user_id: int,
            current_user: User = Depends(get_current_active_user)
        ):
            # Only authenticated, active users can reach here
            pass
    """
    # In the future, add checks like:
    # if not current_user.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive user")

    return current_user
