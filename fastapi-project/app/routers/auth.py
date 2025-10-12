"""
Authentication Routes
---------------------
API endpoints for user registration and login

Endpoints:
- POST /auth/register - Create new user account
- POST /auth/login    - Login and get JWT token
- GET  /auth/me       - Get current user info
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.dependencies import get_current_user
from app.config import settings

# Create router - this groups related routes together
# prefix="/auth" means all routes start with /auth
# tags=["Authentication"] groups these in API docs
router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============================================================================
# REGISTER NEW USER
# ============================================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account

    Process:
    1. Check if username or email already exists
    2. Hash the password (NEVER store plain passwords!)
    3. Create user in database
    4. Return user info (without password)

    Args:
        user_data: UserCreate schema with username, email, password
        db: Database session (injected by FastAPI)

    Returns:
        UserResponse with user info (no password)

    Raises:
        400: If username or email already exists
    """

    # 1. Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # 2. Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 3. Create new user with hashed password
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)  # Hash password!
    )

    # 4. Add to database
    db.add(new_user)
    db.commit()  # Save changes to database
    db.refresh(new_user)  # Refresh to get auto-generated fields (id, timestamps)

    # 5. Return user (FastAPI auto-converts to UserResponse schema)
    return new_user


# ============================================================================
# LOGIN
# ============================================================================

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with username/email and password

    OAuth2PasswordRequestForm is a special FastAPI class that:
    - Expects form data (not JSON)
    - Has fields: username, password
    - Used for OAuth2 compatibility

    Process:
    1. Find user by username or email
    2. Verify password
    3. Create JWT token
    4. Return token

    Args:
        form_data: OAuth2 form with username and password
        db: Database session

    Returns:
        Token with access_token and token_type

    Raises:
        401: If credentials are incorrect
    """

    # 1. Find user by username or email
    # form_data.username can be either username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()

    # 2. Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Create access token
    # Token contains username and expiration time
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},  # "sub" (subject) is standard JWT field
        expires_delta=access_token_expires
    )

    # 5. Return token
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================================
# GET CURRENT USER INFO
# ============================================================================

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information

    This route is protected - requires valid JWT token
    The Depends(get_current_user) automatically:
    1. Extracts token from Authorization header
    2. Verifies token
    3. Gets user from database
    4. Injects user into this function

    If token is invalid/missing, user gets 401 error before reaching here

    Args:
        current_user: Current authenticated user (injected by dependency)

    Returns:
        UserResponse with current user info
    """
    return current_user
