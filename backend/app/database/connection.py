"""
PROJECT CHRONOS — THE GLITCH
Database Connection Management
SQLite is the single source of persistent game data.
"""

import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager

# Base database path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = os.getenv("CHRONOS_DB_PATH", str(BASE_DIR / "chronos.db"))


def get_db_connection() -> sqlite3.Connection:
    """
    Returns a standard sqlite3 connection configured with:
    - row_factory = sqlite3.Row for dict-like access
    - foreign keys enabled
    - WAL mode for concurrent access from multi-player PCs
    """
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


@contextmanager
def get_db():
    """
    Context manager dependency for FastAPI endpoints:
    with get_db() as conn:
        ...
    """
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
