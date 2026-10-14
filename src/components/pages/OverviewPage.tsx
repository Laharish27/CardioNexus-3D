import React from 'react';
import {
  HeartPulse,
  Activity,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  FileText,
  Database,
} from 'lucide-react';
import { PredictionResult, SelectedVessel, PatientPreset } from '../../types/cardiac';
import { HeartCanvas3D } from '../HeartCanvas3D';

interface OverviewPageProps {
  prediction: PredictionResult;
  features: Record<string, number>;
  selectedVessel: SelectedVessel;
  onSelectVessel: (vessel: SelectedVessel) => void;
  onNavigateToAssessment: () => void;
  onNavigateToReports: () => void;
  onNavigateToExplorer: () => void;
  onNavigateToExplainability: () => void;
  onOpenDataset: () => void;
  selectedPreset?: PatientPreset;
}

const vesselMetadata: Record<
  'LAD' | 'LCX' | 'RCA',
  { fullName: string; territory: string; significance: string }
> = {
  LAD: {
    fullName: 'Left Anterior Descending Artery',
    territory: 'Anterior wall of left ventricle, apex, anterior 2/3 of interventricular septum',
    significance:
      'Often called the "widowmaker". Stenosis compromises anterior LV systolic ejection and risks acute cardiogenic shock.',
  },
  LCX: {
    fullName: 'Left Circumflex Artery',
    territory: 'Lateral and posterolateral walls of left ventricle, anterolateral papillary muscle',
    significance:
      'Supplies lateral LV wall. Stenosis may lead to lateral wall ischemia and secondary mitral valve incompetence.',
  },
  RCA: {
    fullName: 'Right Coronary Artery',
    territory: 'Right atrium, right ventricle, inferior LV wall, posterior 1/3 of septum, SA/AV nodes',
    significance:
      'Dominates inferior wall and cardiac conduction tissue. Stenosis can cause inferior STEMI and high-grade AV blocks.',
  },
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  prediction,
  features,
  selectedVessel,
  onSelectVessel,
  onNavigateToAssessment,
  onNavigateToReports,
  onNavigateToExplorer,
  onNavigateToExplainability,
  onOpenDataset,
  selectedPreset,
}) => {
  const cadProb = prediction.overall_cad_risk;
  const isCadHigh = cadProb >= 0.5;

  // Active inspected vessel (default to LAD if none selected)
  const currentVesselKey: 'LAD' | 'LCX' | 'RCA' =
    selectedVessel === 'LCX' || selectedVessel === 'RCA' ? selectedVessel : 'LAD';

  const inspectedVesselData = prediction.vessel_stenosis[currentVesselKey];
  const inspectedMeta = vesselMetadata[currentVesselKey];

  return (
    <div className="space-y-6">
      {/* 1. Four Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall CAD */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
              <span>Overall CAD Status</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isCadHigh
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isCadHigh ? 'Positive (≥50%)' : 'Negative (<50%)'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {(cadProb * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">Likelihood</span>
            </div>
            {/* Probability Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCadHigh ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, cadProb * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
              {isCadHigh
                ? 'Clinical indicators strongly associate with significant multi-vessel obstructive disease.'
                : 'Physiological profile reflects low probability of hemodynamically obstructive CAD.'}
            </p>
          </div>
          <button
            onClick={onNavigateToExplainability}
            className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-medium hover:text-teal-800 group"
          >
            <span>Inspect SHAP attributions</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Cards 2-4: LAD, LCX, RCA */}
        {(['LAD', 'LCX', 'RCA'] as const).map((vesselKey) => {
          const pred = prediction.vessel_stenosis[vesselKey];
          const isSelected = selectedVessel === vesselKey;
          const probPct = (pred.probability * 100).toFixed(1);

          let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          let barColor = 'bg-emerald-500';
          let statusLabel = 'Patent (<40%)';

          if (pred.probability >= 0.7) {
            statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
            barColor = 'bg-rose-500';
            statusLabel = 'Critical Stenosis (≥70%)';
          } else if (pred.probability >= 0.5) {
            statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
            barColor = 'bg-rose-500';
            statusLabel = 'Stenotic (≥50%)';
          } else if (pred.probability >= 0.4) {
            statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
            barColor = 'bg-amber-500';
            statusLabel = 'Moderate Borderline (40-49%)';
          }

          return (
            <div
              key={vesselKey}
              onClick={() => onSelectVessel(vesselKey)}
              className={`bg-white rounded-xl border p-4.5 shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-teal-500 ring-2 ring-teal-500/20'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
                  <span className="font-bold text-slate-800">{vesselKey} Branch</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}
                  >
                    {pred.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                    {probPct}%
                  </span>
                  <span className="text-xs text-slate-400">Stenosis Risk</span>
                </div>
                {/* Probability Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, pred.probability * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 truncate">
                  {vesselMetadata[vesselKey].fullName}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-medium">
                <span>{isSelected ? 'Viewing on 3D Twin' : 'Select on 3D Model'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Main Two-Column Workstation: 3D Heart (Left) + Selected Vessel Deep Dive (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive 3D Heart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>3D Anatomical Twin (Interactive WebGL Canvas)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Click artery nodes or orbit around model to inspect localized stenosis
              </p>
            </div>
            <button
              onClick={onNavigateToExplorer}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
            >
              <span>Full Screen Explorer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-[430px] rounded-lg overflow-hidden border border-slate-100 relative bg-slate-50">
            <HeartCanvas3D
              vesselPredictions={prediction.vessel_stenosis}
              overallCadProb={prediction.overall_cad_risk}
              pulseRate={features['PR'] ?? 72}
              selectedVessel={selectedVessel}
              onSelectVessel={onSelectVessel}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Patent (&lt;40%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Moderate (40–49%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Stenotic (≥50%)</span>
              </span>
            </div>
            <span className="italic text-[10px] text-slate-400">
              Rotatable &bull; Zoomable &bull; Hoverable
            </span>
          </div>
        </div>

        {/* Right Column: Selected Vessel Summary & Clinical Significance (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                  Focal Inspection
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {inspectedMeta.fullName} ({currentVesselKey})
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  inspectedVesselData.probability >= 0.5
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {(inspectedVesselData.probability * 100).toFixed(1)}% Stenosis
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="font-semibold text-slate-700 mb-0.5">Myocardial Territory:</div>
                <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {inspectedMeta.territory}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-0.5">Pathophysiological Impact:</div>
                <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {inspectedMeta.significance}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-0.5">Model Classification:</div>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Decision Threshold:</span>
                  <span className="font-mono font-semibold text-slate-800">≥ 0.50 Probability</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onNavigateToExplorer}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>Inspect Branch &amp; Heart Cavities in 3D Explorer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Assessment Case Summary */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-slate-700">
              Active Assessment Record
            </h4>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Profile:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPreset?.name || 'Custom Clinician Entry'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Demographics:</span>
                <span className="text-slate-800">
                  {features['Age'] || 60} yo {features['Sex'] === 1 ? 'Male' : 'Female'}, BP {features['BP'] || 130} mmHg
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Ejection Fraction (EF):</span>
                <span className="font-semibold text-slate-800">
                  {features['EF-TTE'] || 45}% (Echo)
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={onNavigateToAssessment}
                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Modify Inputs
              </button>
              <button
                onClick={onNavigateToReports}
                className="flex-1 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
              >
                <FileText className="w-3 h-3" />
                <span>Full Report</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={onOpenDataset}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span>Browse Full 303-Patient Dataset &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Key Patient Physiological Measurements & Top SHAP Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Key Patient Measurements Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Key Physiological &amp; Laboratory Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Active clinical measurements used for model inference
              </p>
            </div>
            <button
              onClick={onNavigateToAssessment}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              Edit All 55 Features &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Age', val: `${features['Age'] ?? 60} yrs`, target: 'Standard < 55', isAbnormal: (features['Age'] ?? 60) >= 55 },
              { label: 'Systolic BP', val: `${features['BP'] ?? 130} mmHg`, target: 'Target < 120', isAbnormal: (features['BP'] ?? 130) >= 120 },
              { label: 'Pulse Rate', val: `${features['PR'] ?? 72} bpm`, target: 'Target 60–100', isAbnormal: (features['PR'] ?? 72) < 60 || (features['PR'] ?? 72) > 100 },
              { label: 'LDL Cholesterol', val: `${features['LDL'] ?? 130} mg/dL`, target: 'Target < 100', isAbnormal: (features['LDL'] ?? 130) >= 100 },
              { label: 'HDL Cholesterol', val: `${features['HDL'] ?? 42} mg/dL`, target: 'Target > 40', isAbnormal: (features['HDL'] ?? 42) < 40 },
              { label: 'Triglycerides (TG)', val: `${features['TG'] ?? 160} mg/dL`, target: 'Target < 150', isAbnormal: (features['TG'] ?? 160) >= 150 },
              { label: 'Fasting Sugar (FBS)', val: `${features['FBS'] ?? 110} mg/dL`, target: 'Target < 100', isAbnormal: (features['FBS'] ?? 110) >= 100 },
              { label: 'Serum Creatinine', val: `${features['CR'] ?? 1.1} mg/dL`, target: 'Target 0.7–1.3', isAbnormal: (features['CR'] ?? 1.1) > 1.3 },
              { label: 'Ejection Fraction', val: `${features['EF-TTE'] ?? 45}%`, target: 'Target 50–70%', isAbnormal: (features['EF-TTE'] ?? 45) < 50 },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 truncate">{item.label}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      item.isAbnormal
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {item.isAbnormal ? 'Flagged' : 'Normal'}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">
                  {item.val}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-mono text-slate-700">{item.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Model Contributors / SHAP Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Primary Model Drivers (SHAP)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Strongest features pushing overall risk up or down
                </p>
              </div>
              <button
                onClick={onNavigateToExplainability}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Full Waterfall &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {(prediction.shap_attributions || []).slice(0, 5).map((factor, idx) => {
                const isRisk = factor.direction === 'Risk Promoter';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                  >
                    <div className="overflow-hidden">
                      <div className="font-semibold text-slate-800 truncate">
                        {factor.feature}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Observed value: <span className="font-mono font-medium">{factor.value}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isRisk ? '+' : ''}
                        {(factor.shap_impact * 100).toFixed(1)}% {isRisk ? 'Risk' : 'Protective'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 italic">
            Statistical feature attribution based on TreeSHAP. Does not imply biological causation.
          </div>
        </div>
      </div>
    </div>
  );
};
