import React from 'react';
import { ModelBenchmarks } from '../types/cardiac';
import { X, Award, ShieldCheck, CheckCircle2, Database, TrendingUp, Layers } from 'lucide-react';

interface ModelEvaluationModalProps {
  benchmarks: ModelBenchmarks | null;
  onClose: () => void;
}

export const ModelEvaluationModal: React.FC<ModelEvaluationModalProps> = ({
  benchmarks,
  onClose,
}) => {
  if (!benchmarks) return null;

  const { dataset_info, model_benchmarks } = benchmarks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                ML Predictive Performance & Validation Metrics
              </h3>
              <p className="text-xs text-slate-400">
                5-Fold Stratified Cross-Validation on UCI Z-Alizadeh Sani Cohort
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Leakage Prevention Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 mb-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-emerald-300 block mb-0.5">
              Strict Target Leakage Prevention Verified:
            </span>
            <p className="text-emerald-200/90 leading-relaxed">
              In strict accordance with the hackathon requirements, features <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-100">Cath</code>, <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-100">LAD</code>, <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-100">LCX</code>, and <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-100">RCA</code> were excluded from all input feature sets prior to model training and evaluation.
            </p>
          </div>
        </div>

        {/* Cohort Dataset Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Cohort Patients</div>
            <div className="text-lg font-bold font-mono text-white">{dataset_info.num_patients}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Clinical Features</div>
            <div className="text-lg font-bold font-mono text-white">{dataset_info.num_features_modeled}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">CAD Prevalence</div>
            <div className="text-lg font-bold font-mono text-rose-400">{(dataset_info.cad_prevalence * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">LAD Stenosis Rate</div>
            <div className="text-lg font-bold font-mono text-rose-400">{(dataset_info.lad_stenosis_rate * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Champion Model Performance Table */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            Champion Target Models (5-Fold Stratified CV Average)
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Target Objective</th>
                  <th className="py-2.5 px-3">Selected Algorithm</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Precision</th>
                  <th className="py-2.5 px-3">Recall</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                  <th className="py-2.5 px-3">ROC-AUC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(['cad', 'lad', 'lcx', 'rca'] as const).map((tName) => {
                  const m = model_benchmarks[tName];
                  if (!m) return null;
                  const met = m.metrics;
                  return (
                    <tr key={tName} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {tName.toUpperCase()}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {tName === 'cad' ? 'Overall CAD' : `${tName.toUpperCase()} Stenosis`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 text-[11px] font-mono">
                          {m.champion_algorithm}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">
                        {(met.accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {(met.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {(met.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                        {(met.f1 * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {(met.roc_auc * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Algorithm Comparison Highlight */}
        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-200 block mb-1">Methodology & Reproducibility:</span>
          Models were trained across 5 Stratified Folds comparing <span className="text-indigo-300">Gradient Boosting</span>, <span className="text-indigo-300">Random Forest</span>, and <span className="text-indigo-300">XGBoost</span>. Hyperparameters were regularized to prevent overfitting on the 303-patient cohort. SHAP values were computed using TreeExplainer on positive class probabilities.
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            Close Benchmark Report
          </button>
        </div>
      </div>
    </div>
  );
};
