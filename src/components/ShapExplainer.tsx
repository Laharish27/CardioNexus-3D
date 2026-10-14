import React, { useState } from 'react';
import { PredictionResult, ModelBenchmarks } from '../types/cardiac';
import { Info, HelpCircle, TrendingUp, TrendingDown, Layers, BarChart2 } from 'lucide-react';

interface ShapExplainerProps {
  prediction: PredictionResult;
  benchmarks: ModelBenchmarks | null;
  features: Record<string, number>;
}

const FEATURE_FRIENDLY_NAMES: Record<string, { label: string; unit: string; desc: string }> = {
  'Typical Chest Pain': { label: 'Typical Angina', unit: 'binary', desc: 'Substernal chest pain provoked by exertion and relieved by rest' },
  'EF-TTE': { label: 'Ejection Fraction (Echo)', unit: '%', desc: 'Percentage of blood leaving left ventricle each contraction (normal >50%)' },
  'Region RWMA': { label: 'Regional Wall Motion Abnormality', unit: 'segments', desc: 'Echocardiographic wall motion hypokinesis/akinesis' },
  'Age': { label: 'Patient Age', unit: 'years', desc: 'Biological chronological age' },
  'BP': { label: 'Blood Pressure (Systolic)', unit: 'mmHg', desc: 'Resting systolic arterial pressure' },
  'PR': { label: 'Pulse Rate', unit: 'BPM', desc: 'Resting cardiac contractions per minute' },
  'LDL': { label: 'LDL Cholesterol', unit: 'mg/dL', desc: 'Atherogenic low-density lipoprotein' },
  'HDL': { label: 'HDL Cholesterol', unit: 'mg/dL', desc: 'Cardioprotective high-density lipoprotein' },
  'TG': { label: 'Triglycerides', unit: 'mg/dL', desc: 'Blood lipid concentration' },
  'FBS': { label: 'Fasting Blood Sugar', unit: 'mg/dL', desc: 'Fasting glycemic status' },
  'DM': { label: 'Diabetes Mellitus', unit: 'status', desc: 'Type 2 diabetes mellitus diagnosis' },
  'HTN': { label: 'Hypertension', unit: 'status', desc: 'Essential hypertension history' },
  'Current Smoker': { label: 'Active Tobacco Smoking', unit: 'status', desc: 'Current active cigarette smoking' },
  'ESR': { label: 'Erythrocyte Sedimentation Rate', unit: 'mm/hr', desc: 'Systemic inflammatory marker' },
  'CR': { label: 'Serum Creatinine', unit: 'mg/dL', desc: 'Renal clearance biomarker' },
  'St Elevation': { label: 'ECG ST Elevation', unit: 'binary', desc: 'Transmural myocardial injury marker' },
  'Tinversion': { label: 'ECG T-Wave Inversion', unit: 'binary', desc: 'Myocardial ischemia indicator' },
  'LVH': { label: 'Left Ventricular Hypertrophy', unit: 'binary', desc: 'Ventricular muscle wall thickening' },
  'Sex': { label: 'Biological Sex', unit: '1=M, 0=F', desc: 'Male biological sex associated with earlier CAD onset' },
};

export const ShapExplainer: React.FC<ShapExplainerProps> = ({
  prediction,
  benchmarks,
  features,
}) => {
  const [viewMode, setViewMode] = useState<'patient' | 'global'>('patient');
  const [targetView, setTargetView] = useState<'cad' | 'lad' | 'lcx' | 'rca'>('cad');

  const patientFactors = prediction.shap_attributions || [];
  const globalFactors = benchmarks?.top_shap_features[targetView] || [];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Clinical Interpretability & SHAP Feature Attribution
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown of physiological biomarkers driving the model prediction
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode('patient')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'patient'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Patient-Specific SHAP
          </button>
          <button
            onClick={() => setViewMode('global')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === 'global'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cohort Global Importance
          </button>
        </div>
      </div>

      {viewMode === 'patient' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Risk Promoter (+ Positive SHAP)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              Protective Factor (- Negative SHAP)
            </span>
          </div>

          {/* Patient SHAP Bars */}
          <div className="space-y-2.5">
            {patientFactors.map((factor, idx) => {
              const friendly = FEATURE_FRIENDLY_NAMES[factor.feature] || {
                label: factor.feature,
                unit: '',
                desc: 'Physiological biomarker',
              };
              const isPromoter = factor.shap_impact > 0;
              const maxAbs = Math.max(...patientFactors.map((f) => Math.abs(f.shap_impact)), 0.1);
              const barWidth = Math.min(100, Math.max(12, (Math.abs(factor.shap_impact) / maxAbs) * 100));

              return (
                <div
                  key={idx}
                  className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{friendly.label}</span>
                      <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/50">
                        Value: {factor.value} {friendly.unit !== 'binary' && friendly.unit !== 'status' ? friendly.unit : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs font-bold">
                      {isPromoter ? (
                        <span className="text-rose-400 flex items-center">
                          +{factor.shap_impact.toFixed(3)}
                          <TrendingUp className="w-3 h-3 ml-0.5" />
                        </span>
                      ) : (
                        <span className="text-cyan-400 flex items-center">
                          {factor.shap_impact.toFixed(3)}
                          <TrendingDown className="w-3 h-3 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SHAP Bar Visualization */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPromoter ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-teal-400 to-cyan-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1">{friendly.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Global Model Importance View */
        <div className="space-y-4">
          {/* Target Selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400">Target Vessel:</span>
            {(['cad', 'lad', 'lcx', 'rca'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTargetView(t)}
                className={`px-2.5 py-1 text-xs uppercase font-bold rounded-lg transition ${
                  targetView === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {globalFactors.map((gf, idx) => {
              const friendly = FEATURE_FRIENDLY_NAMES[gf.feature] || { label: gf.feature, desc: '' };
              const maxImp = Math.max(...globalFactors.map((f) => f.importance), 0.01);
              const barWidth = Math.min(100, Math.max(10, (gf.importance / maxImp) * 100));

              return (
                <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">
                      #{idx + 1} {friendly.label}
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">
                      Importance: {gf.importance.toFixed(4)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
