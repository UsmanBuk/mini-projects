"""
User Database Model
-------------------
This defines the 'users' table in the database

Key Concept: This is a SQLAlchemy MODEL
- Represents the actual database table
- Defines columns, types, constraints
- Used for reading/writing to database
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """
    User table in the database

    Each attribute becomes a column:
    - id → users.id (primary key)
    - username → users.username
    - email → users.email
    - hashed_password → users.hashed_password
    - created_at → users.created_at
    """

    __tablename__ = "users"  # The actual table name in the database

    # Primary Key - Unique identifier for each user
    id = Column(
        Integer,
        primary_key=True,  # Makes this the primary key
        index=True,        # Creates index for faster lookups
        autoincrement=True # Auto-generates numbers: 1, 2, 3, ...
    )

    # Username - Must be unique
    username = Column(
        String(50),        # Max 50 characters
        unique=True,       # No two users can have same username
        index=True,        # Index for fast username lookups
        nullable=False     # Cannot be NULL (required field)
    )

    # Email - Must be unique
    email = Column(
        String(100),       # Max 100 characters
        unique=True,       # No two users can have same email
        index=True,        # Index for fast email lookups
        nullable=False     # Required field
    )

    # Hashed Password - NEVER store plain passwords!
    hashed_password = Column(
        String(255),       # Hashed passwords are long strings
        nullable=False     # Required field
    )

    # Timestamp - When user was created
    created_at = Column(
        DateTime(timezone=True),           # Stores date + time with timezone
        server_default=func.now(),         # Automatically set to current time
        nullable=False
    )

    # Timestamp - When user was last updated
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),         # Set to current time on creation
        onupdate=func.now(),               # Update timestamp on any change
        nullable=False
    )

    def __repr__(self):
        """String representation for debugging"""
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
