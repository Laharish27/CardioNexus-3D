import React, { useEffect, useRef, useState } from 'react';
import { Activity, Radio, AlertCircle, ShieldAlert, Heart, Info } from 'lucide-react';

interface EcgMonitorProps {
  pulseRate: number;
  stElevation?: number;
  tInversion?: number;
  lvh?: number;
  bbb?: number;
  ladStenosisProb: number;
  rcaStenosisProb: number;
  lcxStenosisProb: number;
}

export const EcgMonitor: React.FC<EcgMonitorProps> = ({
  pulseRate = 72,
  stElevation = 0,
  tInversion = 0,
  lvh = 0,
  bbb = 0,
  ladStenosisProb,
  rcaStenosisProb,
  lcxStenosisProb,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLead, setSelectedLead] = useState<'V3-V4 (LAD)' | 'II (Inferior/RCA)' | 'V5-V6 (LCX)' | 'Lead II (Rhythm)'>('V3-V4 (LAD)');

  // Determine pathological state based on stenosis or explicit ECG flags
  const hasLadIschemia = ladStenosisProb >= 0.5 || stElevation > 0;
  const hasRcaIschemia = rcaStenosisProb >= 0.5;
  const hasLcxIschemia = lcxStenosisProb >= 0.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepX = 0;
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    const historyY = new Float32Array(width).fill(midY);
    let beatPhase = 0;

    const drawGrid = () => {
      ctx.fillStyle = '#06130d';
      ctx.fillRect(0, 0, width, height);

      // Minor grid lines (1mm equivalents)
      ctx.strokeStyle = '#0e2b1f';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Major grid lines (5mm equivalents)
      ctx.strokeStyle = '#18503b';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    drawGrid();

    const getEcgSample = (phase: number): number => {
      let v = 0;

      // P wave (Atrial depolarization: 0.10 - 0.20)
      if (phase >= 0.10 && phase < 0.20) {
        const pP = (phase - 0.10) / 0.10;
        v += Math.sin(pP * Math.PI) * 0.15;
      }

      // Q wave (Septal depolarization: 0.23 - 0.25)
      if (phase >= 0.23 && phase < 0.25) {
        v -= 0.18;
      }

      // R wave (Ventricular depolarization spike: 0.25 - 0.30)
      if (phase >= 0.25 && phase < 0.30) {
        const rP = (phase - 0.25) / 0.05;
        const rAmplitude = lvh ? 1.7 : 1.25;
        v += Math.sin(rP * Math.PI) * rAmplitude;
      }

      // S wave (0.30 - 0.33)
      if (phase >= 0.30 && phase < 0.33) {
        v -= 0.35;
      }

      // Bundle branch block widening
      if (bbb && phase >= 0.33 && phase < 0.37) {
        v += 0.25;
      }

      // ST Segment & Elevation
      const isLeadElevated =
        (selectedLead.includes('LAD') && hasLadIschemia) ||
        (selectedLead.includes('RCA') && hasRcaIschemia) ||
        (selectedLead.includes('LCX') && hasLcxIschemia);

      if (phase >= 0.33 && phase < 0.52) {
        if (isLeadElevated) {
          const stShift = (selectedLead.includes('LAD') ? 0.45 : 0.35);
          v += stShift;
        }
      }

      // T wave (Ventricular repolarization: 0.45 - 0.65)
      if (phase >= 0.45 && phase < 0.65) {
        const tP = (phase - 0.45) / 0.20;
        let tAmp = 0.28;
        if (tInversion || (isLeadElevated && selectedLead.includes('LAD'))) {
          tAmp = -0.32;
        }
        v += Math.sin(tP * Math.PI) * tAmp;
      }

      return v;
    };

    const render = () => {
      const sweepSpeed = 2.2;
      const bpm = Math.max(45, Math.min(140, pulseRate));
      const phaseDelta = (bpm / 60) * (sweepSpeed / 60) * 0.28;

      const clearWidth = 14;
      ctx.fillStyle = '#06130d';
      ctx.fillRect(sweepX, 0, clearWidth, height);

      // Re-draw grid under clear band
      ctx.strokeStyle = '#0e2b1f';
      ctx.lineWidth = 0.5;
      for (let x = Math.floor(sweepX / 10) * 10; x <= sweepX + clearWidth; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(sweepX, y);
        ctx.lineTo(sweepX + clearWidth, y);
        ctx.stroke();
      }

      const sample = getEcgSample(beatPhase);
      const scaleY = height * 0.32;
      const currentY = midY - sample * scaleY;

      const prevX = (sweepX - 1 + width) % width;
      const prevY = historyY[prevX];

      // Draw active luminous green ECG beam
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#059669';
      ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(sweepX, currentY);
      ctx.stroke();

      ctx.shadowBlur = 0;
      historyY[sweepX] = currentY;

      beatPhase = (beatPhase + phaseDelta) % 1.0;
      sweepX = (sweepX + 1) % width;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [pulseRate, selectedLead, hasLadIschemia, hasRcaIschemia, hasLcxIschemia, tInversion, lvh, bbb, stElevation]);

  const isLeadElevated =
    (selectedLead.includes('LAD') && hasLadIschemia) ||
    (selectedLead.includes('RCA') && hasRcaIschemia) ||
    (selectedLead.includes('LCX') && hasLcxIschemia);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-3">
      {/* Monitor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-slate-100 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-mono text-[10px] font-bold">
            <Radio className="w-3 h-3 text-teal-600 animate-pulse" />
            SYNTHESIZED TELEMETRY
          </div>
          <span className="text-slate-800 font-bold text-xs">
            12-Lead Electrophysiological Correlation
          </span>
        </div>

        {/* Lead Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
          {(['V3-V4 (LAD)', 'II (Inferior/RCA)', 'V5-V6 (LCX)', 'Lead II (Rhythm)'] as const).map((lead) => (
            <button
              key={lead}
              onClick={() => setSelectedLead(lead)}
              className={`px-2 py-0.5 rounded-md font-medium transition ${
                selectedLead === lead
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lead.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Display */}
      <div className="relative w-full h-[120px] bg-[#06130d] rounded-lg overflow-hidden border border-slate-300 shadow-inner">
        <canvas ref={canvasRef} width={640} height={120} className="w-full h-full block" />

        {/* Top telemetry tags */}
        <div className="absolute top-2 left-2 flex items-center gap-3 text-[10px] font-mono text-emerald-400 pointer-events-none">
          <span className="font-bold">{selectedLead}</span>
          <span>25mm/s &bull; 10mm/mV</span>
          <span>HR: <strong className="text-white text-xs">{pulseRate}</strong> BPM</span>
        </div>

        {/* Diagnosis Tag */}
        <div className="absolute top-2 right-2 pointer-events-none">
          {isLeadElevated ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-rose-200 text-[10px] font-bold">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              ST ELEVATION (+2.8mm) &bull; ISCHEMIA PATTERN
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
              ISOELECTRIC ST &bull; NORMAL CONDUCTION
            </div>
          )}
        </div>
      </div>

      {/* Electrophysiological Interval Measurements */}
      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
        <div>
          <span className="text-slate-400 block">PR INTERVAL</span>
          <strong className="text-slate-800">156 ms</strong>
        </div>
        <div>
          <span className="text-slate-400 block">QRS DURATION</span>
          <strong className={bbb ? 'text-amber-700' : 'text-slate-800'}>
            {bbb ? '132 ms (Wide BBB)' : '86 ms (Normal)'}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 block">QTc INTERVAL</span>
          <strong className="text-slate-800">418 ms</strong>
        </div>
        <div>
          <span className="text-slate-400 block">ST SEGMENT</span>
          <strong className={isLeadElevated ? 'text-rose-700 font-bold' : 'text-teal-700'}>
            {isLeadElevated ? '+2.8 mm (Elevated)' : 'Isoelectric (0.0mm)'}
          </strong>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 italic">
        <Info className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Synthesized rhythm strip generated from patient ECG flags for multimodal educational correlation.</span>
      </div>
    </div>
  );
};
