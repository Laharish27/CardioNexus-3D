import React, { useState } from 'react';
import { HeartPulse, Award, Volume2, VolumeX, FileText, Database } from 'lucide-react';

interface HeaderProps {
  onOpenBenchmarks: () => void;
  onOpenReport: () => void;
  onOpenDataset: () => void;
  pulseRate?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBenchmarks,
  onOpenReport,
  onOpenDataset,
  pulseRate = 72,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const toggleSound = () => {
    if (!soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
        setSoundEnabled(true);
        playHeartbeatSound();
      } catch (e) {
        console.error('Audio not supported:', e);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setSoundEnabled(false);
    }
  };

  const playHeartbeatSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.12);

    setTimeout(() => {
      if (!audioCtxRef.current) return;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(80, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.09, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.1);
    }, 180);

    if (soundEnabled) {
      setTimeout(playHeartbeatSound, (60 / pulseRate) * 1000);
    }
  };

  return (
    <header className="space-y-3">
      {/* Top Clinical Safety Disclaimer */}
      <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          <span>
            <strong className="text-amber-300 font-semibold">CLINICAL SAFETY DISCLAIMER:</strong>{' '}
            Predictions are generated for clinical decision support and educational research only. This system is NOT a substitute for diagnostic coronary angiography or formal clinical evaluation.
          </span>
        </div>
        <span className="hidden md:inline-block text-[10px] text-amber-400/80 font-mono">
          FDA/CE-Mark Exempt Research Demo
        </span>
      </div>

      {/* Main Navbar */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <HeartPulse className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white m-0">CardioNexus 3D</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Track A: Cardiovascular
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              Interactive 3D Anatomical Twin & Multi-Vessel Stenosis Predictor
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              soundEnabled
                ? 'bg-rose-950/70 border-rose-600/50 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Synthesized Cardiac Pulse Sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Audio ON' : 'Audio'}</span>
          </button>

          <button
            onClick={onOpenDataset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-850 text-indigo-300 border border-indigo-900/60 hover:border-indigo-500/50 shadow transition"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dataset Cohort (303 Patients)</span>
          </button>

          <button
            onClick={onOpenBenchmarks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-850 text-indigo-300 border border-indigo-900/60 hover:border-indigo-500/50 shadow transition"
          >
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>Validation Metrics (5-Fold CV)</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
