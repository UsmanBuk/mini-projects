"""
Security Utilities
------------------
Handles password hashing and JWT token creation/verification

Two main security concepts:
1. Password Hashing - Never store plain passwords
2. JWT Tokens - Stateless authentication
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# ============================================================================
# PASSWORD HASHING
# ============================================================================

# Create password context for hashing
# bcrypt is a one-way hashing algorithm - you can't "decrypt" it back
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain password using bcrypt

    Example:
        password = "mypassword123"
        hashed = hash_password(password)
        # Returns: "$2b$12$KIXqF.x3L0VrZ9QvJ8..."

    Why hash?
    - If database is hacked, attackers can't see real passwords
    - Bcrypt adds "salt" (random data) so same password has different hash
    - Computationally expensive to crack (even with powerful computers)
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify if plain password matches hashed password

    Example:
        # User logging in with "mypassword123"
        is_correct = verify_password("mypassword123", stored_hash)
        # Returns: True if password matches, False otherwise

    How it works:
    - Takes the plain password user entered
    - Hashes it the same way
    - Compares with stored hash
    - Returns True if they match
    """
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# JWT TOKEN HANDLING
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT (JSON Web Token) for authentication

    What's a JWT?
    - A encoded string containing user info and expiration time
    - Signed with SECRET_KEY so it can't be tampered with
    - User includes this in requests to prove identity

    Structure: header.payload.signature
    Example: eyJhbGci...eyJ1c2Vy...SflKxwRJ

    Args:
        data: Dictionary of data to encode (usually {"sub": username})
        expires_delta: How long token is valid (default: 30 minutes)

    Returns:
        Encoded JWT token string
    """
    # Copy data to avoid modifying original
    to_encode = data.copy()

    # Set expiration time
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add expiration to token data
    to_encode.update({"exp": expire})

    # Create and return the JWT token
    # jwt.encode() creates the token using our SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """
    Verify JWT token and extract username

    How it works:
    1. Decode token using SECRET_KEY
    2. Check if expired
    3. Extract username from "sub" field
    4. Return username if valid, None if invalid

    Args:
        token: JWT token string

    Returns:
        Username if token is valid, None if invalid/expired
    """
    try:
        # Decode the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        # Extract username from "sub" (subject) field
        username: str = payload.get("sub")

        # If no username in token, it's invalid
        if username is None:
            return None

        return username

    except JWTError:
        # Token is invalid (expired, tampered with, or malformed)
        return None
