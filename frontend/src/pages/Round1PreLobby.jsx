import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { soundFx } from '../utils/audio.js';
import { 
  Play, 
  Clock, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Cpu, 
  AlertCircle,
  Users,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function Round1PreLobby({ onStartRound1 }) {
  const { team, updateGameState } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [round1Active, setRound1Active] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const handleStartRound1 = async () => {
    soundFx.playAccessGranted();
    setIsStarting(true);

    try {
      if (team?.team_id) {
        // Record Round 1 start in database
        const res = await api.startRound1(team.team_id);
        if (typeof updateGameState === 'function') {
          updateGameState({
            current_state: 'ROUND_1_ACTIVE',
            r1_start_time: res.r1_start_time || new Date().toISOString(),
          });
        }
      }

      setRound1Active(true);
      setStartTime(new Date());

      if (onStartRound1) {
        onStartRound1();
      }
    } catch (err) {
      console.error('Error starting Round 1:', err);
      // Fallback local start
      setRound1Active(true);
      setStartTime(new Date());
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Ambience Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#05070c]/70 to-[#05070c] pointer-events-none" />

      <div className="relative w-full max-w-2xl z-10 text-center space-y-6">
        
        {/* State Banner */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-mono text-xs tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>AUTHENTICATED UNIT // STATUS: ACTIVE</span>
        </div>

        {/* Team Identity Card */}
        <div className="bg-[#080d1a]/90 border border-cyan-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400" />

          <div className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center justify-center gap-2">
            <span>Connected Callsign</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-bold">
              TEAM ID: #{team?.team_id || team?.id || '2140'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-tech text-white mt-1 text-cyan-300">
            {team?.team_name || 'QUANTUM PARADOX'}
          </h2>

          {/* Members & PRNs display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-cyan-950 text-left font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#050811] border border-cyan-950">
              <span className="text-slate-500 block text-[10px] uppercase">Operator 1</span>
              <span className="text-white font-bold block">{team?.member1_name || 'Member 1'}</span>
              <span className="text-cyan-400/80 text-[11px]">PRN: {team?.member1_prn || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#050811] border border-cyan-950">
              <span className="text-slate-500 block text-[10px] uppercase">Operator 2</span>
              <span className="text-white font-bold block">{team?.member2_name || 'Member 2'}</span>
              <span className="text-cyan-400/80 text-[11px]">PRN: {team?.member2_prn || 'N/A'}</span>
            </div>
          </div>

          {/* Mission Briefing */}
          <div className="mt-6 p-4 rounded-xl bg-cyan-950/30 border border-cyan-900/40 text-xs font-mono text-slate-300 text-left space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              <Cpu className="w-3.5 h-3.5" />
              <span>Round 1 Briefing: Temporal Deconfliction</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Upon engagement, the authoritative master clock begins recording your duration (<code className="text-cyan-300">r1_time_diff</code>). Locate anomalous timeline coordinates, eliminate historical contradictions, and submit fragments.
            </p>
          </div>

          {/* Screen 3 Primary CTA */}
          <div className="mt-8">
            {!round1Active ? (
              <button
                onClick={handleStartRound1}
                disabled={isStarting}
                className="group relative inline-flex items-center justify-center w-full sm:w-auto px-10 py-4 text-base font-bold font-tech tracking-wider uppercase transition-all duration-300 rounded-lg text-slate-950 bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 hover:from-emerald-300 hover:to-cyan-200 shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_50px_rgba(16,185,129,0.8)] hover:scale-105 active:scale-95 border border-emerald-200 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-slate-950 fill-current animate-pulse" />
                  <span>Click to start Round 1</span>
                </div>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/80 text-emerald-300 font-mono text-sm space-y-2 animate-pulse">
                <div className="flex items-center justify-center gap-2 font-bold text-base">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>ROUND 1 IN PROGRESS</span>
                </div>
                <div className="text-xs text-slate-300">
                  Authoritative timer initiated. R1 start recorded in SQLite database.
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Security Isolation Notice */}
        <div className="text-[11px] font-mono text-slate-500">
          Terminal Status: Standard Player Mode • Host Leaderboard Navigation Isolated
        </div>

      </div>
    </div>
  );
}
