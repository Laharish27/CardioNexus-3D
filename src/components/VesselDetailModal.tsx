import React from 'react';
import { SelectedVessel, VesselPrediction } from '../types/cardiac';
import { X, AlertTriangle, CheckCircle, ShieldAlert, Heart, Activity } from 'lucide-react';

interface VesselDetailModalProps {
  vessel: SelectedVessel;
  vesselPredictions: {
    LAD: VesselPrediction;
    LCX: VesselPrediction;
    RCA: VesselPrediction;
  };
  onClose: () => void;
}

const VESSEL_INFO: Record<string, {
  fullName: string;
  territory: string;
  clinicalSignificance: string;
  ecgCorrelation: string;
}> = {
  LAD: {
    fullName: 'Left Anterior Descending Coronary Artery',
    territory: 'Anterior wall of Left Ventricle, Interventricular Septum, and Cardiac Apex',
    clinicalSignificance: 'Often called the "Widowmaker." Occlusion carries the highest mortality risk due to catastrophic loss of left ventricular ejection fraction.',
    ecgCorrelation: 'Correlates with ST-segment elevations or T-wave inversions in leads V1-V4.',
  },
  LCX: {
    fullName: 'Left Circumflex Coronary Artery',
    territory: 'Posterolateral and Lateral walls of Left Ventricle, Left Atrium',
    clinicalSignificance: 'Supplies obtuse marginal branches. Stenosis frequently leads to posterolateral ischemia and papillary muscle dysfunction causing mitral regurgitation.',
    ecgCorrelation: 'Correlates with ST depressions or elevations in leads I, aVL, V5-V6.',
  },
  RCA: {
    fullName: 'Right Coronary Artery',
    territory: 'Right Ventricle, Inferior wall of Left Ventricle, Sinoatrial (SA) & Atrioventricular (AV) Nodes',
    clinicalSignificance: 'Stenosis can precipitate severe bradycardia, heart blocks, and inferior myocardial infarction with RV involvement.',
    ecgCorrelation: 'Correlates with ST-segment elevations in inferior leads (II, III, aVF).',
  },
  AORTA: {
    fullName: 'Ascending Aorta & Aortic Root',
    territory: 'Systemic arterial outflow directly from Left Ventricle',
    clinicalSignificance: 'Origins of coronary ostia. Primary conduit for oxygenated cardiac output.',
    ecgCorrelation: 'Central hemodynamic pressure load driver.',
  },
  MYOCARDIUM: {
    fullName: 'Ventricular Myocardial Muscle Wall',
    territory: 'Left and Right Ventricular Musculature',
    clinicalSignificance: 'Contractile pump of the cardiovascular system. Subject to regional wall motion abnormalities (RWMA) under coronary hypoperfusion.',
    ecgCorrelation: 'Reflected in Q-waves, bundle branch blocks, and LVH criteria.',
  },
};

export const VesselDetailModal: React.FC<VesselDetailModalProps> = ({
  vessel,
  vesselPredictions,
  onClose,
}) => {
  if (!vessel) return null;

  const info = VESSEL_INFO[vessel];
  const pred = vessel in vesselPredictions ? vesselPredictions[vessel as keyof typeof vesselPredictions] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          pred && pred.probability >= 0.70 ? 'bg-rose-500' : pred && pred.probability >= 0.40 ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              pred && pred.probability >= 0.70 ? 'bg-rose-950/80 text-rose-400 border border-rose-800' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
            }`}>
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {vessel}
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Anatomical Node
                </span>
              </h3>
              <p className="text-xs text-slate-400">{info?.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pred && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Predicted Stenosis Probability (&ge;50% Luminal Occlusion)
              </span>
              <span className={`text-base font-extrabold font-mono ${
                pred.probability >= 0.70 ? 'text-rose-400' : pred.probability >= 0.40 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {(pred.probability * 100).toFixed(1)}%
              </span>
            </div>

            {/* Risk Meter Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-500 ${
                  pred.probability >= 0.70 ? 'bg-rose-500' : pred.probability >= 0.40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, pred.probability * 100))}%` }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              {pred.probability >= 0.50 ? (
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span className={pred.probability >= 0.50 ? 'text-rose-300 font-medium' : 'text-emerald-300'}>
                Classification: {pred.label} ({pred.risk_tier} Tier)
              </span>
            </div>
          </div>
        )}

        {/* Anatomical & Clinical Context */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="font-semibold text-slate-300 block mb-1">Supplied Myocardial Territory:</span>
            <p className="text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
              {info?.territory}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-300 block mb-1">Clinical Prognosis:</span>
            <p className="text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
              {info?.clinicalSignificance}
            </p>
          </div>

          <div>
            <span className="font-semibold text-slate-300 block mb-1">Diagnostic ECG Mapping:</span>
            <p className="text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
              {info?.ecgCorrelation}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
