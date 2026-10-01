import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { soundFx } from '../utils/audio.js';
import { 
  Users, 
  ChevronRight, 
  Terminal, 
  AlertTriangle, 
  ShieldCheck, 
  IdCard,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function Register({ onRegisterSuccess, onBackToLanding }) {
  const { loginTeamSession } = useAuth();
  const [formData, setFormData] = useState({
    team_name: '',
    member1_name: '',
    member2_name: '',
    member1_prn: '',
    member2_prn: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (field, value) => {
    soundFx.playKeystroke();
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.team_name.trim()) {
      soundFx.playGlitch();
      setErrorMsg('Team Name designation is required.');
      return;
    }
    if (!formData.member1_name.trim() || !formData.member2_name.trim()) {
      soundFx.playGlitch();
      setErrorMsg('Both Member 1 and Member 2 names are required.');
      return;
    }
    if (!formData.member1_prn.trim() || !formData.member2_prn.trim()) {
      soundFx.playGlitch();
      setErrorMsg('PRN credentials for both Member 1 and Member 2 are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await api.registerTeam({
        team_name: formData.team_name.trim(),
        member1_name: formData.member1_name.trim(),
        member2_name: formData.member2_name.trim(),
        member1_prn: formData.member1_prn.trim(),
        member2_prn: formData.member2_prn.trim(),
      });

      soundFx.playAccessGranted();
      loginTeamSession(res);

      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(res);
        }
      }, 500);
    } catch (err) {
      soundFx.playGlitch();
      setErrorMsg(err.message || 'Authentication error. Contact event host.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#05070c]/70 to-[#05070c] pointer-events-none" />

      <div className="relative w-full max-w-2xl z-10">
        
        {/* Top Back Action */}
        <button
          onClick={onBackToLanding}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO INTRO</span>
        </button>

        <div className="bg-[#080d1a]/95 border border-cyan-800/60 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400" />

          {/* Form Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase">
                <Users className="w-4 h-4" />
                <span>Screen 2 // Dual-Operator Registry</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>UNIQUE TEAM ID AUTO-GENERATED</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-tech text-white mt-1">
              Team Authentication
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Provide your Team Name, Member 1 &amp; Member 2 full names, and PRNs. A unique Team ID will be automatically generated upon confirmation.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs font-mono flex items-center gap-2.5 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field 1: Team Name */}
            <div>
              <label className="block text-xs font-mono font-bold text-cyan-300 mb-1.5 uppercase tracking-wide">
                1. Team Name (Unique Callsign)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.team_name}
                  onChange={(e) => handleInputChange('team_name', e.target.value)}
                  placeholder="e.g. Quantum Paradox"
                  maxLength={50}
                  className="w-full bg-[#050811] border border-cyan-900/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 outline-none transition"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            {/* Operator 1 Section */}
            <div className="p-4 rounded-xl bg-[#050811]/80 border border-cyan-950 space-y-3">
              <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5" />
                <span>Operator 1 Specifications</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Field 2: Member 1 Name */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    2. Member 1 Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.member1_name}
                    onChange={(e) => handleInputChange('member1_name', e.target.value)}
                    placeholder="e.g. Alex Vance"
                    maxLength={50}
                    className="w-full bg-[#03060c] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-700 outline-none transition"
                    disabled={isSubmitting}
                  />
                </div>
                {/* Field 4: Member 1 PRN */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    4. Member 1 PRN / Student ID
                  </label>
                  <input
                    type="text"
                    value={formData.member1_prn}
                    onChange={(e) => handleInputChange('member1_prn', e.target.value)}
                    placeholder="e.g. 2140108920"
                    maxLength={30}
                    className="w-full bg-[#03060c] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-700 outline-none transition"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Operator 2 Section */}
            <div className="p-4 rounded-xl bg-[#050811]/80 border border-cyan-950 space-y-3">
              <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5" />
                <span>Operator 2 Specifications</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Field 3: Member 2 Name */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    3. Member 2 Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.member2_name}
                    onChange={(e) => handleInputChange('member2_name', e.target.value)}
                    placeholder="e.g. Gordon Freeman"
                    maxLength={50}
                    className="w-full bg-[#03060c] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-700 outline-none transition"
                    disabled={isSubmitting}
                  />
                </div>
                {/* Field 5: Member 2 PRN */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    5. Member 2 PRN / Student ID
                  </label>
                  <input
                    type="text"
                    value={formData.member2_prn}
                    onChange={(e) => handleInputChange('member2_prn', e.target.value)}
                    placeholder="e.g. 2140108921"
                    maxLength={30}
                    className="w-full bg-[#03060c] border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-xs font-mono text-white placeholder-slate-700 outline-none transition"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* CONFIRM Submission Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-6 rounded-lg font-tech font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5 text-slate-950" />
              <span>{isSubmitting ? 'CONNECTING PROTOCOL...' : 'CONFIRM'}</span>
            </button>
          </form>

          {/* Player isolation note */}
          <div className="mt-4 text-[10px] font-mono text-slate-500 text-center">
            Security note: Direct participant terminals remain strictly isolated from host master telemetry.
          </div>
        </div>
      </div>
    </div>
  );
}
