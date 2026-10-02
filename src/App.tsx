/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../frontend/src/context/AuthContext.jsx';
import LandingGlitch   from '../frontend/src/pages/LandingGlitch.jsx';
import CrtShutdown    from '../frontend/src/components/CrtShutdown.jsx';
import ChronosIntro    from '../frontend/src/components/ChronosIntro.jsx';
import Register        from '../frontend/src/pages/Register.jsx';
import Round1PreLobby  from '../frontend/src/pages/Round1PreLobby.jsx';

// View order:
//  'landing'  → Glitch title page  (START MISSION button)
//  'intro'    → Full-screen GSAP HTML cinematic intro
//  'register' → Team auth form
//  'prelobby' → Round 1 pre-lobby

function AppContent() {
  const { team, logoutTeam } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'intro' | 'register' | 'prelobby'>(() => {
    try {
      const stored = localStorage.getItem('chronos_team_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.team_name || parsed?.team_id || parsed?.id) {
          return 'prelobby';
        }
      }
    } catch (_) {}
    return 'landing';
  });

  const [isCrtActive, setIsCrtActive] = useState(false);

  // If team is logged out while in prelobby, return to landing
  useEffect(() => {
    if (!team && currentView === 'prelobby') {
      setCurrentView('landing');
    }
  }, [team, currentView]);

  const handleStartMission = () => {
    if (isCrtActive) return;
    setIsCrtActive(true);
  };

  const handleCrtComplete = () => {
    setIsCrtActive(false);
    setCurrentView('intro');
  };

  const handleLogout = () => {
    logoutTeam();
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <main className="flex-1 relative">

        {/* ── Black CRT chassis backdrop behind collapsing screen ── */}
        {isCrtActive && (
          <div className="fixed inset-0 bg-black z-30 pointer-events-none" />
        )}

        {/* ── Landing page — always mounted while on landing/intro so it
             doesn't lose state; hidden (pointer-events off) during intro ── */}
        <div
          className={isCrtActive ? 'crt-screen-collapse' : ''}
          style={{
            display:       currentView === 'register' || currentView === 'prelobby' ? 'none' : 'block',
            pointerEvents: currentView === 'intro' || isCrtActive ? 'none' : 'auto',
            opacity:       currentView === 'intro' ? 0 : 1,
          }}
        >
          <LandingGlitch
            onStart={handleStartMission}
            isStarting={isCrtActive}
          />
        </div>

        {/* ── CRT TV Shutdown Transition Overlay ── */}
        {isCrtActive && (
          <CrtShutdown onComplete={handleCrtComplete} />
        )}

        {/* ── GSAP Cinematic Intro (full-screen, fixed overlay) ── */}
        {currentView === 'intro' && (
          <ChronosIntro
            onComplete={() => setCurrentView('register')}
          />
        )}

        {/* ── Team Authentication ── */}
        {currentView === 'register' && (
          <Register
            onRegisterSuccess={() => setCurrentView('prelobby')}
            onBackToLanding={()   => setCurrentView('landing')}
          />
        )}

        {/* ── Round 1 Pre-lobby ── */}
        {currentView === 'prelobby' && (
          <Round1PreLobby
            onStartRound1={() => {
              // Round 1 engaged
            }}
            onLogout={handleLogout}
          />
        )}

      </main>

      <footer className="border-t border-slate-900 bg-[#04060c] py-2 px-4 text-center font-mono text-[10px] text-slate-600">
        PROJECT CHRONOS // THE GLITCH • TECH FEST EVENT 2140
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
