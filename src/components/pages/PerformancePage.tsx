import React from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Database,
  Layers,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ModelBenchmarks } from '../../types/cardiac';

interface PerformancePageProps {
  benchmarks: ModelBenchmarks | null;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ benchmarks }) => {
  if (!benchmarks) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Loading model benchmarks...
      </div>
    );
  }

  const { dataset_info, model_benchmarks } = benchmarks;

  return (
    <div className="space-y-6">
      {/* 1. Header & Technical Rationale */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Machine Learning Architecture &amp; Benchmark Metrics
            </h2>
            <p className="text-xs text-slate-500">
              5-Fold Stratified Cross-Validation on UCI Z-Alizadeh Sani Cohort (Tehran Heart Center)
            </p>
          </div>
        </div>

        <div className="text-[11px] bg-teal-50 text-teal-800 font-semibold px-3 py-1.5 rounded-lg border border-teal-200">
          Cross-Validated &bull; Zero Leakage Audit Verified
        </div>
      </div>

      {/* 2. Target Leakage Prevention Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-950">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-emerald-900">
            Strict Target Leakage Prevention Verified:
          </div>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            In strict compliance with the hackathon specification, coronary angiography outcome features{' '}
            <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-semibold">Cath</code>,{' '}
            <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-semibold">LAD</code>,{' '}
            <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-semibold">LCX</code>, and{' '}
            <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-semibold">RCA</code>{' '}
            were strictly excluded from all feature training matrices. Prediction models rely purely on pre-catheterization clinical examination, laboratory biomarkers, ECG signs, and resting echocardiographic wall motion features.
          </p>
        </div>
      </div>

      {/* 3. Cohort Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Cohort Sample Size</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {dataset_info.num_patients} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tehran Heart Center</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Modeled Features</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {dataset_info.num_features_modeled}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">After leakage exclusion</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Cohort CAD Prevalence</div>
          <div className="text-2xl font-bold font-mono text-teal-700 mt-1">
            {(dataset_info.cad_prevalence * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">216 positive / 87 normal</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">LAD Stenosis Prevalence</div>
          <div className="text-2xl font-bold font-mono text-teal-700 mt-1">
            {(dataset_info.lad_stenosis_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Most prevalent lesion</div>
        </div>
      </div>

      {/* 4. Champion Model Benchmark Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Champion Model Benchmark Summary (5-Fold Stratified Cross-Validation)
          </h3>
          <p className="text-xs text-slate-500">
            Selected algorithm architectures optimized across out-of-fold generalization metrics
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Target Objective</th>
                <th className="py-3 px-4">Champion Algorithm</th>
                <th className="py-3 px-4 font-mono">Accuracy</th>
                <th className="py-3 px-4 font-mono">Precision</th>
                <th className="py-3 px-4 font-mono">Recall</th>
                <th className="py-3 px-4 font-mono">F1-Score</th>
                <th className="py-3 px-4 font-mono font-bold text-teal-800">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(['cad', 'lad', 'lcx', 'rca'] as const).map((tName) => {
                const item = model_benchmarks[tName];
                if (!item) return null;
                const m = item.metrics;
                return (
                  <tr key={tName} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                      {tName === 'cad' ? 'Overall CAD Status' : `${tName.toUpperCase()} Stenosis`}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {item.champion_algorithm}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {(m.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {(m.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {(m.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {(m.f1 * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-700 bg-teal-50/50">
                      {m.roc_auc.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Dataset Provenance & Cohort Boundaries */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Cohort Boundaries &amp; Validation Considerations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800">Single-Center Provenance</div>
            <p className="leading-relaxed">
              The dataset comprises 303 adult patients evaluated at Tehran Heart Center referred for coronary angiography. Patient referral bias causes elevated baseline CAD prevalence (71.3%) compared to general screening populations.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800">Need for External Prospective Validation</div>
            <p className="leading-relaxed">
              While 5-fold stratified cross-validation was strictly enforced to prevent train/test contamination, prospective multi-center validation across diverse geographic ethnicities is required before considering any real-world deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
