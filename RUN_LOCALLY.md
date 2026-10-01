# PROJECT CHRONOS — THE GLITCH (2140)
## Multi-Port Local Run & GitHub Deployment Guide

A fully self-contained cyberpunk event management system with **strictly isolated endpoints**:
1. **Participant Portal (Port 3000):** Glitch landing page, dual-operator registration (Names + PRNs), unique Team ID assignment, and Round 1 pre-lobby. Contains **zero links or views** of the leaderboard.
2. **Host / Supervisor Leaderboard (Port 3001):** Isolated on a dedicated port (`http://localhost:3001`). Top-3 podium stairs, passkey protection (`chronos2140`), live SQLite synchronization every 5s, and 1-click CSV export.

---

## 🚀 Quick Start (2 Commands)

### Prerequisites:
- **Node.js** (v18 or higher)
- **npm** (included with Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Services
```bash
npm run dev
```

Both portals start automatically on their own dedicated local ports:
- 🎮 **Players / Participants (Auth & Game):** [http://localhost:3000](http://localhost:3000)
- 🏆 **Host / Judges Only (Leaderboard):** [http://localhost:3001](http://localhost:3001)  
  *(Supervisor Passkey: `chronos2140`)*

---

## 🌐 Running for Multiple Devices on Local Wi-Fi / LAN

To let players register from their laptops/phones while the leaderboard runs on the host projector:
1. Find your computer's local IP address:
   - **Windows:** Run `ipconfig` (e.g. `192.168.1.50`)
   - **Mac / Linux:** Run `ifconfig` or `ip a`
2. **Give participants only this link:** `http://192.168.1.50:3000`  
   *(Participants will only see their login/round screen and cannot view other scores)*
3. **Display on the Host Projector:** `http://192.168.1.50:3001`  
   *(Requires passkey `chronos2140`)*

---

## 📦 Pushing Directly to GitHub

This repository is pre-cleaned with `.gitignore`, `package.json`, and clean directory structure.

```bash
git init
git add .
git commit -m "feat: Project Chronos dual-operator auth & isolated leaderboard"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

---

## 📁 Architecture Overview
- `server.ts`: Express + Vite full-stack engine running on `0.0.0.0:3000` (players) and `0.0.0.0:3001` (host leaderboard).
- `public/leaderboard.html`: Standalone host dashboard featuring the Top 3 podium stairs, tie-breaking algorithms, and CSV export.
- `chronos.db`: Central SQLite database with WAL mode and foreign key constraints.
- `docs/database.md`: Complete SQLite schema documentation and table relationships.
- `backend/`: Optional Python FastAPI backend implementation.
