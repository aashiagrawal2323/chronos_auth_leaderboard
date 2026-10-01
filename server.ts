/**
 * PROJECT CHRONOS — THE GLITCH
 * Full-Stack Dev Server & Authoritative API Engine
 * Powered by Node.js, Express, Vite, and SQLite (node:sqlite)
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST_PASSKEY = process.env.CHRONOS_HOST_PASSKEY || process.env.CHRONOS_ADMIN_PASSWORD || 'chronos2140';
const HOST_TOKEN = 'HOST_AUTH_VALID_2140';

app.use(express.json());

// Initialize SQLite database
const dbPath = path.resolve(__dirname, 'chronos.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize Master Tables strictly matching specifications:
db.exec(`
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
    current_state TEXT NOT NULL DEFAULT 'REGISTERED',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Round 1 Tables
CREATE TABLE IF NOT EXISTS round1_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    correct_era TEXT NOT NULL CHECK(correct_era IN ('PAST', 'PRESENT', 'FUTURE')),
    clue_text TEXT,
    points_positive REAL DEFAULT 2.0,
    points_negative REAL DEFAULT 1.0,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS round1_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    selected_era TEXT NOT NULL CHECK(selected_era IN ('PAST', 'PRESENT', 'FUTURE')),
    is_correct INTEGER NOT NULL,
    points_awarded REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES round1_items(item_id)
);

-- Round 2 Tables
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
    points_deducted REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS round2_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    suspect_identified TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    points_awarded REAL NOT NULL,
    ai_points_remaining REAL NOT NULL,
    round2_total_score REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Round 3 Tables
CREATE TABLE IF NOT EXISTS round3_team_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER UNIQUE NOT NULL,
    case_id TEXT NOT NULL,
    culprit_candidate_id TEXT NOT NULL,
    valid_evidence_ids TEXT NOT NULL,
    assigned_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS round3_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    selected_candidate_id TEXT NOT NULL,
    selected_evidence_ids TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    points_awarded REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Game Logs Table (Audit trail of events)
CREATE TABLE IF NOT EXISTS game_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER,
    event_type TEXT NOT NULL,
    event_data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teams_total_score ON teams(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_game_logs_team_id ON game_logs(team_id);
`);

// Auto-seed initial representative demo teams so the host leaderboard is immediately populated
const countCheck = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
if (countCheck && countCheck.count === 0) {
  const now = new Date().toISOString();
  const seedStmt = db.prepare(`
    INSERT INTO teams (
      team_name, member1_name, member2_name, member1_prn, member2_prn,
      r1_start_time, r1_end_time, r1_time_diff,
      r1_score, r1_scaled, r2_score, r3_score, total_score,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialDemos = [
    [
      'Quantum Paradox', 'Alex Vance', 'Gordon Freeman', '2140108920', '2140108921',
      '2026-09-30T10:00:00Z', '2026-09-30T10:04:15Z', 255.0,
      315.0, 95.5, 245.0, 190.0, 750.0,
      'FINISHED', now, now
    ],
    [
      'Cyber Chronos', 'Elena Fisher', 'Nathan Drake', '2140109101', '2140109102',
      '2026-09-30T10:00:00Z', '2026-09-30T10:04:40Z', 280.0,
      320.0, 92.0, 230.0, 200.0, 750.0,
      'FINISHED', now, now
    ],
    [
      'Entropy Glitch', 'Ada Lovelace', 'Charles Babbage', '2140107730', '2140107731',
      '2026-09-30T10:01:00Z', '2026-09-30T10:05:30Z', 270.0,
      290.0, 88.0, 260.0, 195.0, 745.0,
      'FINISHED', now, now
    ],
    [
      'Neural Nexus', 'Sarah Connor', 'John Connor', '2140105540', '2140105541',
      '2026-09-30T10:05:00Z', null, null,
      280.0, 84.0, 220.0, 0.0, 500.0,
      'ACTIVE', now, now
    ],
    [
      'Temporal Void', 'Marcus Wright', 'Kyle Reese', '2140104421', '2140104422',
      '2026-09-30T10:06:00Z', null, null,
      270.0, 80.0, 0.0, 0.0, 270.0,
      'ACTIVE', now, now
    ],
    [
      'Voxel Drift', 'Samus Aran', 'Adam Malkovich', '2140103310', '2140103311',
      null, null, null,
      0.0, 0.0, 0.0, 0.0, 0.0,
      'ACTIVE', now, now
    ],
  ];

  for (const row of initialDemos) {
    seedStmt.run(...row);
  }
}

// ==========================================
// 1. Auth Endpoint: POST /api/auth/register (Screen 2)
// ==========================================
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { team_name, member1_name, member2_name, member1_prn, member2_prn } = req.body;

    if (!team_name || !team_name.trim()) {
      return res.status(400).json({ detail: 'Team Name designation is required.' });
    }
    if (!member1_name || !member2_name) {
      return res.status(400).json({ detail: 'Both Member 1 and Member 2 names are required.' });
    }
    if (!member1_prn || !member2_prn) {
      return res.status(400).json({ detail: 'PRN credentials for both Member 1 and Member 2 are required.' });
    }

    const cleanTeam = team_name.trim();
    const m1 = member1_name.trim();
    const m2 = member2_name.trim();
    const p1 = member1_prn.trim();
    const p2 = member2_prn.trim();
    const nowIso = new Date().toISOString();
    const sessionToken = `CHRONOS_TK_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const existing = db.prepare('SELECT * FROM teams WHERE team_name = ? COLLATE NOCASE').get(cleanTeam) as any;

    if (existing) {
      db.prepare(`
        UPDATE teams SET
          member1_name = ?,
          member2_name = ?,
          member1_prn = ?,
          member2_prn = ?,
          updated_at = ?
        WHERE team_id = ?
      `).run(m1, m2, p1, p2, nowIso, existing.team_id);

      db.prepare('INSERT INTO game_logs (team_id, event_type, event_data, created_at) VALUES (?, ?, ?, ?)')
        .run(existing.team_id, 'REGISTER_RESUME', JSON.stringify({ team_name: cleanTeam, prns: [p1, p2] }), nowIso);

      return res.json({
        team_id: existing.team_id,
        team_name: existing.team_name,
        member1_name: m1,
        member2_name: m2,
        member1_prn: p1,
        member2_prn: p2,
        status: existing.status,
        session_token: sessionToken,
        message: 'SESSION_RESTORED',
      });
    }

    const insertResult = db.prepare(`
      INSERT INTO teams (
        team_name, member1_name, member2_name, member1_prn, member2_prn,
        r1_start_time, r1_end_time, r1_time_diff,
        r1_score, r1_scaled, r2_score, r3_score, total_score,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, 0.0, 0.0, 0.0, 0.0, 0.0, 'ACTIVE', ?, ?)
    `).run(cleanTeam, m1, m2, p1, p2, nowIso, nowIso);

    const newId = Number(insertResult.lastInsertRowid);

    db.prepare('INSERT INTO game_logs (team_id, event_type, event_data, created_at) VALUES (?, ?, ?, ?)')
      .run(newId, 'REGISTER_NEW', JSON.stringify({ team_name: cleanTeam, prns: [p1, p2] }), nowIso);

    return res.json({
      team_id: newId,
      team_name: cleanTeam,
      member1_name: m1,
      member2_name: m2,
      member1_prn: p1,
      member2_prn: p2,
      status: 'ACTIVE',
      session_token: sessionToken,
      message: 'TEAM_REGISTERED',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ detail: err.message || 'Internal server error' });
  }
});

// Backward compatibility alias for /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { team_name, member_1_name, member_2_name, member1_name, member2_name, member1_prn, member2_prn } = req.body;
  req.body = {
    team_name,
    member1_name: member1_name || member_1_name || 'Operator 1',
    member2_name: member2_name || member_2_name || 'Operator 2',
    member1_prn: member1_prn || 'PRN-2140',
    member2_prn: member2_prn || 'PRN-2141',
  };
  return app._router.handle(req, res, () => {});
});

// ==========================================
// 2. Round 1 Trigger: POST /api/game/round1/start (Screen 3)
// ==========================================
app.post('/api/game/round1/start', (req: Request, res: Response) => {
  try {
    const { team_id } = req.body;
    if (!team_id) {
      return res.status(400).json({ detail: 'team_id is required' });
    }

    const nowIso = new Date().toISOString();
    const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(team_id) as any;
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    // Set r1_start_time if not already set
    if (!team.r1_start_time) {
      db.prepare('UPDATE teams SET r1_start_time = ?, updated_at = ? WHERE team_id = ?')
        .run(nowIso, nowIso, team_id);
    }

    db.prepare('INSERT INTO game_logs (team_id, event_type, event_data, created_at) VALUES (?, ?, ?, ?)')
      .run(team_id, 'ROUND_1_START', JSON.stringify({ r1_start_time: nowIso }), nowIso);

    return res.json({
      success: true,
      team_id,
      r1_start_time: team.r1_start_time || nowIso,
      status: team.status,
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Game state check
app.get('/api/game/state', (req: Request, res: Response) => {
  try {
    const teamId = req.query.team_id || req.headers['x-team-id'];
    if (!teamId) {
      return res.status(400).json({ detail: 'Missing team_id' });
    }

    const team = db.prepare('SELECT * FROM teams WHERE team_id = ?').get(Number(teamId)) as any;
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    return res.json({
      team_id: team.team_id,
      team_name: team.team_name,
      member1_name: team.member1_name,
      member2_name: team.member2_name,
      member1_prn: team.member1_prn,
      member2_prn: team.member2_prn,
      r1_start_time: team.r1_start_time,
      r1_end_time: team.r1_end_time,
      r1_time_diff: team.r1_time_diff,
      r1_score: team.r1_score,
      r1_scaled: team.r1_scaled,
      r2_score: team.r2_score,
      r3_score: team.r3_score,
      total_score: team.total_score,
      status: team.status,
      current_state: team.status === 'FINISHED' ? 'COMPLETED' : team.r1_start_time ? 'ROUND_1_ACTIVE' : 'READY',
      server_time: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// ==========================================
// 3. Host-Only Leaderboard: GET /api/host/leaderboard
// ==========================================
app.get('/api/host/leaderboard', (_req: Request, res: Response) => {
  try {
    const teams = db.prepare(`
      SELECT 
        team_id, team_name, member1_name, member2_name, member1_prn, member2_prn,
        r1_start_time, r1_end_time, r1_time_diff,
        r1_score, r1_scaled, r2_score, r3_score, total_score, status
      FROM teams
    `).all() as any[];

    // Format and calculate duration display
    const formatted = teams.map((t) => {
      let durationFormatted = '--:--';
      if (t.r1_time_diff != null) {
        const totalSec = Math.round(t.r1_time_diff);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else if (t.r1_start_time && t.r1_end_time) {
        const start = new Date(t.r1_start_time).getTime();
        const end = new Date(t.r1_end_time).getTime();
        const sec = Math.max(0, Math.floor((end - start) / 1000));
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      return {
        ...t,
        r1_score: Number(t.r1_score || 0),
        r1_scaled: Number(t.r1_scaled || 0),
        r2_score: Number(t.r2_score || 0),
        r3_score: Number(t.r3_score || 0),
        total_score: Number(t.total_score || 0),
        r1_time_formatted: durationFormatted,
      };
    });

    // Ranking algorithm: 1) total_score DESC, 2) r1_time_diff ASC (faster R1 duration wins tie)
    formatted.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      const timeA = a.r1_time_diff ?? 999999;
      const timeB = b.r1_time_diff ?? 999999;
      return timeA - timeB;
    });

    const ranked = formatted.map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

    return res.json(ranked);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Direct route to serve standalone host leaderboard.html
app.get(['/leaderboard.html', '/leaderboard', '/host/leaderboard'], (_req: Request, res: Response) => {
  return res.sendFile(path.resolve(__dirname, 'public', 'leaderboard.html'));
});

// Alias for admin leaderboard
app.get('/api/admin/leaderboard', (req: Request, res: Response) => {
  return app._router.handle(Object.assign(req, { url: '/api/host/leaderboard' }), res, () => {});
});

// Admin login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password && password.trim() === HOST_PASSKEY) {
    return res.json({ success: true, token: HOST_TOKEN, message: 'ACCESS_GRANTED' });
  }
  return res.status(401).json({ detail: 'Invalid temporal credentials. Authorization denied.' });
});

app.get('/api/admin/teams', (_req: Request, res: Response) => {
  try {
    const teams = db.prepare('SELECT * FROM teams ORDER BY team_id ASC').all();
    return res.json(teams);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.get('/api/admin/logs', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT gl.*, t.team_name 
      FROM game_logs gl
      LEFT JOIN teams t ON gl.team_id = t.team_id
      ORDER BY gl.id DESC LIMIT 100
    `).all();
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({ status: 'HEALTHY', database: 'SQLITE_READY', version: '2140.2' });
});

app.get(['/api/download/project-zip', '/api/download/clean-zip'], (_req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'public', 'chronos_project_clean.zip');
  return res.download(zipPath, 'chronos_project_clean.zip', (err) => {
    if (err) {
      console.error('[Download error]', err);
      if (!res.headersSent) {
        res.status(500).json({ detail: 'Failed to download zip file' });
      }
    }
  });
});

// ==========================================
// 4. Vite Dev Server / Static Hosting & Dual-Port Setup
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Primary Server (Participant Screen on Port 3000)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CHRONOS] Participant Portal online at http://0.0.0.0:${PORT}`);
  });

  // Dedicated Isolated Host Leaderboard Server (e.g., Port 3001 or LEADERBOARD_PORT)
  const LEADERBOARD_PORT = Number(process.env.LEADERBOARD_PORT) || 3001;
  const leaderboardApp = express();
  leaderboardApp.use(express.json());

  // Serve static assets from public & allow API requests
  leaderboardApp.use(express.static(path.resolve(__dirname, 'public')));
  leaderboardApp.get(['/', '/leaderboard', '/leaderboard.html'], (_req: Request, res: Response) => {
    return res.sendFile(path.resolve(__dirname, 'public', 'leaderboard.html'));
  });
  // Mirror host API endpoints on leaderboard port
  leaderboardApp.get('/api/host/leaderboard', (req: Request, res: Response) => {
    return app._router.handle(req, res, () => {});
  });
  leaderboardApp.get('/api/admin/leaderboard', (req: Request, res: Response) => {
    return app._router.handle(req, res, () => {});
  });
  leaderboardApp.post('/api/admin/login', (req: Request, res: Response) => {
    return app._router.handle(req, res, () => {});
  });

  leaderboardApp.listen(LEADERBOARD_PORT, '0.0.0.0', () => {
    console.log(`[CHRONOS] Isolated Host Leaderboard online at http://0.0.0.0:${LEADERBOARD_PORT}/leaderboard.html`);
  });
}

startServer().catch((err) => {
  console.error('[CHRONOS] Failed to start server:', err);
});
