import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.js';
import { soundFx } from '../utils/audio.js';
import { 
  Trophy, 
  RotateCw, 
  Search, 
  Download, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Award,
  Users
} from 'lucide-react';

export default function HostLeaderboard({ hostPasskey = 'chronos2140', onExitHost }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPasskey, setEnteredPasskey] = useState('');
  const [authError, setAuthError] = useState('');

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check stored host token
  useEffect(() => {
    const savedToken = localStorage.getItem('chronos_host_auth');
    if (savedToken === 'HOST_AUTH_VALID_2140') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasskeySubmit = (e) => {
    e.preventDefault();
    if (enteredPasskey.trim() === hostPasskey) {
      soundFx.playAccessGranted();
      localStorage.setItem('chronos_host_auth', 'HOST_AUTH_VALID_2140');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      soundFx.playGlitch();
      setAuthError('Access Denied. Invalid host passkey.');
    }
  };

  const handleLogoutHost = () => {
    localStorage.removeItem('chronos_host_auth');
    setIsAuthenticated(false);
    setEnteredPasskey('');
  };

  const fetchLeaderboard = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const data = await api.getHostLeaderboard();
      setLeaderboard(data);
      setLastUpdated(new Date());
      setError(null);
      if (isManual) soundFx.playDataPing();
    } catch (err) {
      console.error('Host fetch error:', err);
      setError('Unable to synchronize with SQLite master database.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLeaderboard(true);
  }, [isAuthenticated, fetchLeaderboard]);

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLeaderboard(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, autoRefresh, fetchLeaderboard]);

  // Export to CSV Function
  const handleExportCSV = () => {
    soundFx.playAccessGranted();
    if (!leaderboard.length) return;

    const headers = [
      'Rank',
      'Team Name',
      'Member 1 Name',
      'Member 1 PRN',
      'Member 2 Name',
      'Member 2 PRN',
      'R1 Time Diff (s)',
      'R1 Time Formatted',
      'R1 Score',
      'R1 Scaled',
      'R2 Score',
      'R3 Score',
      'Total Score',
      'Status'
    ];

    const rows = leaderboard.map((t) => [
      t.rank,
      `"${(t.team_name || '').replace(/"/g, '""')}"`,
      `"${(t.member1_name || '').replace(/"/g, '""')}"`,
      `"${(t.member1_prn || '').replace(/"/g, '""')}"`,
      `"${(t.member2_name || '').replace(/"/g, '""')}"`,
      `"${(t.member2_prn || '').replace(/"/g, '""')}"`,
      t.r1_time_diff ?? '',
      `"${t.r1_time_formatted || '--:--'}"`,
      t.r1_score ?? 0,
      t.r1_scaled ?? 0,
      t.r2_score ?? 0,
      t.r3_score ?? 0,
      t.total_score ?? 0,
      `"${t.status || 'ACTIVE'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chronos_master_leaderboard_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTeams = useMemo(() => {
    return leaderboard.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.team_name?.toLowerCase().includes(q) ||
        item.member1_name?.toLowerCase().includes(q) ||
        item.member2_name?.toLowerCase().includes(q) ||
        item.member1_prn?.toLowerCase().includes(q) ||
        item.member2_prn?.toLowerCase().includes(q)
      );
    });
  }, [leaderboard, searchTerm]);

  // Passkey gate screen
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
        <div className="relative w-full max-w-md bg-[#080d1a] border border-cyan-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-tech text-white">Host Access Portal</h2>
            <p className="text-xs font-mono text-slate-400">
              This route is restricted to Project Chronos Event Supervisors. Enter host security passkey.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded bg-rose-950/80 border border-rose-600 text-rose-300 text-xs font-mono">
              {authError}
            </div>
          )}

          <form onSubmit={handlePasskeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-cyan-300 mb-1">Host Passkey</label>
              <input
                type="password"
                value={enteredPasskey}
                onChange={(e) => setEnteredPasskey(e.target.value)}
                placeholder="Default: chronos2140"
                className="w-full bg-[#050811] border border-cyan-900 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 outline-none focus:border-cyan-400"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg font-tech font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 transition cursor-pointer"
            >
              AUTHENTICATE HOST
            </button>
          </form>

          {onExitHost && (
            <button
              onClick={onExitHost}
              className="w-full mt-4 text-center text-xs font-mono text-slate-500 hover:text-slate-300"
            >
              Return to Participant View
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Banner & Control Toolbar */}
      <div className="bg-[#080d1a] border border-cyan-900/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Host Authoritative Control Console</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                RESTRICTED ROUTE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-tech text-white mt-1">
              Project Chronos Master Leaderboard
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live database rankings synced directly with SQLite master table <code className="text-cyan-300">teams</code>.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition ${
                autoRefresh
                  ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? `Live (${countdown}s)` : 'Paused'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchLeaderboard(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0e1628] border border-cyan-900/80 text-cyan-300 hover:bg-cyan-950 transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {/* Export to CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Export to CSV</span>
            </button>

            {/* Logout Host */}
            <button
              onClick={handleLogoutHost}
              className="px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-900 text-rose-300 hover:bg-rose-950 transition"
              title="Lock host portal"
            >
              Lock Host
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-4 border-t border-cyan-950 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by team callsign, operator name, or PRN..."
              className="w-full bg-[#050811] border border-cyan-900/80 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Total Enrolled Units: <span className="text-cyan-300 font-bold">{leaderboard.length}</span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Stairs Banner (As shown in screenshot) */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="flex items-center justify-center gap-4 w-full max-w-xl mb-6">
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          <h2 className="text-2xl sm:text-3xl font-extrabold font-tech tracking-[0.2em] italic text-white uppercase drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
            LEADERBOARD
          </h2>
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        </div>

        <div className="flex items-end justify-center gap-3 sm:gap-4 w-full max-w-3xl px-2">
          {/* Rank 2 (Left Stair - Cyan / Sky Blue) */}
          {(() => {
            const rank2 = leaderboard[1];
            return (
              <div className="flex-1 min-w-[120px] max-w-[240px] h-[190px] sm:h-[210px] rounded-xl p-4 sm:p-5 flex flex-col items-center justify-between text-center bg-gradient-to-b from-sky-400 via-sky-500 to-sky-700 text-slate-950 border-2 border-sky-200 shadow-[0_0_25px_rgba(14,165,233,0.4)] transition hover:-translate-y-1">
                <div className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-black font-mono shadow">
                  02
                </div>
                <div className="my-auto">
                  <div className="font-extrabold text-xs sm:text-sm uppercase tracking-wider truncate max-w-full font-tech" title={rank2?.team_name || 'BAYMAX'}>
                    {rank2?.team_name || 'BAYMAX'}
                  </div>
                  <div className="font-mono font-black text-2xl sm:text-3xl mt-1 tracking-tight">
                    {Math.round(rank2?.total_score || 150)}
                  </div>
                </div>
                <div className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-black/25 border border-black/35 text-slate-900">
                  - 0
                </div>
              </div>
            );
          })()}

          {/* Rank 1 (Center Stair - Gold / Yellow with Crown, Tallest) */}
          {(() => {
            const rank1 = leaderboard[0];
            return (
              <div className="flex-1 min-w-[140px] max-w-[260px] h-[230px] sm:h-[250px] rounded-xl p-4 sm:p-5 flex flex-col items-center justify-between text-center bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-600 text-slate-950 border-2 border-yellow-100 shadow-[0_0_35px_rgba(234,179,8,0.5)] z-10 transition hover:-translate-y-1">
                <div className="text-2xl sm:text-3xl leading-none -mt-1 drop-shadow-md">
                  👑
                </div>
                <div className="my-auto">
                  <div className="font-black text-xs sm:text-sm uppercase tracking-wider truncate max-w-full font-tech" title={rank1?.team_name || 'TEST RUNNERS'}>
                    {rank1?.team_name || 'TEST RUNNERS'}
                  </div>
                  <div className="font-mono font-black text-3xl sm:text-4xl mt-1 tracking-tight">
                    {Math.round(rank1?.total_score || 200)}
                  </div>
                </div>
                <div className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-black/25 border border-black/35 text-slate-900">
                  - 0
                </div>
              </div>
            );
          })()}

          {/* Rank 3 (Right Stair - Orange / Amber) */}
          {(() => {
            const rank3 = leaderboard[2];
            return (
              <div className="flex-1 min-w-[120px] max-w-[240px] h-[170px] sm:h-[190px] rounded-xl p-4 sm:p-5 flex flex-col items-center justify-between text-center bg-gradient-to-b from-orange-400 via-orange-500 to-orange-700 text-slate-950 border-2 border-orange-200 shadow-[0_0_25px_rgba(249,115,22,0.4)] transition hover:-translate-y-1">
                <div className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-black font-mono shadow">
                  03
                </div>
                <div className="my-auto">
                  <div className="font-extrabold text-xs sm:text-sm uppercase tracking-wider truncate max-w-full font-tech" title={rank3?.team_name || 'PQUARA'}>
                    {rank3?.team_name || 'PQUARA'}
                  </div>
                  <div className="font-mono font-black text-2xl sm:text-3xl mt-1 tracking-tight">
                    {Math.round(rank3?.total_score || 100)}
                  </div>
                </div>
                <div className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-black/25 border border-black/35 text-slate-900">
                  - 0
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Leaderboard Master Table */}
      <div className="bg-[#080d1a] border border-cyan-900/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#050811] text-cyan-400 uppercase tracking-wider text-[11px] border-b border-cyan-950">
              <tr>
                <th className="py-3.5 px-4 font-bold">Rank</th>
                <th className="py-3.5 px-4 font-bold">Team Name</th>
                <th className="py-3.5 px-4 font-bold">Operators (Names &amp; PRNs)</th>
                <th className="py-3.5 px-4 font-bold">R1 Time</th>
                <th className="py-3.5 px-3 font-bold text-right">R1 Score</th>
                <th className="py-3.5 px-3 font-bold text-right">R1 Scaled</th>
                <th className="py-3.5 px-3 font-bold text-right">R2</th>
                <th className="py-3.5 px-3 font-bold text-right">R3</th>
                <th className="py-3.5 px-4 font-bold text-right text-cyan-300">Total Score</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/60">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No matching team records detected in the SQLite master registry.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((t) => {
                  const isTop1 = t.rank === 1;
                  const isTop3 = t.rank <= 3;
                  const isFinished = t.status === 'FINISHED';

                  return (
                    <tr
                      key={t.team_id}
                      className={`transition-colors ${
                        isTop1
                          ? 'bg-amber-500/10 hover:bg-amber-500/15'
                          : isTop3
                          ? 'bg-cyan-500/5 hover:bg-cyan-500/10'
                          : 'hover:bg-[#0c1322]'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1.5">
                          {isTop1 ? (
                            <Award className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : isTop3 ? (
                            <Trophy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          ) : null}
                          <span className={isTop1 ? 'text-amber-300 text-sm' : isTop3 ? 'text-cyan-300' : 'text-slate-400'}>
                            #{t.rank}
                          </span>
                        </div>
                      </td>

                      {/* Team Name */}
                      <td className="py-3.5 px-4 font-bold text-white font-tech tracking-wide text-sm">
                        {t.team_name}
                      </td>

                      {/* Members & PRNs */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div>
                            <span className="text-slate-200">{t.member1_name}</span>
                            <span className="text-cyan-400/80 ml-1.5 font-mono">[{t.member1_prn}]</span>
                          </div>
                          <div>
                            <span className="text-slate-200">{t.member2_name}</span>
                            <span className="text-cyan-400/80 ml-1.5 font-mono">[{t.member2_prn}]</span>
                          </div>
                        </div>
                      </td>

                      {/* R1 Time */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{t.r1_time_formatted || (t.r1_time_diff ? `${Math.round(t.r1_time_diff)}s` : '--:--')}</span>
                        </div>
                      </td>

                      {/* Scores */}
                      <td className="py-3.5 px-3 text-right text-slate-300 font-mono">
                        {t.r1_score?.toFixed(1) ?? '0.0'}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                        {t.r1_scaled?.toFixed(1) ?? '0.0'}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300 font-mono">
                        {t.r2_score?.toFixed(1) ?? '0.0'}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300 font-mono">
                        {t.r3_score?.toFixed(1) ?? '0.0'}
                      </td>

                      {/* Total Score */}
                      <td className="py-3.5 px-4 text-right font-bold text-cyan-300 font-mono text-sm glow-cyan">
                        {t.total_score?.toFixed(1) ?? '0.0'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            isFinished
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
