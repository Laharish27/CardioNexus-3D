import React from 'react';
import { Pill, Sparkles, TrendingDown, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TreatmentSimulatorProps {
  isInterventionActive: boolean;
  onToggleIntervention: (active: boolean) => void;
  baselineCadProb: number;
  postInterventionCadProb: number;
}

export const TreatmentSimulator: React.FC<TreatmentSimulatorProps> = ({
  isInterventionActive,
  onToggleIntervention,
  baselineCadProb,
  postInterventionCadProb,
}) => {
  const absoluteDelta = Math.round((baselineCadProb - postInterventionCadProb) * 1000) / 10;
  const relativeDelta = baselineCadProb > 0 ? Math.round(((baselineCadProb - postInterventionCadProb) / baselineCadProb) * 100) : 0;

  return (
    <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
      isInterventionActive
        ? 'bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-900 border-teal-500/50 shadow-xl shadow-teal-950/40'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl transition ${
            isInterventionActive ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-400'
          }`}>
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              "What-If" Guideline Medical Therapy Simulator
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                GDMT
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Simulate Statin (Atorvastatin 80mg) + ACE-I + Smoking Cessation
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => onToggleIntervention(!isInterventionActive)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
            isInterventionActive
              ? 'bg-teal-500 text-slate-950 hover:bg-teal-400'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isInterventionActive ? 'Therapy Active' : 'Simulate Therapy'}
        </button>
      </div>

      {isInterventionActive && (
        <div className="bg-slate-950/80 p-3 rounded-xl border border-teal-500/30 text-xs animate-fadeIn space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Therapy Risk Reduction:</span>
            <div className="flex items-center gap-2">
              <span className="line-through text-slate-500 font-mono">{(baselineCadProb * 100).toFixed(1)}%</span>
              <span className="text-teal-400 font-extrabold font-mono text-sm">
                {(postInterventionCadProb * 100).toFixed(1)}% CAD
              </span>
              <span className="bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-700 text-[10px] font-bold flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> -{relativeDelta}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 pt-1 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
              <span>LDL lowered to 70 mg/dL</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
              <span>BP controlled &lt;120 mmHg</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
              <span>Smoking cessation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
