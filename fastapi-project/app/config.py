"""
Configuration Settings
----------------------
This file loads settings from environment variables (.env file)
Pydantic Settings automatically validates types and provides defaults
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables

    How it works:
    1. Looks for .env file in root directory
    2. Reads variables like DATABASE_URL, SECRET_KEY, etc.
    3. Validates types (str, int, bool)
    4. Provides these settings to the entire app
    """

    # Database
    DATABASE_URL: str = "sqlite:///./tasks.db"  # Default to SQLite in current directory

    # Security - JWT Token Settings
    SECRET_KEY: str = "your-secret-key-change-in-production"  # Used to sign JWT tokens
    ALGORITHM: str = "HS256"  # Encryption algorithm for JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # How long tokens last (30 minutes)

    # API Metadata
    API_TITLE: str = "Personal Task Manager API"
    API_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Configuration for loading .env file
    model_config = SettingsConfigDict(
        env_file=".env",  # Look for .env file
        env_file_encoding="utf-8",  # Use UTF-8 encoding
        case_sensitive=False  # DATABASE_URL or database_url both work
    )


# Create a single instance to use throughout the app
# This is a singleton pattern - one settings object for entire app
settings = Settings()
