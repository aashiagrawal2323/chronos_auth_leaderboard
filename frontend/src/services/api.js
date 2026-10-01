/**
 * PROJECT CHRONOS — THE GLITCH
 * API Client Service
 * Connects React Frontend to FastAPI / Express Central Server
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Standard fetch helper with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // --- New Specification: POST /api/auth/register ---
  /**
   * Registers a team with PRN credentials
   * @param {{ team_name: string, member1_name: string, member2_name: string, member1_prn: string, member2_prn: string }} payload
   */
  async registerTeam(payload) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Backward-compatible login endpoint
   */
  async loginTeam(payload) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Round 1 Start Trigger ---
  /**
   * Records start time for Round 1
   * @param {number|string} teamId
   */
  async startRound1(teamId) {
    return apiRequest('/api/game/round1/start', {
      method: 'POST',
      body: JSON.stringify({ team_id: Number(teamId) }),
    });
  },

  // --- Host Leaderboard ---
  /**
   * Retrieves official sorted leaderboard for Host view with PRNs, R1 Time, and CSV Export support
   */
  async getHostLeaderboard() {
    return apiRequest('/api/host/leaderboard', { method: 'GET' });
  },

  /**
   * Admin/Host leaderboard alias
   */
  async getAdminLeaderboard() {
    return apiRequest('/api/admin/leaderboard', { method: 'GET' });
  },

  // --- Game State & Authoritative Timer ---
  async getGameState(teamId) {
    const url = `${API_BASE}/api/game/state?team_id=${teamId}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-ID': String(teamId),
        },
      });

      if (res.status === 404) {
        // Team does not exist in master DB (e.g. stale local session or purged test team)
        return { notFound: true };
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      // Return null or rethrow non-404 network errors
      console.warn(`[GameState Sync] Failed for team ${teamId}:`, err);
      return null;
    }
  },

  async transitionState(payload) {
    return apiRequest('/api/game/transition', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Admin Endpoints ---
  async adminLogin(password) {
    return apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  async getAdminTeams() {
    return apiRequest('/api/admin/teams', { method: 'GET' });
  },

  async getAdminLogs(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.team_id) searchParams.append('team_id', String(params.team_id));
    if (params.event_type) searchParams.append('event_type', params.event_type);
    
    const qs = searchParams.toString();
    return apiRequest(`/api/admin/logs${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  async resetTeam(teamId) {
    return apiRequest(`/api/admin/reset-team/${teamId}`, { method: 'POST' });
  },

  async seedDemoTeams() {
    return apiRequest('/api/admin/seed-demo', { method: 'POST' });
  },
};

export default api;
