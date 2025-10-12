"""
Database Connection Setup
--------------------------
This file sets up SQLAlchemy - our ORM (Object Relational Mapper)

What's an ORM?
- Lets you work with databases using Python objects instead of SQL
- Instead of: "SELECT * FROM users WHERE id = 1"
- You write: db.query(User).filter(User.id == 1).first()
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# 1. Create the database engine
# Think of this as the "connection" to your database
# connect_args={"check_same_thread": False} is needed for SQLite only
# (SQLite is single-threaded by default, this makes it work with FastAPI)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# 2. Create a SessionLocal class
# Each "session" is like a conversation with the database
# When you want to read/write data, you create a session
# Think of it like opening a file - you open it, use it, then close it
SessionLocal = sessionmaker(
    autocommit=False,  # Don't auto-save changes (we control when to save)
    autoflush=False,   # Don't auto-send changes to DB (we control when)
    bind=engine        # Bind to our database engine
)

# 3. Create a Base class for our models
# All database models (User, Task, Project) will inherit from this
# This is what makes a Python class become a database table
Base = declarative_base()


# 4. Dependency function to get database sessions
# This is used by FastAPI to inject a database session into route functions
def get_db():
    """
    Dependency that provides a database session to route functions

    How it works:
    1. Creates a new session
    2. Yields it (gives it to the route function)
    3. After route finishes, closes the session (cleanup)

    This is the "Dependency Injection" pattern FastAPI uses
    """
    db = SessionLocal()  # Create a session
    try:
        yield db  # Give it to the route function
    finally:
        db.close()  # Always close when done (even if error occurs)
