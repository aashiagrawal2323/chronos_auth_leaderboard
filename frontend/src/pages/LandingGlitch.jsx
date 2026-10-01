import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../utils/audio.js';
import { Terminal, Shield, Zap, Sparkles, RefreshCw } from 'lucide-react';

export default function LandingGlitch({ onStart }) {
  const canvasRef = useRef(null);
  const [entranceKey, setEntranceKey] = useState(0);

  // Retro Matrix / Glitch Canvas effect in background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const chars = 'CHRONOSGLITCH214001010101ΔΩΨΣΦΞ1001100101001';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 7, 12, 0.15)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#06b6d4';
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random glitch jitter
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() > 0.85) {
          ctx.fillStyle = '#ec4899'; // Glitch pink
        } else {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.35)'; // Cyan
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleStartClick = () => {
    soundFx.playAccessGranted();
    onStart();
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none">
      {/* Background Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-40 z-0"
      />

      {/* Cyber Grid & CRT Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none z-1" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#05070c]/80 to-[#05070c] pointer-events-none z-1" />

      {/* Main Center Container */}
      <div className="relative z-10 max-w-3xl w-full mx-auto text-center flex flex-col items-center space-y-8 px-4">
        
        {/* System Status Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-mono text-xs tracking-widest uppercase shadow-lg shadow-cyan-950/50 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>TEMPORAL DRIFT DETECTED // PROTOCOL 2140</span>
        </div>

        {/* Dynamic 3D Cinematic Movie-Trailer Fly-In Title Entrance */}
        <div className="py-2 cinematic-perspective-stage w-full">
          <div key={entranceKey} className="cinematic-flyin-wrapper">
            <h1
              className="glitch-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-white font-tech select-none drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]"
              data-text="CHRONOS"
            >
              CHRONOS
            </h1>
            {/* Pulsing neon lens flare flash that blooms right as it locks into position */}
            <div className="lens-flare-flash" />
          </div>
        </div>

        <div className="text-xs sm:text-sm font-mono tracking-[0.4em] uppercase text-cyan-400/90 -mt-4 font-bold flex items-center justify-center gap-2 animate-pulse">
          <span className="w-6 h-px bg-cyan-500/50" />
          <span>THE GLITCH ENGINE</span>
          <span className="w-6 h-px bg-cyan-500/50" />
          <button
            onClick={() => {
              soundFx.playKeystroke();
              setEntranceKey((k) => k + 1);
            }}
            title="Replay 5s Cinematic Theater Intro"
            className="ml-2 text-slate-500 hover:text-cyan-400 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Immersive Lore / Story Paragraph */}
        <div className="max-w-xl mx-auto bg-[#070c18]/80 backdrop-blur-md border border-cyan-900/50 rounded-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-pink-500" />
          <p className="font-mono text-xs sm:text-sm text-slate-300 leading-relaxed text-left sm:text-center">
            In the year 2140, an irreversible temporal anomaly known as <span className="text-pink-400 font-bold">The Glitch</span> shattered the timeline continuum into volatile fragments. You and your co-pilot represent the vanguard: two operators dispatched to stabilize the core, decode encrypted historical archives, and out-calculate rival teams before timeline collapse.
          </p>
          <div className="mt-3 text-[11px] font-mono text-cyan-400/80 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dual-Operator Neural Link Required</span>
          </div>
        </div>

        {/* Glowing START Button */}
        <div className="pt-2">
          <button
            onClick={handleStartClick}
            className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-bold font-tech tracking-wider uppercase transition-all duration-300 rounded-lg text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.9)] hover:scale-105 active:scale-95 border border-cyan-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-slate-950 fill-current animate-pulse" />
              <span>START MISSION</span>
            </div>
            <div className="absolute -inset-1 rounded-lg bg-cyan-400/30 blur-sm -z-10 group-hover:opacity-100 opacity-60 transition" />
          </button>
        </div>

        {/* Technical Subtext */}
        <div className="text-[11px] font-mono text-slate-500 flex items-center justify-center gap-4">
          <span>HOST: AUTHORITATIVE</span>
          <span>•</span>
          <span>ROUNDS: 3 PHASES</span>
          <span>•</span>
          <span>SECURE SQLITE MASTER</span>
        </div>

      </div>
    </div>
  );
}
