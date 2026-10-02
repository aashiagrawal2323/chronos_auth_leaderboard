# PROJECT CHRONOS — THE GLITCH (2140)

An interactive cyberpunk event platform engineered for dual-operator team authentication, cinematic GSAP motion sequences, authoritative time synchronization, and an isolated supervisor leaderboard with dynamic podium stairs.

---

## 🌟 Architecture & Key Features

### 1. Participant Portal (`http://localhost:3000`)
- **Landing Page (`LandingGlitch.jsx`)**:
  - Immersive cyber-matrix background with neon cyan (`#06b6d4`) and pink (`#ec4899`) particle stream.
  - Interactive **CHRONOS** title with procedural symbol/number corruption glitch (`0123456789Δ∑ΨΩΞ!#%@...`), micro-jitter transforms, and electric split text shadows.
  - Non-generic terminal fault readout: `FAULT | ERR::Ω-7741 · NODE-7 OFFLINE · T+2140.09.01`.
  - Flanked by high-definition AI Club and SymbiTech partner insignia.
  - Global typography: **Share Tech** for telemetry & data readouts; **Super Sliced Font** for primary titles.
  - Double-click protection on **START MISSION** to prevent duplicate audio triggers.

- **CRT TV Power-Off Transition (`CrtShutdown.jsx`)**:
  - Classic retro CRT TV shutdown animation triggered directly when clicking **START MISSION**.
  - Synchronized with `public/sounds/CRT.mp3` calibrated to volume `0.35` for balanced acoustics.
  - Vertical screen collapse into a razor-thin phosphor beam along center screen.
  - Electric cyan phosphor hold (`#00f0ff` / `#06b6d4` / white hot core) with high-intensity bloom and scanline raster.
  - Horizontal inward collapse from left and right into a pinpoint center dot.
  - Multi-step phosphor decay flicker before disappearing into deep void black.
  - Seamless, glitch-free handoff into the cinematic intro.

- **Cinematic Motion Intro (`public/intro/project-chronos.html`)**:
  - Fullscreen GSAP cinematic sequence triggered upon clicking **START MISSION**.
  - **Zero-Cursor Immersion**: Cursor hidden (`cursor: none !important`) across all intro containers and iframes for a movie theater cinematic experience.
  - **Phase 1 (System Boot)**: Diagonal scanlines, particle telemetry build, and `boot.wav` power-up sound.
  - **Phase 2 (Panel Distortion)**: Kinetic sliding geometry panels with dual whooshes (`woosh2.mp3` at 0s, `woosh1.mp3` at 0.72s).
  - **Phase 3 (Beat Cuts)**: Rapid-fire letter & shape flash sequences driven by trimmed instantaneous `Woosh3.mp3`.
  - **Phase 4 (Energy Sweep & Title Lock-in)**: Dual diagonal energy wipes and masked `PROJECT CHRONOS` drop-in with `reveal.wav` cinematic chord.
  - **Phase 5 (Glitch & Containment Fade)**: "THE GLITCH" subtitle reveal, ambient glow pulses, and punchy `glitch.mp3` distortion fade.
  - Seamless bridge: Emits `postMessage('CHRONOS_INTRO_DONE')` to transition directly to Team Authentication.

- **Authoritative Team Authentication (`Register.jsx` & `server.ts`)**:
  - Spacious, high-legibility terminal card layout (`max-w-3xl`).
  - Strict dual-operator credentials:
    - `Team Name (Callsign)`
    - `Member 1 Name & PRN (Student ID)`
    - `Member 2 Name & PRN (Student ID)`
  - **Callsign PRN Verification**:
    - **Returning Teams**: If a team name already exists, the server verifies both PRNs against the database (case-insensitive & order-flexible).
    - **Integrity Lock**: Valid re-logins grant access **without modifying or overwriting** registered member names or PRNs in the database.
    - **Rejection Notice**: If PRNs do not match, the system securely rejects entry: `"Engineers have been already assigned with this Callsign name."`
    - **New Teams**: Receive consecutive, sequential team IDs (`MAX(team_id) + 1`) to eliminate numbering gaps.
  - Color palette aligned with landing page: deep void `#05070c`, neon cyan `#06b6d4`, pink `#ec4899`, and deep card surface `#070c18`.
  - Dynamic Web Audio synthesis for keystroke feedback and glitch alerts.

- **Pre-Lobby Protocol & Session Persistence (`Round1PreLobby.jsx` & `AuthContext.jsx`)**:
  - **Reload Persistence**: Reloading the page while logged in automatically retains the team inside the Pre-Lobby rather than resetting to the landing page.
  - **Dedicated LOGOUT**: Direct Log Out button in the header row allows teams to securely clear local sessions and return to the main landing terminal.
  - Authoritative start timer (`r1_start_time`) recorded in SQLite database upon starting Round 1.
  - Zero participant access or links to supervisor leaderboard.

---

### 2. Isolated Master Host Leaderboard (`http://localhost:3001/leaderboard.html`)
- **Dedicated Independent Port (3001)**: Fully segregated from player network traffic.
- **Super Sliced Typography**: Header title rendered in official custom `Super Sliced` cyberpunk font.
- **Clean Branding**: Streamlined header with official AI Club and SymbiTech partner logos.
- **Dynamic Podium Stairs**: Top-3 visual podium (Rank 1 Gold with crown, Rank 2 Cyan, Rank 3 Bronze).
- **Security & Authorization**: Protected by supervisor passkey (`chronos2140`).
- **Real-Time Synchronization**: 5-second polling interval querying central SQLite database.
- **Judge Tools**: 1-click CSV export and manual score adjusters.

---

### 3. Central Authoritative Database (`chronos.db`)
- Complete SQLite schema for teams, classifications, puzzle rounds, and audit logs.
- Strict tie-breaker algorithm: Primary ranking by `total_score` DESC, then lowest `r1_time_diff` (seconds) ASC.
- Auto-updating `updated_at` timestamps on re-logins and event audits recorded to `game_logs`.

---

## 🔊 Sound Design & Assets

All sound effects are preloaded into memory before playback to eliminate lag:

| Asset | Type | Trigger Moment |
|---|---|---|
| `public/sounds/CRT.mp3` | Audio (MP3) | START MISSION CRT TV shutdown transition (Volume: 0.35) |
| `public/sounds/boot.wav` | Audio (WAV) | Intro Phase 1 power-on |
| `public/sounds/woosh1.mp3` | Audio (MP3) | Intro Phase 2 (0.72s panel wave) & Phase 4 wipe |
| `public/sounds/woosh2.mp3` | Audio (MP3) | Intro Phase 2 (0.0s panel start) & Phase 4 wipe |
| `public/sounds/Woosh3.mp3` | Audio (MP3) | Intro Phase 3 rapid letter-switching cuts |
| `public/sounds/reveal.wav` | Audio (WAV) | Intro Phase 4 title reveal chord |
| `public/sounds/glitch.mp3` | Audio (MP3) | Intro Phase 5 lock-in & final ending fade |
| `public/sounds/glitch2.mp3` | Audio (MP3) | Secondary distortion effect |

---

## 🚀 Quick Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the System (Single-Command Runtime)
```bash
npm run dev
```

This starts `server.ts` with `tsx watch` hot-reloading:
- **Participant Authentication Portal**: [http://localhost:3000](http://localhost:3000)
- **Host Leaderboard**: [http://localhost:3001/leaderboard.html](http://localhost:3001/leaderboard.html)

### 3. Production Build
```bash
npm run build
```

---

## 📂 Project Directory Structure

```text
├── chronos.db                            # Central SQLite Master database
├── docs/
│   └── database.md                       # Complete database architecture specification
├── public/
│   ├── fonts/
│   │   └── SuperSliced.ttf               # Super Sliced title typography
│   ├── intro/
│   │   └── project-chronos.html          # Cinematic GSAP intro player (cursor: none)
│   ├── sounds/                           # Cleaned sound effect library
│   │   ├── CRT.mp3
│   │   ├── boot.wav
│   │   ├── woosh1.mp3
│   │   ├── woosh2.mp3
│   │   ├── Woosh3.mp3
│   │   ├── reveal.wav
│   │   ├── glitch.mp3
│   │   └── glitch2.mp3
│   ├── images/                           # Club & sponsor logo assets
│   │   ├── AI club.png                   # AI Club official insignia
│   │   └── SymbiTech.png                 # SymbiTech official insignia
│   └── leaderboard.html                  # Standalone Host Leaderboard with Super Sliced Font
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ChronosIntro.jsx          # Fullscreen intro iframe bridge
│       │   ├── ChronosTitle.jsx          # Interactive glitching title component
│       │   └── CrtShutdown.jsx           # Retro CRT TV power-off animation
│       ├── context/
│       │   └── AuthContext.jsx           # Resilient session persistence & state sync
│       ├── pages/
│       │   ├── LandingGlitch.jsx         # Landing page with terminal fault UI
│       │   ├── Register.jsx              # Team Authentication portal
│       │   ├── Round1PreLobby.jsx        # Pre-lobby holding area with LOGOUT
│       │   └── HostLeaderboard.jsx       # Host Leaderboard component
│       ├── services/
│       │   └── api.js                    # Central API client
│       └── utils/
│           └── audio.js                  # Web Audio synthesis & CRT audio player
├── backend/                              # Preserved backend repository
├── server.ts                             # Central Express engine (Port 3000 & 3001)
├── package.json
└── README.md
```

---

## 🔒 Passkeys & Access
- **Host / Judge Passkey:** `chronos2140`
