# PROJECT CHRONOS — THE GLITCH (2140)

An interactive cyberpunk event platform engineered for dual-operator registration, authoritative synchronization, and a supervisor leaderboard with dynamic podium stairs.

---

## 🌟 Key Features

- **Dual-Operator Participant Portal (Port 3000):**
  - Atmospheric 5-second cinematic glitch landing.
  - Team Name registration with Member 1 & Member 2 full names and university PRN credentials.
  - Automatic `team_id` primary key assignment and session generation.
  - Pre-lobby launch screen with authoritative start timer (`r1_start_time`).
  - **Zero player access or links to the leaderboard.**

- **Isolated Master Host Leaderboard (Port 3001):**
  - Dedicated local port (`http://localhost:3001`) preventing player visibility.
  - Dynamic Top-3 Podium Stairs (Rank 1 Gold with crown, Rank 2 Cyan, Rank 3 Bronze).
  - Passkey protection (`chronos2140`).
  - Real-time 5-second auto-sync with SQLite database.
  - 1-Click CSV export for judges.

- **Authoritative Central SQLite Database:**
  - Complete schema for teams, classifications, puzzle rounds, and audit logs.
  - Strict tie-breaker algorithm: Primary ranking by `total_score` DESC, then lowest `r1_time_diff` (seconds) ASC.

---

## 🚀 Quick Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Dual-Port System
```bash
npm run dev
```

- **Participant Authentication:** [http://localhost:3000](http://localhost:3000)
- **Host Leaderboard:** [http://localhost:3001](http://localhost:3001)

---

## 📂 Project Structure

```text
├── chronos.db               # Central SQLite Master database
├── docs/
│   └── database.md          # Complete database architecture specification
├── public/
│   └── leaderboard.html     # Standalone Host Leaderboard with Podium Stairs
├── frontend/
│   └── src/
│       ├── context/         # AuthContext with auto-healing sessions
│       ├── pages/           # LandingGlitch, Register, Round1PreLobby
│       ├── services/        # Centralized API service
│       └── utils/           # Web Audio API sound synthesis
├── server.ts                # Express engine with dual-port listening (3000 & 3001)
├── package.json             # Scripts & dependencies
├── RUN_LOCALLY.md           # Step-by-step local Wi-Fi guide
└── README.md                # Repository overview
```

---

## 🔒 Security & Passkeys
- **Host / Judge Passkey:** `chronos2140`
