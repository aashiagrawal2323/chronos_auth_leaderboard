"""
PROJECT CHRONOS — THE GLITCH
Admin & Host Routes
GET /api/host/leaderboard
GET /api/admin/leaderboard
"""

import os
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from ..database.connection import get_db
from ..models import HostLeaderboardEntry, AdminLoginRequest, AdminLoginResponse

router = APIRouter(tags=["admin"])

ADMIN_PASSWORD = os.getenv("CHRONOS_ADMIN_PASSWORD", "chronos2140")
ADMIN_SECRET_TOKEN = "CHRONOS_SUPERVISOR_SESSION_SECURE_2140"


def format_seconds(seconds: Optional[float]) -> str:
    if seconds is None:
        return "--:--"
    sec_int = int(seconds)
    mins = sec_int // 60
    secs = sec_int % 60
    return f"{mins:02d}:{secs:02d}"


@router.post("/api/admin/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest):
    if payload.password.strip() == ADMIN_PASSWORD:
        return AdminLoginResponse(success=True, token=ADMIN_SECRET_TOKEN, message="ACCESS_GRANTED")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid host passkey.")


@router.get("/api/host/leaderboard", response_model=List[HostLeaderboardEntry])
@router.get("/api/admin/leaderboard", response_model=List[HostLeaderboardEntry])
def get_host_leaderboard():
    """
    Host-only endpoint returning master table records ranked by:
    1. total_score DESCENDING
    2. r1_time_diff ASCENDING (tie-break)
    """
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
                    r1_time_formatted=format_seconds(r["r1_time_diff"]),
                    r1_score=float(r["r1_score"] or 0.0),
                    r1_scaled=float(r["r1_scaled"] or 0.0),
                    r2_score=float(r["r2_score"] or 0.0),
                    r3_score=float(r["r3_score"] or 0.0),
                    total_score=float(r["total_score"] or 0.0),
                    status=r["status"] or "ACTIVE",
                )
            )

        return results
