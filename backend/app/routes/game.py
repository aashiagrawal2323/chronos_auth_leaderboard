"""
PROJECT CHRONOS — THE GLITCH
Game State & Progress Route
GET /api/game/state
"""

import json
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Header, status
from pydantic import BaseModel
from ..database.connection import get_db
from ..models import GameStateResponse

router = APIRouter(prefix="/api/game", tags=["game"])

# Server-authoritative round durations in minutes (Hard cap: 20 min total event)
ROUND_DURATIONS = {
    1: 300,  # 5 minutes for Round 1
    2: 480,  # 8 minutes for Round 2
    3: 420,  # 7 minutes for Round 3
}


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None


@router.get("/state", response_model=GameStateResponse)
def get_game_state(
    team_id: Optional[int] = Query(None, description="Team ID"),
    x_team_id: Optional[int] = Header(None, alias="X-Team-ID"),
):
    """
    GET /api/game/state
    Returns the server-authoritative current state, scores, and active timers.
    """
    resolved_team_id = team_id or x_team_id
    if not resolved_team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required team_id (via query parameter ?team_id= or X-Team-ID header).",
        )

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM teams WHERE id = ?", (resolved_team_id,))
        team = cursor.fetchone()

        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Team with ID {resolved_team_id} does not exist.",
            )

        now = get_utc_now()
        current_state = team["current_state"]

        active_round = None
        round_deadline = None
        time_remaining = None

        # Calculate server-authoritative timer if a round is currently active
        if current_state == "ROUND_1_ACTIVE" and team["round1_started_at"]:
            active_round = 1
            start_dt = parse_iso(team["round1_started_at"])
            if start_dt:
                deadline_dt = start_dt + timedelta(seconds=ROUND_DURATIONS[1])
                round_deadline = deadline_dt.isoformat()
                time_remaining = max(0, int((deadline_dt - now).total_seconds()))

        elif current_state == "ROUND_2_ACTIVE" and team["round2_started_at"]:
            active_round = 2
            start_dt = parse_iso(team["round2_started_at"])
            if start_dt:
                deadline_dt = start_dt + timedelta(seconds=ROUND_DURATIONS[2])
                round_deadline = deadline_dt.isoformat()
                time_remaining = max(0, int((deadline_dt - now).total_seconds()))

        elif current_state == "ROUND_3_ACTIVE" and team["round3_started_at"]:
            active_round = 3
            start_dt = parse_iso(team["round3_started_at"])
            if start_dt:
                deadline_dt = start_dt + timedelta(seconds=ROUND_DURATIONS[3])
                round_deadline = deadline_dt.isoformat()
                time_remaining = max(0, int((deadline_dt - now).total_seconds()))

        # Auto-timeout transition if timer elapsed
        if time_remaining == 0 and current_state in ("ROUND_1_ACTIVE", "ROUND_2_ACTIVE", "ROUND_3_ACTIVE"):
            # Update to TIMEOUT if expired
            cursor.execute(
                """
                UPDATE teams 
                SET current_state = 'TIMEOUT', updated_at = ?
                WHERE id = ?
                """,
                (now.isoformat(), resolved_team_id),
            )
            cursor.execute(
                """
                INSERT INTO game_logs (team_id, event_type, event_data, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    resolved_team_id,
                    "TIMEOUT",
                    json.dumps({"round": active_round, "reason": "Server round deadline exceeded"}),
                    now.isoformat(),
                ),
            )
            current_state = "TIMEOUT"

        return GameStateResponse(
            team_id=team["id"],
            team_name=team["team_name"],
            member_1_name=team["member_1_name"],
            member_2_name=team["member_2_name"],
            current_state=current_state,
            round1_score=team["round1_score"],
            round2_score=team["round2_score"],
            round3_score=team["round3_score"],
            total_score=team["total_score"],
            active_round=active_round,
            server_time=now.isoformat(),
            round_deadline=round_deadline,
            time_remaining_seconds=time_remaining,
            round1_started_at=team["round1_started_at"],
            round1_completed_at=team["round1_completed_at"],
            round2_started_at=team["round2_started_at"],
            round2_completed_at=team["round2_completed_at"],
            round3_started_at=team["round3_started_at"],
            round3_completed_at=team["round3_completed_at"],
            created_at=team["created_at"],
        )


class StateTransitionRequest(BaseModel):
    team_id: int
    target_state: str
    round1_score: Optional[int] = None
    round2_score: Optional[int] = None
    round3_score: Optional[int] = None
    note: Optional[str] = None


@router.post("/transition")
def transition_game_state(payload: StateTransitionRequest):
    """
    POST /api/game/transition
    Progression endpoint adhering to Section 9 state sequence.
    Updates scores and timestamps server-side.
    """
    VALID_STATES = [
        "REGISTERED",
        "READY",
        "ROUND_1_ACTIVE",
        "ROUND_1_COMPLETED",
        "ROUND_2_LOCKED",
        "ROUND_2_ACTIVE",
        "OMEGA_DISCOVERED",
        "ROUND_2_COMPLETED",
        "ROUND_3_ACTIVE",
        "DECISION_SUBMITTED",
        "FINAL_REVEAL",
        "COMPLETED",
        "TIMEOUT",
    ]

    if payload.target_state not in VALID_STATES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target state '{payload.target_state}'. Must be one of {VALID_STATES}",
        )

    now_iso = get_utc_now().isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM teams WHERE id = ?", (payload.team_id,))
        team = cursor.fetchone()

        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")

        # Prepare field updates
        r1 = payload.round1_score if payload.round1_score is not None else team["round1_score"]
        r2 = payload.round2_score if payload.round2_score is not None else team["round2_score"]
        r3 = payload.round3_score if payload.round3_score is not None else team["round3_score"]
        total = r1 + r2 + r3

        r1_start = team["round1_started_at"]
        r1_end = team["round1_completed_at"]
        r2_start = team["round2_started_at"]
        r2_end = team["round2_completed_at"]
        r3_start = team["round3_started_at"]
        r3_end = team["round3_completed_at"]

        # Timestamp triggers based on target state
        if payload.target_state == "ROUND_1_ACTIVE" and not r1_start:
            r1_start = now_iso
        elif payload.target_state == "ROUND_1_COMPLETED" and not r1_end:
            r1_end = now_iso
        elif payload.target_state == "ROUND_2_ACTIVE" and not r2_start:
            r2_start = now_iso
        elif payload.target_state == "ROUND_2_COMPLETED" and not r2_end:
            r2_end = now_iso
        elif payload.target_state == "ROUND_3_ACTIVE" and not r3_start:
            r3_start = now_iso
        elif payload.target_state in ("COMPLETED", "FINAL_REVEAL") and not r3_end:
            r3_end = now_iso

        cursor.execute(
            """
            UPDATE teams SET
                current_state = ?,
                round1_score = ?,
                round2_score = ?,
                round3_score = ?,
                total_score = ?,
                round1_started_at = ?,
                round1_completed_at = ?,
                round2_started_at = ?,
                round2_completed_at = ?,
                round3_started_at = ?,
                round3_completed_at = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                payload.target_state,
                r1,
                r2,
                r3,
                total,
                r1_start,
                r1_end,
                r2_start,
                r2_end,
                r3_start,
                r3_end,
                now_iso,
                payload.team_id,
            ),
        )

        # Audit log
        cursor.execute(
            """
            INSERT INTO game_logs (team_id, event_type, event_data, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                payload.team_id,
                payload.target_state,
                json.dumps({
                    "previous_state": team["current_state"],
                    "target_state": payload.target_state,
                    "scores": {"r1": r1, "r2": r2, "r3": r3, "total": total},
                    "note": payload.note or "State transitioned",
                }),
                now_iso,
            ),
        )

    return {
        "success": True,
        "team_id": payload.team_id,
        "new_state": payload.target_state,
        "total_score": total,
    }
