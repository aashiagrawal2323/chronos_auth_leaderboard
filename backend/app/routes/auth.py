"""
PROJECT CHRONOS — THE GLITCH
Authentication Routes
POST /api/auth/register (New Specification)
POST /api/auth/login    (Session restore / compatibility)
"""

import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from ..database.connection import get_db
from ..models import RegisterRequest, RegisterResponse, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/register", response_model=RegisterResponse)
def register_team(payload: RegisterRequest):
    """
    POST /api/auth/register
    Accepts:
      - team_name
      - member1_name
      - member2_name
      - member1_prn
      - member2_prn
    Saves to SQLite table 'teams' with status 'ACTIVE'.
    Generates a unique session_token and returns team credentials.
    """
    clean_team = payload.team_name.strip()
    m1 = payload.member1_name.strip()
    m2 = payload.member2_name.strip()
    prn1 = payload.member1_prn.strip()
    prn2 = payload.member2_prn.strip()

    if not clean_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name designation is required.",
        )
    if not m1 or not m2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both Member 1 and Member 2 names are required.",
        )
    if not prn1 or not prn2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PRN credentials for both Member 1 and Member 2 are required.",
        )

    now_iso = get_utc_now_iso()
    session_token = f"CHRONOS_TK_{uuid.uuid4().hex[:16]}"

    with get_db() as conn:
        cursor = conn.cursor()

        # Check existing team
        cursor.execute(
            "SELECT * FROM teams WHERE team_name = ? COLLATE NOCASE",
            (clean_team,),
        )
        existing = cursor.fetchone()

        if existing:
            # Restore existing session / update info
            team_id = existing["team_id"]
            current_status = existing["status"]

            cursor.execute(
                """
                UPDATE teams SET
                    member1_name = ?,
                    member2_name = ?,
                    member1_prn = ?,
                    member2_prn = ?,
                    updated_at = ?
                WHERE team_id = ?
                """,
                (m1, m2, prn1, prn2, now_iso, team_id),
            )

            # Audit log
            cursor.execute(
                """
                INSERT INTO game_logs (team_id, event_type, event_data, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    team_id,
                    "REGISTER_RESUME",
                    json.dumps({
                        "team_name": clean_team,
                        "members": [m1, m2],
                        "prns": [prn1, prn2],
                        "status": current_status,
                    }),
                    now_iso,
                ),
            )

            return RegisterResponse(
                team_id=team_id,
                team_name=clean_team,
                member1_name=m1,
                member2_name=m2,
                member1_prn=prn1,
                member2_prn=prn2,
                status=current_status,
                session_token=session_token,
                message="SESSION_RESTORED",
            )

        # Create new active team
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

        # Audit log
        cursor.execute(
            """
            INSERT INTO game_logs (team_id, event_type, event_data, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                team_id,
                "REGISTER_NEW",
                json.dumps({
                    "team_name": clean_team,
                    "members": [m1, m2],
                    "prns": [prn1, prn2],
                    "status": "ACTIVE",
                }),
                now_iso,
            ),
        )

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


@router.post("/login")
def login_compat(payload: LoginRequest):
    """Compatibility route mapping to register logic."""
    clean_team = payload.team_name.strip()
    m1 = (payload.member1_name or payload.member_1_name or "Operator 1").strip()
    m2 = (payload.member2_name or payload.member_2_name or "Operator 2").strip()
    p1 = (payload.member1_prn or "PRN-101").strip()
    p2 = (payload.member2_prn or "PRN-102").strip()

    req = RegisterRequest(
        team_name=clean_team,
        member1_name=m1,
        member2_name=m2,
        member1_prn=p1,
        member2_prn=p2,
    )
    return register_team(req)
