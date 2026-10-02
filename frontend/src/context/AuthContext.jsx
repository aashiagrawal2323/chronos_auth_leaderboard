import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.js';
import { soundFx } from '../utils/audio.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [team, setTeam] = useState(() => {
    try {
      const stored = localStorage.getItem('chronos_team_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState(() => {
    try {
      return localStorage.getItem('chronos_admin_token') || null;
    } catch {
      return null;
    }
  });

  const [gameState, setGameState] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingState, setLoadingState] = useState(false);

  // Sync team session to localStorage
  useEffect(() => {
    if (team) {
      localStorage.setItem('chronos_team_session', JSON.stringify(team));
    } else {
      localStorage.removeItem('chronos_team_session');
    }
  }, [team]);

  // Sync admin token to localStorage
  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('chronos_admin_token', adminToken);
    } else {
      localStorage.removeItem('chronos_admin_token');
    }
  }, [adminToken]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFx.setSoundEnabled(next);
      return next;
    });
  };

  // Keep a stable ref to team to avoid stale closures inside refreshGameState
  const teamRef = useRef(team);
  useEffect(() => { teamRef.current = team; }, [team]);

  // Sync server state for active team — stable function, uses teamRef to avoid circular deps
  const refreshGameState = useCallback(async () => {
    const currentTeam = teamRef.current;
    if (!currentTeam?.team_id && !currentTeam?.id) return null;
    const tid = currentTeam.team_id || currentTeam.id;
    try {
      setLoadingState(true);
      const state = await api.getGameState(tid);

      // Only log out if the server explicitly says the team doesn't exist (404)
      // Do NOT log out on network errors or null responses — that would kick the user out on any hiccup
      if (state?.notFound) {
        localStorage.removeItem('chronos_team_session');
        setTeam(null);
        setGameState(null);
        return null;
      }

      // If state is null/undefined (network error), silently skip — keep team logged in
      if (!state) return null;

      setGameState(state);
      // Update local team state if changed
      if (state.current_state !== currentTeam.current_state) {
        setTeam((prev) => (prev ? {
          ...prev,
          current_state: state.current_state,
          round1_score: state.r1_score ?? state.round1_score,
          round2_score: state.r2_score ?? state.round2_score,
          round3_score: state.r3_score ?? state.round3_score,
          total_score: state.total_score,
        } : prev));
      }
      return state;
    } catch (err) {
      console.warn('[Chronos] Failed to sync game state:', err);
      return null;
    } finally {
      setLoadingState(false);
    }
  }, []); // stable — uses teamRef internally

  useEffect(() => {
    if (team?.team_id || team?.id) {
      refreshGameState();
    }
  }, [team?.team_id, team?.id]); // refreshGameState is now stable, no need to include it

  const loginTeamSession = (teamData) => {
    const normalized = {
      id: teamData.team_id || teamData.id,
      team_id: teamData.team_id || teamData.id,
      team_name: teamData.team_name,
      member1_name: teamData.member1_name || teamData.member_1_name || '',
      member2_name: teamData.member2_name || teamData.member_2_name || '',
      member1_prn: teamData.member1_prn || '',
      member2_prn: teamData.member2_prn || '',
      status: teamData.status || 'ACTIVE',
      current_state: teamData.current_state || 'READY',
      session_token: teamData.session_token || '',
    };
    setTeam(normalized);
  };

  const updateGameState = (partialState) => {
    setGameState((prev) => (prev ? { ...prev, ...partialState } : partialState));
    setTeam((prev) => (prev ? { ...prev, ...partialState } : null));
  };

  const logoutTeam = () => {
    setTeam(null);
    setGameState(null);
  };

  const loginAdminSession = (token) => {
    setAdminToken(token);
    soundFx.playAccessGranted();
  };

  const logoutAdmin = () => {
    setAdminToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        team,
        gameState,
        adminToken,
        isAdmin: Boolean(adminToken),
        soundEnabled,
        toggleSound,
        loginTeamSession,
        updateGameState,
        logoutTeam,
        loginAdminSession,
        logoutAdmin,
        refreshGameState,
        loadingState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
