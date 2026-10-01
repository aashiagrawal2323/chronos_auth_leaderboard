import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Sync server state for active team
  const refreshGameState = useCallback(async () => {
    if (!team?.team_id && !team?.id) return null;
    const tid = team.team_id || team.id;
    try {
      setLoadingState(true);
      const state = await api.getGameState(tid);

      // If team doesn't exist on server (e.g. database re-initialized or test team removed)
      if (!state || state.notFound) {
        localStorage.removeItem('chronos_team_session');
        setTeam(null);
        setGameState(null);
        return null;
      }

      setGameState(state);
      // Update local team state if changed
      if (state.current_state !== team.current_state) {
        setTeam((prev) => ({
          ...prev,
          current_state: state.current_state,
          round1_score: state.r1_score ?? state.round1_score,
          round2_score: state.r2_score ?? state.round2_score,
          round3_score: state.r3_score ?? state.round3_score,
          total_score: state.total_score,
        }));
      }
      return state;
    } catch (err) {
      console.warn('[Chronos] Failed to sync game state:', err);
      return null;
    } finally {
      setLoadingState(false);
    }
  }, [team]);

  useEffect(() => {
    if (team?.team_id || team?.id) {
      refreshGameState();
    }
  }, [team?.team_id, team?.id, refreshGameState]);

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
    soundFx.playAccessGranted();
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
