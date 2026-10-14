import React, { useState } from 'react';
import {
  Sparkles,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Info,
  HelpCircle,
  Pill,
  CheckCircle2,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { PredictionResult, ModelBenchmarks } from '../../types/cardiac';

interface ExplainabilityPageProps {
  prediction: PredictionResult;
  benchmarks: ModelBenchmarks | null;
  features: Record<string, number>;
  onUpdateFeature: (name: string, val: number) => void;
  isInterventionActive: boolean;
  onToggleIntervention: (active: boolean) => void;
  baselineCadProb: number;
}

const FEATURE_METADATA_MAP: Record<
  string,
  { label: string; unit: string; desc: string; normal: string }
> = {
  'Typical Chest Pain': {
    label: 'Typical Angina',
    unit: 'binary',
    desc: 'Substernal chest pressure triggered by physical exertion or emotional stress',
    normal: 'Absent (0)',
  },
  'EF-TTE': {
    label: 'Ejection Fraction (Echocardiogram)',
    unit: '%',
    desc: 'Percentage of blood pumped out of the left ventricle per beat',
    normal: '50% – 70%',
  },
  'Region RWMA': {
    label: 'Regional Wall Motion Abnormality',
    unit: 'segments',
    desc: 'Echocardiographic abnormal regional contraction in coronary vascular territories',
    normal: '0 segments',
  },
  Age: {
    label: 'Chronological Age',
    unit: 'years',
    desc: 'Age at clinical assessment; primary non-modifiable risk contributor',
    normal: 'N/A',
  },
  BP: {
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    desc: 'Resting systolic arterial pressure reflecting peripheral vascular resistance',
    normal: '< 120 mmHg',
  },
  PR: {
    label: 'Pulse Rate',
    unit: 'bpm',
    desc: 'Resting heart rate measured at intake',
    normal: '60 – 100 bpm',
  },
  LDL: {
    label: 'LDL Cholesterol',
    unit: 'mg/dL',
    desc: 'Atherogenic low-density lipoprotein driving coronary endothelial plaque accumulation',
    normal: '< 100 mg/dL',
  },
  HDL: {
    label: 'HDL Cholesterol',
    unit: 'mg/dL',
    desc: 'Cardioprotective high-density lipoprotein mediating reverse cholesterol transport',
    normal: '> 40 mg/dL',
  },
  TG: {
    label: 'Triglycerides',
    unit: 'mg/dL',
    desc: 'Circulating neutral fats linked with metabolic atherogenesis',
    normal: '< 150 mg/dL',
  },
  FBS: {
    label: 'Fasting Blood Sugar',
    unit: 'mg/dL',
    desc: 'Fasting serum glucose indicating glycemic control / insulin resistance',
    normal: '< 100 mg/dL',
  },
  DM: {
    label: 'Diabetes Mellitus',
    unit: 'binary',
    desc: 'History of diagnosed diabetes mellitus accelerating micro/macrovascular disease',
    normal: 'Absent (0)',
  },
  HTN: {
    label: 'Systemic Hypertension',
    unit: 'binary',
    desc: 'Chronic high arterial pressure accelerating coronary atherosclerosis',
    normal: 'Absent (0)',
  },
  'Current Smoker': {
    label: 'Active Tobacco Smoking',
    unit: 'binary',
    desc: 'Current cigarette smoking causing coronary endothelial dysfunction and vasospasm',
    normal: 'Non-Smoker (0)',
  },
  CR: {
    label: 'Serum Creatinine',
    unit: 'mg/dL',
    desc: 'Renal function biomarker correlated with cardiorenal metabolic syndrome',
    normal: '0.7 – 1.3 mg/dL',
  },
  'St Elevation': {
    label: 'ECG ST Elevation',
    unit: 'binary',
    desc: 'Transmural myocardial injury pattern on standard 12-lead ECG',
    normal: 'Absent (0)',
  },
  Tinversion: {
    label: 'ECG T-Wave Inversion',
    unit: 'binary',
    desc: 'Subendocardial ischemia or strain pattern on 12-lead ECG',
    normal: 'Absent (0)',
  },
  LVH: {
    label: 'Left Ventricular Hypertrophy',
    unit: 'binary',
    desc: 'Structural ventricular wall thickening from chronic afterload strain',
    normal: 'Absent (0)',
  },
  Sex: {
    label: 'Biological Sex',
    unit: '1=M, 0=F',
    desc: 'Male sex exhibits earlier onset of epicardial atherosclerotic stenosis',
    normal: 'N/A',
  },
};

export const ExplainabilityPage: React.FC<ExplainabilityPageProps> = ({
  prediction,
  benchmarks,
  features,
  onUpdateFeature,
  isInterventionActive,
  onToggleIntervention,
  baselineCadProb,
}) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'global' | 'whatif'>('patient');
  const [selectedTarget, setSelectedTarget] = useState<'cad' | 'lad' | 'lcx' | 'rca'>('cad');

  const patientFactors = prediction.shap_attributions || [];
  const globalFeatures = benchmarks?.top_shap_features[selectedTarget] || [];

  const postInterventionCadProb = prediction.overall_cad_risk;
  const relativeDelta =
    baselineCadProb > 0
      ? Math.round(((baselineCadProb - postInterventionCadProb) / baselineCadProb) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with Mode Selector */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Model Interpretability &amp; SHAP Explanations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Understand physiological drivers of model predictions using TreeSHAP attributions
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('patient')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'patient'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient-Specific Waterfall
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'global'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cohort Global Importance
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'whatif'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            "What-If" Sensitivity Lab
          </button>
        </div>
      </div>

      {/* Non-Causal Advisory Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Interpretation Guidelines:</span> SHAP (SHapley Additive exPlanations) values quantify how much each clinical parameter moved the tree ensemble's predicted risk score relative to the base cohort rate. SHAP values represent statistical attribution within the model, not prospective causal biological proof.
        </div>
      </div>

      {/* TAB 1: PATIENT-SPECIFIC SHAP WATERFALL */}
      {activeTab === 'patient' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Individual Patient SHAP Attributions (Overall CAD Status)
              </h3>
              <p className="text-xs text-slate-500">
                Sorted by magnitude of impact on current predicted probability ({(prediction.overall_cad_risk * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Risk Promoter (+ SHAP)</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span>Protective Factor (- SHAP)</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {patientFactors.map((factor, idx) => {
              const meta = FEATURE_METADATA_MAP[factor.feature] || {
                label: factor.feature,
                unit: '',
                desc: 'Clinical measurement from dataset',
                normal: 'Standard reference',
              };
              const isRisk = factor.direction === 'Risk Promoter';
              const absImpact = Math.abs(factor.shap_impact);
              const barWidthPercent = Math.min(100, Math.round(absImpact * 250));

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{meta.label}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                          {factor.feature}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                      <div className="text-right bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Observed Value</span>
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {factor.value} {meta.unit !== 'binary' && meta.unit !== 'status' ? meta.unit : ''}
                        </span>
                      </div>

                      <div className="text-right bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-teal-700 font-semibold block">Target / Reference</span>
                        <span className="text-xs font-mono font-medium text-slate-700">
                          {meta.normal}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          isRisk
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {isRisk ? '+' : '-'}
                        {(absImpact * 100).toFixed(1)}% {isRisk ? 'Risk' : 'Protective'}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Attribution Bar */}
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isRisk ? 'bg-rose-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COHORT GLOBAL FEATURE IMPORTANCE */}
      {activeTab === 'global' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Global Feature Importance (Z-Alizadeh Sani Cohort)
              </h3>
              <p className="text-xs text-slate-500">
                Mean absolute SHAP value across all 303 cohort patients
              </p>
            </div>

            {/* Target Model Selector */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(['cad', 'lad', 'lcx', 'rca'] as const).map((tgt) => (
                <button
                  key={tgt}
                  onClick={() => setSelectedTarget(tgt)}
                  className={`px-3 py-1 rounded font-semibold uppercase transition-all ${
                    selectedTarget === tgt
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tgt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {globalFeatures.map((item, idx) => {
              const meta = FEATURE_METADATA_MAP[item.feature] || {
                label: item.feature,
                unit: '',
                desc: 'Clinical feature from dataset',
              };
              const maxImp = globalFeatures[0]?.importance || 0.1;
              const barWidth = Math.min(100, Math.round((item.importance / maxImp) * 100));

              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="sm:w-1/3">
                    <div className="font-bold text-xs text-slate-800">{meta.label}</div>
                    <div className="text-[11px] text-slate-500">{item.feature}</div>
                  </div>

                  <div className="sm:w-1/2 flex items-center gap-3">
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-700 h-full rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 w-12 text-right">
                      {item.importance.toFixed(3)}
                    </span>
                  </div>

                  <div className="text-right sm:w-1/6 text-xs text-slate-500">
                    Cohort Mean: <span className="font-mono font-medium">{item.mean_value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: "WHAT-IF" SENSITIVITY LAB */}
      {activeTab === 'whatif' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hypothetical Sensitivity Lab: Guideline-Directed Medical Therapy (GDMT)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulate clinical impact of intensive lifestyle modification &amp; high-intensity statin therapy
                  </p>
                </div>
              </div>

              <button
                onClick={() => onToggleIntervention(!isInterventionActive)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  isInterventionActive
                    ? 'bg-teal-700 text-white hover:bg-teal-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {isInterventionActive ? 'Therapy Active (Revert)' : 'Simulate GDMT Therapy'}
              </button>
            </div>

            {/* Impact Display */}
            {isInterventionActive ? (
              <div className="mt-4 p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-900">
                    Projected Risk Reduction:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-slate-400 font-mono text-xs">
                      {(baselineCadProb * 100).toFixed(1)}% CAD
                    </span>
                    <span className="text-teal-900 font-black font-mono text-base">
                      &rarr; {(postInterventionCadProb * 100).toFixed(1)}% CAD
                    </span>
                    <span className="bg-teal-200/70 text-teal-900 px-2 py-0.5 rounded text-xs font-bold">
                      -{relativeDelta}% Relative Risk
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-teal-200/60 text-xs text-teal-900">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>LDL targeted to 70 mg/dL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>BP targeted &lt; 120 mmHg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Complete smoking cessation</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                Click "Simulate GDMT Therapy" to evaluate how optimal medical management (statin therapy, blood pressure control, smoking cessation) shifts model predictions for this specific patient.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
