"""
PROJECT CHRONOS — THE GLITCH
Database Schema Definition (SQLite / SQLAlchemy Compatible)
Adheres strictly to the master schema specification.
"""

from .connection import get_db

SCHEMA_SQL = """
-- 1. Master Teams Table
CREATE TABLE IF NOT EXISTS teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    member1_name TEXT NOT NULL,
    member2_name TEXT NOT NULL,
    member1_prn TEXT NOT NULL,
    member2_prn TEXT NOT NULL,
    r1_start_time TEXT,
    r1_end_time TEXT,
    r1_time_diff REAL,
    r1_score REAL NOT NULL DEFAULT 0.0,
    r1_scaled REAL NOT NULL DEFAULT 0.0,
    r2_score REAL NOT NULL DEFAULT 0.0,
    r3_score REAL NOT NULL DEFAULT 0.0,
    total_score REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    current_state TEXT NOT NULL DEFAULT 'REGISTERED',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. Round 1 Tables
CREATE TABLE IF NOT EXISTS round1_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    correct_era TEXT NOT NULL CHECK(correct_era IN ('PAST', 'PRESENT', 'FUTURE')),
    clue_text TEXT,
    points_positive REAL DEFAULT 2.0,
    points_negative REAL DEFAULT 1.0,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS round1_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    selected_era TEXT NOT NULL CHECK(selected_era IN ('PAST', 'PRESENT', 'FUTURE')),
    is_correct INTEGER NOT NULL,
    points_awarded REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES round1_items(item_id)
);

-- 3. Round 2 Tables
CREATE TABLE IF NOT EXISTS round2_files (
    file_id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    timeline_tag TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_text TEXT NOT NULL,
    is_locked INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS round2_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    question_number INTEGER NOT NULL,
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    points_deducted REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS round2_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    suspect_identified TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    points_awarded REAL NOT NULL,
    ai_points_remaining REAL NOT NULL,
    round2_total_score REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- 4. Round 3 Tables
CREATE TABLE IF NOT EXISTS round3_team_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER UNIQUE NOT NULL,
    case_id TEXT NOT NULL,
    culprit_candidate_id TEXT NOT NULL,
    valid_evidence_ids TEXT NOT NULL,
    assigned_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS round3_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    selected_candidate_id TEXT NOT NULL,
    selected_evidence_ids TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    points_awarded REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- 5. Audit Game Logs Table
CREATE TABLE IF NOT EXISTS game_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Indexes for performance & rapid leaderboard lookups
CREATE INDEX IF NOT EXISTS idx_teams_total_score ON teams(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_game_logs_team_id ON game_logs(team_id);
"""


def init_db():
    """Initializes tables and indexes in the SQLite database."""
    with get_db() as conn:
        conn.executescript(SCHEMA_SQL)
        print("[CHRONOS] Master database initialized successfully.")
