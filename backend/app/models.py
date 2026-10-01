"""
PROJECT CHRONOS — THE GLITCH
Pydantic Schemas & Validation Models
"""

from typing import Optional, List, Any
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    team_name: str = Field(..., min_length=2, max_length=50, description="Unique callsign of the 2-player team")
    member1_name: str = Field(..., min_length=1, max_length=50, description="Name of player 1")
    member2_name: str = Field(..., min_length=1, max_length=50, description="Name of player 2")
    member1_prn: str = Field(..., min_length=1, max_length=30, description="PRN / Student ID of player 1")
    member2_prn: str = Field(..., min_length=1, max_length=30, description="PRN / Student ID of player 2")


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


# Backward compatibility model for /api/auth/login
class LoginRequest(BaseModel):
    team_name: str
    member_1_name: Optional[str] = None
    member_2_name: Optional[str] = None
    member1_name: Optional[str] = None
    member2_name: Optional[str] = None
    member1_prn: Optional[str] = None
    member2_prn: Optional[str] = None


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
    r1_time_formatted: Optional[str] = None
    r1_score: float = 0.0
    r1_scaled: float = 0.0
    r2_score: float = 0.0
    r3_score: float = 0.0
    total_score: float = 0.0
    status: str = "ACTIVE"


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    token: str
    message: str
