import React from 'react';
import { PredictionResult, PatientPreset } from '../types/cardiac';
import { X, Printer, Heart, FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ClinicalReportModalProps {
  prediction: PredictionResult;
  features: Record<string, number>;
  selectedPreset: PatientPreset | undefined;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  prediction,
  features,
  selectedPreset,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const cadProb = prediction.overall_cad_risk;
  const isCad = cadProb >= 0.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-600/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cardiovascular Clinical Decision Report</h3>
              <p className="text-xs text-slate-400">CardioNexus 3D • Multimodal AI Risk Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs bg-slate-950 border border-slate-800 px-3"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Patient Header Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Patient Profile</span>
              <strong className="text-white text-xs">{selectedPreset ? selectedPreset.name : 'Custom Simulated'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Age / Sex</span>
              <strong className="text-white text-xs">{features['Age'] || 55} yrs • {features['Sex'] ? 'Male' : 'Female'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Blood Pressure / PR</span>
              <strong className="text-white text-xs">{features['BP'] || 130} mmHg • {features['PR'] || 72} BPM</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Ejection Fraction</span>
              <strong className="text-white text-xs">{features['EF-TTE'] || 50}% (Echo)</strong>
            </div>
          </div>

          {/* Diagnostic Prediction Summary */}
          <div className={`p-4 rounded-xl border ${
            isCad ? 'bg-rose-950/40 border-rose-800 text-rose-200' : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm uppercase tracking-wide">
                {isCad ? 'High CAD Probability Detected' : 'Normal / Low Coronary Risk Profile'}
              </span>
              <span className="font-mono text-base font-extrabold">
                {(cadProb * 100).toFixed(1)}% Estimated Risk
              </span>
            </div>
            <p className="text-xs opacity-90 leading-relaxed">
              Based on the multi-factorial predictive model trained on clinical demographics, ECG findings, and echocardiographic biomarkers, the patient exhibits {isCad ? 'significant risk of flow-limiting coronary artery stenosis requiring clinical follow-up.' : 'patent coronary vasculature with low immediate risk of ischemic events.'}
            </p>
          </div>

          {/* Vessel Status Matrix */}
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Coronary Vessel Stenosis Stratification
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              {(['LAD', 'LCX', 'RCA'] as const).map((v) => {
                const pred = prediction.vessel_stenosis[v];
                const stenotic = pred.probability >= 0.5;
                return (
                  <div key={v} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="font-bold text-white text-sm">{v}</div>
                    <div className="text-[10px] text-slate-400 mb-1">
                      {v === 'LAD' ? 'Anterior Wall' : v === 'LCX' ? 'Lateral Wall' : 'Inferior Wall'}
                    </div>
                    <div className={`font-mono text-sm font-black ${
                      stenotic ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {(pred.probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] mt-1 font-semibold text-slate-300">
                      {stenotic ? 'Stenosis >=50%' : 'Normal Flow'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Drivers from SHAP */}
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Primary Physiological Risk Contributors (SHAP)
            </h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              {prediction.shap_attributions.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">• {f.feature} (Value: {f.value})</span>
                  <span className={`font-mono font-bold ${
                    f.shap_impact > 0 ? 'text-rose-400' : 'text-cyan-400'
                  }`}>
                    {f.direction} ({f.shap_impact > 0 ? `+${f.shap_impact.toFixed(3)}` : f.shap_impact.toFixed(3)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Management Plan */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] mb-1">
              ACC/AHA Guideline-Concordant Recommendations
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-300 text-xs">
              {isCad ? (
                <>
                  <li>Urgent cardiology referral for diagnostic coronary angiography (Cath).</li>
                  <li>Initiate high-intensity statin therapy (Atorvastatin 40-80mg or Rosuvastatin 20-40mg).</li>
                  <li>Consider dual antiplatelet therapy (DAPT) evaluation and blood pressure optimization (target &lt;130/80 mmHg).</li>
                  <li>Assess for regional wall motion abnormalities via formal contrast echocardiogram.</li>
                </>
              ) : (
                <>
                  <li>Continue primary cardiovascular lifestyle prevention (aerobic exercise, Mediterranean diet).</li>
                  <li>Maintain systolic blood pressure &lt;120 mmHg and fasting blood glucose control.</li>
                  <li>Re-evaluate lipid panel and ASCVD risk annually.</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
          <span>CardioNexus 3D • Hackathon Track A Submission</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
