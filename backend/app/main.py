"""
PROJECT CHRONOS — THE GLITCH
Central Server Entry Point
FastAPI + SQLite Backend
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.schema import init_db
from .routes import auth, game, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure SQLite database schema & tables are initialized
    print("[CHRONOS] Initializing database...")
    init_db()
    yield
    # Shutdown
    print("[CHRONOS] Server shutting down cleanly.")


app = FastAPI(
    title="PROJECT CHRONOS: THE GLITCH — API Server",
    description="Central authoritative server for temporal investigation game, authentication, state management, and live leaderboard.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for React frontend (LAN connections and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all LAN participant PC connections
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(game.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "system": "PROJECT CHRONOS CENTRAL TIMELINE MAINFRAME",
        "status": "ONLINE",
        "year": 2140,
        "docs_url": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "database": "SQLITE_READY",
        "chronos_status": "CORRUPTED",
    }


if __name__ == "__main__":
    import uvicorn
    # LAN binding on 0.0.0.0:8000
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
