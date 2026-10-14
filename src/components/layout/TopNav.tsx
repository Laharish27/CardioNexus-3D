import React from 'react';
import {
  FileText,
  RotateCcw,
  Menu,
  ShieldCheck,
  Activity,
  Heart,
  ChevronRight,
  Database,
} from 'lucide-react';
import { ActiveNavSection, PredictionResult } from '../../types/cardiac';

interface TopNavProps {
  activeSection: ActiveNavSection;
  prediction: PredictionResult | null;
  patientPresetName?: string;
  onNewAssessment: () => void;
  onExportReport: () => void;
  onOpenDataset: () => void;
  onToggleMobileMenu: () => void;
}

const sectionTitles: Record<ActiveNavSection, { title: string; subtitle: string }> = {
  overview: {
    title: 'Clinical Overview & Diagnostic Cockpit',
    subtitle: 'Integrated 3D anatomical risk mapping and multi-vessel stenosis probabilities',
  },
  assessment: {
    title: 'Patient Intake & Physiological Profile',
    subtitle: 'Manual clinical parameter entry and automated medical report document parsing',
  },
  explorer: {
    title: 'Interactive 3D Anatomical Twin Explorer',
    subtitle: 'High-fidelity coronary artery branches, internal cavity cross-section and focal inspection',
  },
  explainability: {
    title: 'Model Explainability & Feature Attributions',
    subtitle: 'Patient-specific SHAP waterfall values, global cohort importances, and what-if simulation',
  },
  performance: {
    title: 'Model Validation & Technical Performance',
    subtitle: '5-fold stratified cross-validation benchmarks and strict zero-leakage architecture audit',
  },
  reports: {
    title: 'Clinical Decision Support Documentation',
    subtitle: 'Printable medical summary report for multidisciplinary heart team review',
  },
  about: {
    title: 'System Methodology & Clinical Governance',
    subtitle: 'Cohort provenance, anatomical sources, regulatory boundaries, and research citations',
  },
};

export const TopNav: React.FC<TopNavProps> = ({
  activeSection,
  prediction,
  patientPresetName,
  onNewAssessment,
  onExportReport,
  onOpenDataset,
  onToggleMobileMenu,
}) => {
  const meta = sectionTitles[activeSection] || {
    title: 'CardioNexus 3D',
    subtitle: 'Cardiovascular Risk Prediction System',
  };

  const isCadHigh = (prediction?.overall_cad_risk ?? 0) >= 0.5;

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0 print:hidden">
      {/* Mobile Toggle + Page Title */}
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="overflow-hidden">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            {meta.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Assessment Status Pill */}
        {prediction && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isCadHigh ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="text-slate-600 font-medium truncate max-w-[200px]">
              {patientPresetName ? patientPresetName : 'Patient Record Loaded'}
            </span>
            <span
              className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                isCadHigh
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isCadHigh ? 'CAD Likelihood High' : 'CAD Low'}
            </span>
          </div>
        )}

        {/* Action: Cohort Dataset Browser */}
        <button
          onClick={onOpenDataset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/70 text-teal-800 hover:bg-teal-100 hover:text-teal-900 text-xs font-semibold shadow-xs transition-colors"
          title="Browse all 303 real patients from UCI Z-Alizadeh Sani cohort"
        >
          <Database className="w-3.5 h-3.5 text-teal-700" />
          <span className="hidden sm:inline">Cohort Dataset (303 Pts)</span>
          <span className="sm:hidden">303 Pts</span>
        </button>

        {/* Action: New Assessment */}
        <button
          onClick={onNewAssessment}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          title="Reset or configure a new assessment"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">New Assessment</span>
          <span className="sm:hidden">Reset</span>
        </button>

        {/* Action: Export Report */}
        <button
          onClick={onExportReport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors"
          title="Open printable clinical report"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>
      </div>
    </header>
  );
};
