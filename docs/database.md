# PROJECT CHRONOS — DATABASE SPECIFICATION & ARCHITECTURE
**Document**: `database.md`  
**Location**: `docs/database.md`  
**Engine**: SQLite (Single Central Server, RDBMS with Foreign Keys Enabled)

---

## 1. Executive Summary
Project Chronos uses a single, centralized SQLite relational database on the main LAN server. A master `teams` table acts as the unified source of truth for participant PRNs, live timestamps, round timings, individual round scores, and computed total scores. Flexible secondary tables support Round 1 (image-based puzzle items and classification submissions), Round 2 (text logs, investigation memos, and AI chat transcripts), and Round 3 (team case assignments and final decisions). The system ensures real-time score synchronization, atomic transactions, and one-click export of any table to CSV for event administrators.

---

## 2. Database Description & System Architecture

### 2.1 Centralized Storage Model
Project Chronos employs a single, centralized relational database engine (`SQLite3`) hosted directly on the central LAN server (`chronos.db`). Player workstations across the venue connect to this unified database via the FastAPI backend. Individual player PCs **never** run isolated local databases.

### 2.2 Table Roles & Data Segregation
The schema is partitioned into functional subsystems:
1. **Master Core (`teams`)**: Persists team registration credentials, PRNs, state machine status, individual round timestamps, and aggregated scores.
2. **Round 1 Subsystem (`round1_items`, `round1_submissions`)**: Manages the 25 technology puzzle images, correct historical era classifications (`PAST`, `PRESENT`, `FUTURE`), and individual team answers with $+2/-1$ scoring.
3. **Round 2 Subsystem (`round2_files`, `round2_chat_messages`, `round2_submissions`)**: Manages project text audit logs (Alpha, Beta, Gamma), tracks restricted Gemini AI assistant queries (deducting 5, 5, 10 points), and records culprit findings.
4. **Round 3 Subsystem (`round3_team_cases`, `round3_submissions`)**: Stores procedurally generated/seeded case assignments to prevent cross-team answer leakage and records final culprit and supporting evidence submissions ($+30$ points).
5. **Telemetry & Audit Subsystem (`game_logs`)**: Records time-stamped system events, logins, transitions, and errors for live admin monitoring.

### 2.3 Concurrency, Locking & Integrity Constraints
* **Foreign Key Support**: Foreign key enforcement is explicitly activated on every SQLite connection (`PRAGMA foreign_keys = ON;`).
* **Write-Ahead Logging (WAL)**: Recommended for high-concurrency LAN setups (`PRAGMA journal_mode = WAL;`) allowing concurrent reads while writes are processed atomically.
* **Cascading Integrity**: Child tables linked to `team_id` enforce `ON DELETE CASCADE` to maintain relational cleanliness.
* **Server-Authoritative Scores**: The backend recalculates `total_score` and `r1_time_diff` atomically within database transactions, preventing client-side score manipulation.

---

## 3. SQL DDL Schema

### 3.1 Central Master Table: `teams`
```sql
CREATE TABLE IF NOT EXISTS teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT NOT NULL UNIQUE,
    member1_name TEXT NOT NULL,
    member2_name TEXT NOT NULL,
    member1_prn TEXT NOT NULL,
    member2_prn TEXT NOT NULL,
    
    -- Round 1 Timings & Scores
    r1_start_time DATETIME,
    r1_end_time DATETIME,
    r1_time_diff FLOAT,                  -- Duration in seconds (e.g. 142.50)
    r1_score FLOAT DEFAULT 0.0,          -- Raw points (+2 / -1)
    r1_scaled FLOAT DEFAULT 0.0,         -- Scaled/normalized score if applicable
    
    -- Round 2 & Round 3 Scores
    r2_score FLOAT DEFAULT 0.0,          -- Investigation (max 50: 30 culprit + 20 AI balance)
    r3_score FLOAT DEFAULT 0.0,          -- Final Decision (max 30)
    total_score FLOAT DEFAULT 0.0,       -- Sum of r1_score/r1_scaled + r2_score + r3_score
    
    -- Game Progression & Timestamps
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'FINISHED', 'DISQUALIFIED')),
    current_state TEXT DEFAULT 'REGISTERED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Round 1 Tables
```sql
CREATE TABLE IF NOT EXISTS round1_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    correct_era TEXT NOT NULL CHECK(correct_era IN ('PAST', 'PRESENT', 'FUTURE')),
    clue_text TEXT,
    points_positive FLOAT DEFAULT 2.0,
    points_negative FLOAT DEFAULT 1.0,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS round1_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    selected_era TEXT NOT NULL CHECK(selected_era IN ('PAST', 'PRESENT', 'FUTURE')),
    is_correct INTEGER NOT NULL,
    points_awarded FLOAT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES round1_items(item_id)
);
```

### 3.3 Round 2 Tables
```sql
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
    points_deducted FLOAT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS round2_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    suspect_identified TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    points_awarded FLOAT NOT NULL,
    ai_points_remaining FLOAT NOT NULL,
    round2_total_score FLOAT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);
```

### 3.4 Round 3 Tables
```sql
CREATE TABLE IF NOT EXISTS round3_team_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER UNIQUE NOT NULL,
    case_id TEXT NOT NULL,
    culprit_candidate_id TEXT NOT NULL,
    valid_evidence_ids TEXT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS round3_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    selected_candidate_id TEXT NOT NULL,
    selected_evidence_ids TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    points_awarded FLOAT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);
```

### 3.5 Global Audit Table
```sql
CREATE TABLE IF NOT EXISTS game_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL
);
```
