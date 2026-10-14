import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Layers,
  Compass,
  Eye,
  Sliders,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { PredictionResult, SelectedVessel } from '../../types/cardiac';
import { HeartCanvas3D } from '../HeartCanvas3D';
import { EcgMonitor } from '../EcgMonitor';

interface ExplorerPageProps {
  prediction: PredictionResult;
  features: Record<string, number>;
  selectedVessel: SelectedVessel;
  onSelectVessel: (vessel: SelectedVessel) => void;
}

const detailedVesselData: Record<
  'LAD' | 'LCX' | 'RCA',
  {
    name: string;
    anatomy: string;
    territory: string;
    clinicalImpact: string;
    ecgCorrelation: string;
  }
> = {
  LAD: {
    name: 'Left Anterior Descending Artery (LAD)',
    anatomy:
      'Originates from the Left Main Coronary Artery (LMCA) and courses along the anterior interventricular groove towards the cardiac apex.',
    territory:
      'Supplies 45–55% of left ventricular myocardium, including anterior wall, anterolateral wall, and the anterior 2/3 of the interventricular septum.',
    clinicalImpact:
      'Severe stenosis (>70%) is historically termed "widowmaker" due to high mortality from extensive anterior wall infarction and sudden cardiogenic failure.',
    ecgCorrelation:
      'ST-segment elevation or deep T-wave inversion in precordial leads V1–V4; Loss of anterior R-wave progression.',
  },
  LCX: {
    name: 'Left Circumflex Artery (LCX)',
    anatomy:
      'Branches from LMCA at near 90-degree angle, coursing through the left atrioventricular groove around to the posterior base of the heart.',
    territory:
      'Supplies lateral and posterolateral LV free wall, obtuse marginal territories, and anterolateral papillary muscle.',
    clinicalImpact:
      'Stenosis often presents insidiously. Severe stenosis risks ischemic mitral regurgitation via papillary muscle ischemia.',
    ecgCorrelation:
      'ST-elevation in lateral leads I, aVL, V5, V6, or prominent posterior reciprocal depression in V1–V2.',
  },
  RCA: {
    name: 'Right Coronary Artery (RCA)',
    anatomy:
      'Arises from the right aortic sinus and travels inferiorly along the right atrioventricular sulcus, typically giving off the posterior descending artery (PDA).',
    territory:
      'Supplies right atrium, right ventricle free wall, inferior LV wall, posterior 1/3 of septum, SA node (60%), and AV node (90%).',
    clinicalImpact:
      'Stenosis frequently triggers inferior wall STEMI complicated by severe bradyarrhythmias, complete AV block, and RV infarction requiring fluid resuscitation.',
    ecgCorrelation:
      'ST-segment elevation in inferior limb leads II, III, and aVF with reciprocal changes in leads I and aVL.',
  },
};

export const ExplorerPage: React.FC<ExplorerPageProps> = ({
  prediction,
  features,
  selectedVessel,
  onSelectVessel,
}) => {
  const activeVesselKey: 'LAD' | 'LCX' | 'RCA' =
    selectedVessel === 'LCX' || selectedVessel === 'RCA' ? selectedVessel : 'LAD';

  const vesselInfo = detailedVesselData[activeVesselKey];
  const vesselPred = prediction.vessel_stenosis[activeVesselKey];

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Anatomical Advisory */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              3D Coronary Artery &amp; Cavity Explorer
            </h2>
            <p className="text-xs text-slate-500">
              Interactive anatomical visualization mapped with multi-target gradient boosting predictions
            </p>
          </div>
        </div>

        {/* Anatomical Coordinate Mapping Disclaimer Pill */}
        <div className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 max-w-xl">
          <span className="font-semibold text-slate-700">Anatomical Approximation:</span>{' '}
          Vessel paths and myocardial deformation reflect computational 3D models and patient-level ML probabilities, not invasive fluoroscopic angiograms.
        </div>
      </div>

      {/* 2. Main Exploration Canvas + Vessel Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Large 3D Viewport (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-800">
                Interactive Heart Twin Viewport
              </span>
            </div>

            {/* Quick Vessel Selector Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {(['LAD', 'LCX', 'RCA'] as const).map((vKey) => (
                <button
                  key={vKey}
                  onClick={() => onSelectVessel(vKey)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    activeVesselKey === vKey
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {vKey}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[520px] rounded-lg overflow-hidden border border-slate-100 relative bg-slate-50">
            <HeartCanvas3D
              vesselPredictions={prediction.vessel_stenosis}
              overallCadProb={prediction.overall_cad_risk}
              pulseRate={features['PR'] ?? 72}
              selectedVessel={selectedVessel}
              onSelectVessel={onSelectVessel}
            />
          </div>

          {/* Quick Guidance Under Viewport */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Patent (&lt;40%)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Moderate (40–69%)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Stenotic (≥50%)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Left-click + drag to orbit &bull; Scroll to zoom &bull; Right-click to pan
            </div>
          </div>

          {/* Synchronized Telemetry Strip */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <EcgMonitor
              pulseRate={features['PR'] ?? 72}
              stElevation={features['St Elevation']}
              tInversion={features['Tinversion']}
              lvh={features['LVH']}
              bbb={features['BBB']}
              ladStenosisProb={prediction.vessel_stenosis.LAD.probability}
              rcaStenosisProb={prediction.vessel_stenosis.RCA.probability}
              lcxStenosisProb={prediction.vessel_stenosis.LCX.probability}
            />
          </div>
        </div>

        {/* Detailed Vessel Anatomy & Clinical Panel (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Vessel Profile */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                  Target Vessel Analysis
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {vesselInfo.name}
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  vesselPred.probability >= 0.5
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {(vesselPred.probability * 100).toFixed(1)}% Stenosis
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="font-bold text-slate-700 mb-1">Anatomical Course:</div>
                <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {vesselInfo.anatomy}
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1">Perfused Myocardial Territory:</div>
                <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {vesselInfo.territory}
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1">Pathophysiological Significance:</div>
                <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {vesselInfo.clinicalImpact}
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1">ECG Correlation (Telemetry):</div>
                <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-mono text-[11px]">
                  {vesselInfo.ecgCorrelation}
                </div>
              </div>
            </div>
          </div>

          {/* Model Confidence & Threshold */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-600">Model Decision Threshold:</span>
              <span className="font-mono font-semibold text-slate-900">0.50 (50% narrowing)</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-600">Target Leakage Exclusion:</span>
              <span className="font-semibold text-emerald-700">Cath &amp; Vessels Excluded</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-600">Champion Algorithm:</span>
              <span className="font-semibold text-teal-800">
                {activeVesselKey === 'LAD'
                  ? 'Random Forest (AUC 0.855)'
                  : activeVesselKey === 'LCX'
                  ? 'XGBoost (AUC 0.707)'
                  : 'Gradient Boosting (AUC 0.674)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
