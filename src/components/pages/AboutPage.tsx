import React from 'react';
import {
  ShieldCheck,
  Database,
  Box,
  HeartPulse,
  Award,
  AlertTriangle,
  Info,
  ExternalLink,
  Cpu,
  BookOpen,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              System Methodology, Provenance &amp; Clinical Governance
            </h2>
            <p className="text-xs text-slate-500">
              Multimodal AI Hackathon 2026 &bull; Track A: Cardiovascular Risk Visualization &amp; Prediction
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
          Prototype Specification 2.4
        </span>
      </div>

      {/* 2. Intended Use & Regulatory Boundaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Intended Clinical Use</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            CardioNexus 3D is designed strictly as an <strong>interactive educational prototype and clinical decision-support research tool</strong>. It assists cardiology trainees and clinicians in visualizing multi-vessel CAD risk patterns synthesized from routinely acquired patient physiological parameters.
          </p>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-950 text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>Prohibited Clinical Use</span>
          </div>
          <p className="text-xs text-rose-900 leading-relaxed">
            This prototype is <strong>not FDA/CE cleared</strong> as medical device software (SaMD). It must <strong>never</strong> be used as a standalone autonomous diagnostic engine, emergency triage filter, or replacement for formal invasive coronary angiography (Cath) or coronary computed tomography angiography (CCTA).
          </p>
        </div>
      </div>

      {/* 3. Scientific & Data Sources */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-700" />
          <span>Clinical Cohort Provenance (UCI Machine Learning Repository)</span>
        </h3>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
          <div className="font-semibold text-slate-900">
            Z-Alizadeh Sani Cardiovascular Cohort (Tehran Heart Center)
          </div>
          <p>
            The predictive models are trained on the curated clinical cohort published by Alizadeh Sani et al., collected at the Tehran Heart Center. The cohort comprises 303 adult patients referred for diagnostic coronary angiography.
          </p>
          <div className="pt-1 text-[11px] text-slate-500 font-mono">
            Citation: Alizadeh Sani, Z., et al. (2013). "A data mining approach for diagnosis of coronary artery disease." Computer Methods and Programs in Biomedicine, 111(1), 52-61.
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-2">
          <Box className="w-4 h-4 text-teal-700" />
          <span>3D Anatomical Mesh Provenance (BodyParts3D)</span>
        </h3>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
          <div className="font-semibold text-slate-900">
            Database Center for Life Science (DBCLS), Japan
          </div>
          <p>
            Anatomical 3D mesh representations (including coronary artery centerlines, cardiac myocardium, and aortic trunk) are adapted from the open-access BodyParts3D anatomical ontology repository.
          </p>
          <div className="pt-1 text-[11px] text-slate-500 font-mono">
            License: Creative Commons Attribution 2.1 Japan (CC BY 2.1 JP) &bull; BodyParts3D, Database Center for Life Science.
          </div>
        </div>
      </div>

      {/* 4. Machine Learning & Zero-Leakage Architecture */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-teal-700" />
          <span>Architectural Integrity &amp; Zero Target-Leakage Guarantee</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          A common pitfall in clinical machine learning is target leakage—using features derived from diagnostic angiography to predict CAD itself. In CardioNexus 3D:
        </p>

        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pl-2">
          <li>
            Features <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Cath</code> (catheterization outcome) and target labels <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">LAD</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">LCX</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">RCA</code> are strictly isolated from the training matrices.
          </li>
          <li>
            Evaluation is conducted using 5-Fold Stratified Cross-Validation with isolated preprocessing transformers.
          </li>
          <li>
            Model interpretability is computed using exact TreeSHAP approximations for verified feature attribution.
          </li>
        </ul>
      </div>
    </div>
  );
};
