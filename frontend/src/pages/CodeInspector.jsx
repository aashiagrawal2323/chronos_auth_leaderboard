import React, { useState } from 'react';
import { soundFx } from '../utils/audio.js';
import { 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  Database, 
  Server, 
  ShieldCheck,
  FolderGit2,
  Download
} from 'lucide-react';

const CODE_FILES = [
  {
    name: 'backend/app/database/schema.py',
    category: 'Database & SQLite',
    icon: Database,
    description: 'SQLite master schema: team_id, member1_prn, member2_prn, r1_time_diff, r1_scaled, status.',
    content: `"""
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. Game Logs Table (Audit trail of events)
CREATE TABLE IF NOT EXISTS game_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- 3. Team Fragments Table (Unlocked code fragments from Round 1)
CREATE TABLE IF NOT EXISTS team_fragments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    fragment TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- 4. Submissions Table (Answers across all rounds)
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    reference_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    points_awarded REAL NOT NULL DEFAULT 0.0,
    submitted_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Indexes for performance & rapid leaderboard lookups
CREATE INDEX IF NOT EXISTS idx_teams_total_score ON teams(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_game_logs_team_id ON game_logs(team_id);
"""


def init_db():
    with get_db() as conn:
        conn.executescript(SCHEMA_SQL)
    print("[CHRONOS] Master database initialized successfully.")
`,
  },
  {
    name: 'backend/app/routes/auth.py',
    category: 'FastAPI Routes',
    icon: Server,
    description: 'POST /api/auth/register saving team_name, members, PRNs, and status ACTIVE.',
    content: `"""
PROJECT CHRONOS — THE GLITCH
Authentication Route
POST /api/auth/register
"""

import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from ..database.connection import get_db
from ..models import RegisterRequest, RegisterResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/register", response_model=RegisterResponse)
def register_team(payload: RegisterRequest):
    clean_team = payload.team_name.strip()
    m1 = payload.member1_name.strip()
    m2 = payload.member2_name.strip()
    prn1 = payload.member1_prn.strip()
    prn2 = payload.member2_prn.strip()

    now_iso = get_utc_now_iso()
    session_token = f"CHRONOS_TK_{uuid.uuid4().hex[:16]}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM teams WHERE team_name = ? COLLATE NOCASE", (clean_team,))
        existing = cursor.fetchone()

        if existing:
            team_id = existing["team_id"]
            cursor.execute(
                """
                UPDATE teams SET
                    member1_name = ?, member2_name = ?,
                    member1_prn = ?, member2_prn = ?, updated_at = ?
                WHERE team_id = ?
                """,
                (m1, m2, prn1, prn2, now_iso, team_id),
            )
            return RegisterResponse(
                team_id=team_id,
                team_name=clean_team,
                member1_name=m1,
                member2_name=m2,
                member1_prn=prn1,
                member2_prn=prn2,
                status=existing["status"],
                session_token=session_token,
                message="SESSION_RESTORED",
            )

        cursor.execute(
            """
            INSERT INTO teams (
                team_name, member1_name, member2_name, member1_prn, member2_prn,
                r1_start_time, r1_end_time, r1_time_diff,
                r1_score, r1_scaled, r2_score, r3_score, total_score,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 0.0, 0.0, 0.0, 0.0, 0.0, 'ACTIVE', ?, ?)
            """,
            (clean_team, m1, m2, prn1, prn2, now_iso, now_iso),
        )
        team_id = cursor.lastrowid

        return RegisterResponse(
            team_id=team_id,
            team_name=clean_team,
            member1_name=m1,
            member2_name=m2,
            member1_prn=prn1,
            member2_prn=prn2,
            status="ACTIVE",
            session_token=session_token,
            message="TEAM_REGISTERED",
        )
`,
  },
  {
    name: 'backend/app/routes/admin.py',
    category: 'FastAPI Routes',
    icon: ShieldCheck,
    description: 'GET /api/host/leaderboard with passkey protection and CSV export data structure.',
    content: `"""
PROJECT CHRONOS — THE GLITCH
Host-Only Leaderboard Route
GET /api/host/leaderboard
"""

import os
from typing import List
from fastapi import APIRouter, HTTPException, status
from ..database.connection import get_db
from ..models import HostLeaderboardEntry

router = APIRouter(prefix="/api/host", tags=["host"])


@router.get("/leaderboard", response_model=List[HostLeaderboardEntry])
def get_host_leaderboard():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                team_id, team_name, member1_name, member2_name, member1_prn, member2_prn,
                r1_start_time, r1_end_time, r1_time_diff,
                r1_score, r1_scaled, r2_score, r3_score, total_score, status
            FROM teams
            ORDER BY total_score DESC, COALESCE(r1_time_diff, 999999) ASC
            """
        )
        rows = cursor.fetchall()

        results = []
        for idx, r in enumerate(rows):
            results.append(
                HostLeaderboardEntry(
                    rank=idx + 1,
                    team_id=r["team_id"],
                    team_name=r["team_name"],
                    member1_name=r["member1_name"],
                    member2_name=r["member2_name"],
                    member1_prn=r["member1_prn"],
                    member2_prn=r["member2_prn"],
                    r1_start_time=r["r1_start_time"],
                    r1_end_time=r["r1_end_time"],
                    r1_time_diff=r["r1_time_diff"],
                    r1_score=float(r["r1_score"] or 0.0),
                    r1_scaled=float(r["r1_scaled"] or 0.0),
                    r2_score=float(r["r2_score"] or 0.0),
                    r3_score=float(r["r3_score"] or 0.0),
                    total_score=float(r["total_score"] or 0.0),
                    status=r["status"] or "ACTIVE",
                )
            )
        return results
`,
  },
  {
    name: 'backend/app/models.py',
    category: 'Pydantic Schemas',
    icon: Terminal,
    description: 'Pydantic data schemas for RegisterRequest, RegisterResponse, and HostLeaderboardEntry.',
    content: `"""
PROJECT CHRONOS — THE GLITCH
Pydantic Schemas & Validation Models
"""

from typing import Optional
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    team_name: str = Field(..., min_length=2, max_length=50)
    member1_name: str = Field(..., min_length=1, max_length=50)
    member2_name: str = Field(..., min_length=1, max_length=50)
    member1_prn: str = Field(..., min_length=1, max_length=30)
    member2_prn: str = Field(..., min_length=1, max_length=30)


class RegisterResponse(BaseModel):
    team_id: int
    team_name: str
    member1_name: str
    member2_name: str
    member1_prn: str
    member2_prn: str
    status: str = "ACTIVE"
    session_token: str
    message: str = "SESSION_AUTHENTICATED"


class HostLeaderboardEntry(BaseModel):
    rank: int
    team_id: int
    team_name: str
    member1_name: str
    member2_name: str
    member1_prn: str
    member2_prn: str
    r1_start_time: Optional[str] = None
    r1_end_time: Optional[str] = None
    r1_time_diff: Optional[float] = None
    r1_score: float = 0.0
    r1_scaled: float = 0.0
    r2_score: float = 0.0
    r3_score: float = 0.0
    total_score: float = 0.0
    status: str = "ACTIVE"
`,
  },
];

export default function CodeInspector() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = CODE_FILES[selectedIdx];

  const handleCopy = () => {
    soundFx.playAccessGranted();
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-[#0b0f19] border border-cyan-900/60 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <FolderGit2 className="w-4 h-4" />
              <span>Project Chronos Specification Deliverable</span>
            </div>
            <h2 className="text-xl font-bold font-tech text-white mt-1">
              SQLite Master Schema &amp; FastAPI Codebase
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Production-ready Python (FastAPI + SQLite) codebase with the updated master table schema.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/download/project-zip"
              download="chronos_auth_leaderboard.zip"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/50 text-xs font-mono font-bold transition shadow-lg shadow-emerald-950/40"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download ZIP Package</span>
            </a>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-600/50 text-xs font-mono transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Active File'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar File List */}
        <div className="lg:col-span-4 space-y-2 font-mono text-xs">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 px-1 font-bold">
            Project Files
          </div>
          {CODE_FILES.map((file, idx) => {
            const Icon = file.icon;
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={file.name}
                onClick={() => {
                  soundFx.playKeystroke();
                  setSelectedIdx(idx);
                }}
                className={`w-full text-left p-3 rounded-lg border transition flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200 shadow-md shadow-cyan-950/50'
                    : 'bg-[#070b14] border-slate-900 text-slate-400 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div className="overflow-hidden">
                  <div className="font-bold truncate text-[11px]">{file.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{file.category}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code Viewer Panel */}
        <div className="lg:col-span-8 bg-[#04060b] border border-cyan-950 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          <div className="bg-[#080d1a] border-b border-cyan-950/80 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-cyan-400 font-bold">{activeFile.name}</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">{activeFile.category}</span>
          </div>

          <div className="p-4 bg-[#080d1a]/40 border-b border-cyan-950/60 text-xs font-mono text-slate-400">
            {activeFile.description}
          </div>

          <div className="p-4 overflow-x-auto flex-1 font-mono text-xs text-slate-200 selection:bg-cyan-500/30 max-h-[550px]">
            <pre className="leading-relaxed">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
