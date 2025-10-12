"""
Main Application Entry Point
-----------------------------
This is where everything comes together!

Run with: uvicorn main:app --reload
Visit: http://localhost:8000
API Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth

# ============================================================================
# CREATE DATABASE TABLES
# ============================================================================

# Create all tables defined in models
# Base.metadata.create_all() looks at all models (User, Task, etc.)
# and creates tables if they don't exist
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")


# ============================================================================
# CREATE FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="""
    ## Personal Task Manager API

    A RESTful API for managing tasks and projects.

    ### Features:
    - 🔐 User authentication with JWT tokens
    - ✅ Task management (CRUD operations)
    - 📁 Project organization
    - 🏷️  Task tagging and categorization
    - 🔍 Search and filtering

    ### Authentication:
    1. Register a new account at `/auth/register`
    2. Login at `/auth/login` to get JWT token
    3. Click "Authorize" button and enter token
    4. Now you can access protected endpoints!
    """,
    docs_url="/docs",      # Swagger UI documentation
    redoc_url="/redoc",    # ReDoc documentation (alternative style)
)


# ============================================================================
# CORS MIDDLEWARE
# ============================================================================

# CORS (Cross-Origin Resource Sharing) allows your API to be accessed
# from web browsers on different domains
# Example: Frontend at localhost:3000 can access API at localhost:8000

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React default
        "http://localhost:5173",  # Vite default
        "http://localhost:8080",  # Vue default
        # Add your frontend URL here when deployed
    ],
    allow_credentials=True,      # Allow cookies
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],         # Allow all headers
)


# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

# Include authentication routes
# All routes from auth router are now available
app.include_router(auth.router)

# Future routers will be added here:
# app.include_router(tasks.router)
# app.include_router(projects.router)
# app.include_router(tags.router)


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint - Welcome message

    This is the first endpoint users see when visiting the API
    """
    return {
        "message": "Welcome to Personal Task Manager API!",
        "docs": "/docs",
        "redoc": "/redoc",
        "version": settings.API_VERSION,
        "status": "running"
    }


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint

    Used by deployment platforms (like Render) to check if API is running
    Returns 200 OK if everything is working
    """
    return {
        "status": "healthy",
        "database": "connected"
    }


# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Run the application
    # This is only used when running: python main.py
    # Normally you run: uvicorn main:app --reload
    uvicorn.run(
        "main:app",
        host="0.0.0.0",    # Listen on all network interfaces
        port=8000,          # Port number
        reload=True         # Auto-reload on code changes (development only!)
    )
