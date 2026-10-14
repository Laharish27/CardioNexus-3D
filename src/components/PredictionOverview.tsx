import React from 'react';
import { PredictionResult, SelectedVessel } from '../types/cardiac';
import { ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, HeartPulse, Sparkles } from 'lucide-react';

interface PredictionOverviewProps {
  prediction: PredictionResult;
  onSelectVessel: (vessel: SelectedVessel) => void;
}

export const PredictionOverview: React.FC<PredictionOverviewProps> = ({
  prediction,
  onSelectVessel,
}) => {
  const cadProb = prediction.overall_cad_risk;
  const isCadPositive = cadProb >= 0.50;

  return (
    <div className="space-y-4">
      {/* Primary CAD Status Banner */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isCadPositive
          ? 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border-rose-500/40 shadow-lg shadow-rose-950/30'
          : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              isCadPositive ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Overall Coronary Artery Disease Status
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isCadPositive ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isCadPositive ? 'High CAD Likelihood' : 'Normal / Low Risk'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                {isCadPositive ? 'CAD Positive (>=50% Multi-Vessel Stenosis)' : 'No Significant Coronary Disease Detected'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Predicted CAD Probability</div>
              <div className={`text-2xl font-black font-mono ${
                isCadPositive ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {(cadProb * 100).toFixed(1)}%
              </div>
            </div>
            <div className="w-12 h-12 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isCadPositive ? 'text-rose-500' : 'text-emerald-500'}
                  strokeDasharray={`${cadProb * 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Target Vessel Prediction Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['LAD', 'LCX', 'RCA'] as const).map((vessel) => {
          const pred = prediction.vessel_stenosis[vessel];
          const isStenotic = pred.probability >= 0.50;
          const isCritical = pred.probability >= 0.70;

          return (
            <div
              key={vessel}
              onClick={() => onSelectVessel(vessel)}
              className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 shadow-md transition-all duration-200 relative overflow-hidden"
            >
              {/* Top Accent line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                  isCritical ? 'bg-rose-500' : isStenotic ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />

              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition flex items-center gap-1.5">
                    {vessel}
                    <span className="text-[10px] text-slate-400 font-normal">
                      {vessel === 'LAD' ? 'Anterior' : vessel === 'LCX' ? 'Circumflex' : 'Right Artery'}
                    </span>
                  </h4>
                </div>

                <span className={`text-base font-black font-mono ${
                  isCritical ? 'text-rose-400' : isStenotic ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {(pred.probability * 100).toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2.5">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCritical ? 'bg-rose-500' : isStenotic ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, pred.probability * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-semibold flex items-center gap-1 ${
                  isStenotic ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {isStenotic ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {isStenotic ? 'Stenosis >=50%' : 'Patent / Normal'}
                </span>

                <span className="text-slate-400 group-hover:text-indigo-400 flex items-center gap-0.5 transition">
                  3D Inspect <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
