/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../frontend/src/context/AuthContext.jsx';
import LandingGlitch from '../frontend/src/pages/LandingGlitch.jsx';
import Register from '../frontend/src/pages/Register.jsx';
import Round1PreLobby from '../frontend/src/pages/Round1PreLobby.jsx';
import { soundFx } from '../frontend/src/utils/audio.js';
import { 
  Volume2, 
  VolumeX, 
  LogOut
} from 'lucide-react';

interface AuthContextType {
  team: any;
  gameState: any;
  adminToken: string | null;
  isAdmin: boolean;
  soundEnabled: boolean;
  toggleSound: () => void;
  loginTeamSession: (data: any) => void;
  updateGameState: (data: any) => void;
  logoutTeam: () => void;
  refreshGameState: () => Promise<any>;
}

function AppContent() {
  const { team, logoutTeam, soundEnabled, toggleSound } = useAuth() as AuthContextType;
  
  // Screen views:
  // 'landing' -> Screen 1: Glitch Title + Lore + START
  // 'register' -> Screen 2: Team Name + 2 Members + 2 PRNs + CONFIRM
  // 'prelobby' -> Screen 3: Round 1 Pre-lobby ("Click to start Round 1")
  const [currentView, setCurrentView] = useState<'landing' | 'register' | 'prelobby'>('landing');

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
        {/* Top Global Navigation Bar - Participant Screen */}
        <header className="border-b border-cyan-950/80 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          
          {/* Brand & System Status */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center font-tech font-bold text-slate-950 shadow-md shadow-cyan-500/20">
              CH
            </div>
            <div>
              <div className="font-tech font-bold text-sm tracking-wider text-white flex items-center gap-2">
                <span>PROJECT CHRONOS</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                  THE GLITCH
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SQLITE MASTER // ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Right Tools (Active Team badge & Audio FX) */}
          <div className="flex items-center gap-3 font-mono text-xs">
            {team && (
              <div className="flex items-center gap-2 bg-[#090e1b] px-2.5 py-1 rounded border border-cyan-900/60 text-[11px]">
                <span className="text-slate-400">Callsign:</span>
                <span className="font-bold text-cyan-300 truncate max-w-[120px]">{team.team_name}</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-[10px] text-cyan-400 border border-cyan-800">
                  {team.status || 'ACTIVE'}
                </span>
                <button
                  onClick={() => {
                    logoutTeam();
                    setCurrentView('landing');
                  }}
                  className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                  title="Disconnect Unit Session"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={toggleSound}
              className={`p-1.5 rounded border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}
              title={soundEnabled ? 'Terminal Sound FX Enabled' : 'Sound FX Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

        </header>

      {/* Main View Router */}
      <main className="flex-1">
        {/* Screen 1: Glitch Landing Page */}
        {currentView === 'landing' && (
          <LandingGlitch
            onStart={() => setCurrentView('register')}
          />
        )}

        {/* Screen 2: Team Registration (Team Name + 2 Members + 2 PRNs + CONFIRM) */}
        {currentView === 'register' && (
          <Register
            onRegisterSuccess={() => setCurrentView('prelobby')}
            onBackToLanding={() => setCurrentView('landing')}
          />
        )}

        {/* Screen 3: Round 1 Pre-lobby ("Click to start Round 1", no links to leaderboard) */}
        {currentView === 'prelobby' && (
          <Round1PreLobby
            onStartRound1={() => {
              // Round 1 engaged
            }}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-[#04060c] py-2 px-4 text-center font-mono text-[10px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-1">
        <div>
          PROJECT CHRONOS // THE GLITCH • TECH FEST EVENT 2140
        </div>
        <div>
          Master SQLite Schema • Dual-Operator Auth • Host Isolated Leaderboard
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
