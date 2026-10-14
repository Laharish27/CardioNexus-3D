import React, { useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Download,
  Info,
  Check,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { PredictionResult, PatientPreset } from '../../types/cardiac';

interface ReportsPageProps {
  prediction: PredictionResult;
  features: Record<string, number>;
  selectedPreset?: PatientPreset;
  patientLabel?: string;
}

interface TargetInfo {
  target: string;
  unit: string;
  status: string;
  isAbnormal: boolean;
}

const getClinicalTargetInfo = (featureName: string, val: number, sex = 1): TargetInfo => {
  switch (featureName) {
    case 'BP':
      return {
        target: '< 120 mmHg (Normal)',
        unit: 'mmHg',
        status: val < 120 ? 'Optimal' : val < 130 ? 'Elevated' : val < 140 ? 'Stage 1 HTN' : 'Stage 2 HTN',
        isAbnormal: val >= 120,
      };
    case 'LDL':
      return {
        target: '< 100 mg/dL (< 70 high-risk)',
        unit: 'mg/dL',
        status: val < 70 ? 'Optimal (High-Risk Target)' : val < 100 ? 'Optimal' : val < 130 ? 'Borderline High' : 'Elevated Atherogenic',
        isAbnormal: val >= 100,
      };
    case 'HDL':
      return {
        target: sex === 0 ? '> 50 mg/dL (Female)' : '> 40 mg/dL (Male)',
        unit: 'mg/dL',
        status: (sex === 0 ? val >= 50 : val >= 40) ? 'Optimal Protective' : 'Low Protective HDL',
        isAbnormal: sex === 0 ? val < 50 : val < 40,
      };
    case 'TG':
      return {
        target: '< 150 mg/dL (Normal)',
        unit: 'mg/dL',
        status: val < 150 ? 'Optimal' : val < 200 ? 'Borderline High' : 'Hypertriglyceridemia',
        isAbnormal: val >= 150,
      };
    case 'FBS':
      return {
        target: '< 100 mg/dL (Euglycemia)',
        unit: 'mg/dL',
        status: val < 100 ? 'Optimal' : val < 126 ? 'Impaired Fasting' : 'Diabetic Threshold',
        isAbnormal: val >= 100,
      };
    case 'EF-TTE':
      return {
        target: '50% – 70% (Preserved EF)',
        unit: '%',
        status: val >= 50 ? 'Preserved EF' : val >= 40 ? 'Mildly Reduced EF' : 'Moderately/Severely Reduced',
        isAbnormal: val < 50,
      };
    case 'PR':
      return {
        target: '60 – 100 bpm (Normal Sinus)',
        unit: 'bpm',
        status: val >= 60 && val <= 100 ? 'Normal Sinus' : val < 60 ? 'Bradycardia' : 'Tachycardia',
        isAbnormal: val < 60 || val > 100,
      };
    case 'CR':
      return {
        target: '0.7 – 1.3 mg/dL',
        unit: 'mg/dL',
        status: val <= 1.3 ? 'Normal Clearance' : 'Impaired Renal Clearance',
        isAbnormal: val > 1.3,
      };
    case 'Typical Chest Pain':
      return {
        target: '0 (Absent / Asymptomatic)',
        unit: 'binary',
        status: val === 0 ? 'Asymptomatic' : 'Exertional Angina Present',
        isAbnormal: val > 0,
      };
    case 'Region RWMA':
      return {
        target: '0 (No Regional Asynergy)',
        unit: 'segments',
        status: val === 0 ? 'Normal Wall Motion' : `${val} Segment(s) Dyssynergy`,
        isAbnormal: val > 0,
      };
    case 'St Elevation':
      return {
        target: '0 (Isoelectric Baseline)',
        unit: 'binary',
        status: val === 0 ? 'Isoelectric (Normal)' : 'ST Elevation (Acute Injury)',
        isAbnormal: val > 0,
      };
    case 'Tinversion':
      return {
        target: '0 (Upright T-Waves)',
        unit: 'binary',
        status: val === 0 ? 'Upright (Normal)' : 'T-Wave Inversion (Ischemia)',
        isAbnormal: val > 0,
      };
    case 'LVH':
      return {
        target: '0 (Normal Thickness)',
        unit: 'binary',
        status: val === 0 ? 'Normal Wall Thickness' : 'Ventricular Hypertrophy',
        isAbnormal: val > 0,
      };
    case 'Current Smoker':
      return {
        target: '0 (Non-Smoker)',
        unit: 'binary',
        status: val === 0 ? 'Non-Smoker' : 'Active Tobacco Smoker',
        isAbnormal: val > 0,
      };
    case 'DM':
      return {
        target: '0 (No Diabetes)',
        unit: 'binary',
        status: val === 0 ? 'Non-Diabetic' : 'Type 2 Diabetes',
        isAbnormal: val > 0,
      };
    case 'HTN':
      return {
        target: '0 (Normotensive)',
        unit: 'binary',
        status: val === 0 ? 'Normotensive' : 'Hypertension History',
        isAbnormal: val > 0,
      };
    case 'Age':
      return {
        target: '< 55 yrs (Early Onset Cutoff)',
        unit: 'years',
        status: val < 55 ? 'Standard Age' : 'Advanced Risk Factor Age',
        isAbnormal: val >= 55,
      };
    default:
      return {
        target: 'Standard Cohort Baseline',
        unit: '',
        status: 'Recorded',
        isAbnormal: false,
      };
  }
};

export const ReportsPage: React.FC<ReportsPageProps> = ({
  prediction,
  features,
  selectedPreset,
  patientLabel,
}) => {
  const [clinicianNotes, setClinicianNotes] = useState(
    'Coronary assessment reviewed. Model indicates elevated LAD territory risk consistent with echocardiographic anterior wall motion finding. Recommend non-invasive coronary CTA or stress nuclear imaging for anatomical confirmation.'
  );
  const [physicianName, setPhysicianName] = useState('Dr. Alex Morgan, MD, FACC');

  const handlePrint = () => {
    window.print();
  };

  const cadProb = prediction.overall_cad_risk;
  const isCadHigh = cadProb >= 0.5;
  const patientSex = features['Sex'] ?? 1;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const coreVitals = [
    { name: 'Systolic Blood Pressure', key: 'BP', val: features['BP'] ?? 130 },
    { name: 'LDL Cholesterol', key: 'LDL', val: features['LDL'] ?? 130 },
    { name: 'HDL Cholesterol', key: 'HDL', val: features['HDL'] ?? 42 },
    { name: 'Triglycerides (TG)', key: 'TG', val: features['TG'] ?? 160 },
    { name: 'Fasting Sugar (FBS)', key: 'FBS', val: features['FBS'] ?? 110 },
    { name: 'Ejection Fraction (Echo)', key: 'EF-TTE', val: features['EF-TTE'] ?? 45 },
    { name: 'Pulse Rate (PR)', key: 'PR', val: features['PR'] ?? 72 },
    { name: 'Serum Creatinine', key: 'CR', val: features['CR'] ?? 1.1 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Toolbar (Hidden on print) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Clinical Decision Support Documentation
            </h2>
            <p className="text-xs text-slate-500">
              Comparative clinical report: Observed patient measurements vs. standard medical targets
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* 2. Printable Medical Report Document */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div>
            <div className="flex items-center gap-2 text-teal-800">
              <HeartPulse className="w-6 h-6" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                CardioNexus<span className="text-teal-700">3D</span>
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mt-1">
              Cardiovascular Risk &amp; Stenosis Decision-Support Summary
            </div>
            <div className="text-[11px] text-slate-500">
              Multimodal AI Evaluation Cohort (UCI Z-Alizadeh Sani)
            </div>
          </div>

          <div className="text-right text-xs text-slate-600 space-y-0.5">
            <div>
              <span className="font-semibold text-slate-800">Assessment ID: </span>
              <span className="font-mono">CTW-{Math.abs(features['Age'] || 60) * 1024}-2026</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Date: </span>
              <span>{currentDate}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Time: </span>
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Patient Demographics & Physiological Vitals Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Patient Baseline Profile &amp; Physiological Parameters
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Comparison against AHA / ACC / ESC Guideline Targets
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Subject Profile:</span>
                <span className="font-semibold text-slate-900">
                  {patientLabel || selectedPreset?.name || 'Custom Clinician Record'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Age &amp; Biological Sex:</span>
                <span className="font-semibold text-slate-900">
                  {features['Age'] || 60} yrs &bull; {patientSex === 1 ? 'Male' : 'Female'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Smoking Status:</span>
                <span className="font-semibold text-slate-900">
                  {features['Current Smoker'] ? 'Active Smoker (High Risk)' : 'Non-Smoker'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Diabetes / HTN:</span>
                <span className="font-semibold text-slate-900">
                  DM: {features['DM'] ? 'Yes' : 'No'} &bull; HTN: {features['HTN'] ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Physiological Parameter Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {coreVitals.map((v) => {
                const targetInfo = getClinicalTargetInfo(v.key, v.val, patientSex);
                return (
                  <div key={v.key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[11px] font-semibold text-slate-700 truncate">{v.name}</div>
                    
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-base font-bold font-mono text-slate-900">
                        {v.val} <span className="text-[10px] font-normal text-slate-400">{targetInfo.unit}</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          targetInfo.isAbnormal
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {targetInfo.status}
                      </span>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Target:</span>
                      <span className="font-semibold text-slate-600 font-mono">{targetInfo.target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary Model Diagnostic Stratification */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            2. Multi-Target Machine Learning Prediction
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isCadHigh
                ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm">
                Overall Coronary Artery Disease Status: {isCadHigh ? 'HIGH LIKELIHOOD (POSITIVE)' : 'LOW LIKELIHOOD (NEGATIVE)'}
              </span>
              <span className="text-base font-extrabold font-mono">
                {(cadProb * 100).toFixed(1)}% Estimated Risk
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {isCadHigh
                ? 'Predictive modeling identifies multi-factorial risk indicating presence of hemodynamically significant (≥50%) coronary artery disease.'
                : 'Predictive modeling identifies low probability of flow-limiting (≥50%) epicardial coronary artery stenosis.'}
            </p>
          </div>

          {/* Artery Specific Matrix */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            {(['LAD', 'LCX', 'RCA'] as const).map((vKey) => {
              const pred = prediction.vessel_stenosis[vKey];
              const isStenotic = pred.probability >= 0.5;
              return (
                <div
                  key={vKey}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center"
                >
                  <div className="font-bold text-slate-800">{vKey} Artery</div>
                  <div className="text-lg font-mono font-bold text-slate-900 my-1">
                    {(pred.probability * 100).toFixed(1)}%
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      isStenotic
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {pred.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explainability Breakdown: Observed vs What It Should Be */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Key Physiological Drivers (TreeSHAP Attributions &amp; Target Comparison)
            </span>
            <span className="text-[11px] text-slate-500">
              Compares observed measurements against recommended clinical thresholds
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Clinical Biomarker</th>
                  <th className="py-2.5 px-3">Patient Observed Value</th>
                  <th className="py-2.5 px-3">Recommended Target (What Should Be There)</th>
                  <th className="py-2.5 px-3">Clinical Evaluation</th>
                  <th className="py-2.5 px-3 font-mono text-right">Model Impact (SHAP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(prediction.shap_attributions || []).slice(0, 6).map((f, i) => {
                  const targetInfo = getClinicalTargetInfo(f.feature, f.value, patientSex);
                  const isRisk = f.direction === 'Risk Promoter';

                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {f.feature}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {f.value} {targetInfo.unit !== 'binary' && targetInfo.unit !== 'status' ? targetInfo.unit : ''}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {targetInfo.target}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            targetInfo.isAbnormal
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {targetInfo.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-slate-900 font-bold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isRisk ? 'text-rose-700' : 'text-teal-700'
                          }`}
                        >
                          {isRisk ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isRisk ? '+' : '-'}
                          {(Math.abs(f.shap_impact) * 100).toFixed(1)}% {isRisk ? 'Risk' : 'Prot'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinician Notes & Review Sign-off */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            4. Clinician Impression &amp; Sign-Off
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Attending Review Notes:
              </label>
              <textarea
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
                rows={3}
                className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:ring-1 focus:ring-teal-500 font-sans"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Reviewing Physician: </span>
                <input
                  type="text"
                  value={physicianName}
                  onChange={(e) => setPhysicianName(e.target.value)}
                  className="font-semibold text-slate-900 border-b border-slate-300 bg-transparent px-1 font-sans"
                />
              </div>
              <div className="border-t border-slate-400 sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
                <span className="text-slate-400 italic">Signature: __________________________</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Regulatory Safety Notice */}
        <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">MANDATORY CLINICAL SAFETY DISCLAIMER:</strong> This document is generated for clinical decision-support and educational research prototyping only. CardioNexus 3D predictions are not an autonomous diagnosis and must not replace clinical judgement, formal echocardiographic interpretation, or diagnostic catheterization.
        </div>
      </div>
    </div>
  );
};
