# PROJECT CHRONOS — Backend (FastAPI + SQLite)

Module: **Auth, State Management & Admin Leaderboard**  
Authors: Aashi & Parth

## Setup & Running

1. **Create virtualenv & install dependencies**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Start the FastAPI server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **API Documentation**:
   - Swagger Interactive UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## Database Architecture (SQLite)
The database file `chronos.db` is automatically created on startup with tables:
- `teams`: All registered teams, member names, scores (`round1_score`, `round2_score`, `round3_score`, `total_score`), timestamps, and `current_state`.
- `game_logs`: Audit trail for all state changes (`LOGIN`, `ROUND_STARTED`, `TIMEOUT`, `COMPLETED`, etc.).
- `team_fragments`, `submissions`, `hints`, `investments`: Provided for Rounds 1, 2, and 3 modules to seamlessly query/insert.

## Environment Variables
- `CHRONOS_DB_PATH`: Custom path to sqlite database file (default: `./chronos.db`)
- `CHRONOS_ADMIN_PASSWORD`: Password for admin login (default: `chronos2140`)

## Endpoints Implemented
- `POST /api/auth/login`: Team login / session restore
- `GET /api/game/state`: Real-time server-authoritative team state & active timer
- `POST /api/game/transition`: Progress team state and update round scores
- `POST /api/admin/login`: Coordinator login
- `GET /api/admin/teams`: List all teams
- `GET /api/admin/leaderboard`: Ranks teams by total_score DESC with completion time tie-breaker
- `GET /api/admin/logs`: Audit logs with filters
- `POST /api/admin/reset-team/{team_id}`: Recover corrupted or crashed participant team
- `POST /api/admin/seed-demo`: Seed test teams for leaderboard display
