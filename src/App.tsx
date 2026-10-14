import React, { useState, useEffect } from 'react';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { OverviewPage } from './components/pages/OverviewPage';
import { AssessmentPage } from './components/pages/AssessmentPage';
import { ExplorerPage } from './components/pages/ExplorerPage';
import { ExplainabilityPage } from './components/pages/ExplainabilityPage';
import { PerformancePage } from './components/pages/PerformancePage';
import { ReportsPage } from './components/pages/ReportsPage';
import { AboutPage } from './components/pages/AboutPage';
import { VesselDetailModal } from './components/VesselDetailModal';
import { DatasetExplorerModal } from './components/DatasetExplorerModal';
import { computeClientInference } from './utils/inferenceEngine';
import {
  ActiveNavSection,
  PredictionResult,
  PatientPreset,
  ModelBenchmarks,
  SelectedVessel,
} from './types/cardiac';
import { Loader2, HeartPulse, X } from 'lucide-react';

export function App() {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [weights, setWeights] = useState<Record<string, any>>({});
  const [benchmarks, setBenchmarks] = useState<ModelBenchmarks | null>(null);
  const [presets, setPresets] = useState<PatientPreset[]>([]);

  // Navigation State
  const [activeSection, setActiveSection] = useState<ActiveNavSection>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active Patient State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [customPatientLabel, setCustomPatientLabel] = useState<string>('');
  const [features, setFeatures] = useState<Record<string, number>>({});
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Counterfactual "What-If" GDMT Intervention State
  const [isInterventionActive, setIsInterventionActive] = useState(false);
  const [baselinePrediction, setBaselinePrediction] = useState<PredictionResult | null>(null);

  // Modal States
  const [selectedVessel, setSelectedVessel] = useState<SelectedVessel>(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);

  // Load static data on mount
  useEffect(() => {
    async function initData() {
      try {
        const [metaRes, weightRes, benchRes, presetRes] = await Promise.all([
          fetch('/data/feature_metadata.json').then((r) => r.json()),
          fetch('/data/client_inference_weights.json').then((r) => r.json()),
          fetch('/data/model_metrics.json').then((r) => r.json()),
          fetch('/data/patient_presets.json').then((r) => r.json()),
        ]);

        setMetadata(metaRes);
        setWeights(weightRes);
        setBenchmarks(benchRes);
        setPresets(presetRes);

        if (presetRes && presetRes.length > 0) {
          const initPreset = presetRes[1] || presetRes[0]; // e.g. LAD Stenosis
          setSelectedPresetId(initPreset.id);
          setFeatures(initPreset.features);

          const initPred = computeClientInference(initPreset.features, weightRes, metaRes);
          setPrediction(initPred);
          setBaselinePrediction(initPred);
        }
      } catch (err) {
        console.error('Failed to load dataset artifacts:', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Update a single feature and recalculate
  const handleUpdateFeature = (name: string, val: number) => {
    const updated = { ...features, [name]: val };
    setFeatures(updated);
    setSelectedPresetId('');
    setIsInterventionActive(false);

    if (weights && metadata) {
      const pred = computeClientInference(updated, weights, metadata);
      setPrediction(pred);
      setBaselinePrediction(pred);
    }
  };

  // Select predefined cohort preset
  const handleSelectPreset = (preset: PatientPreset) => {
    setSelectedPresetId(preset.id);
    setCustomPatientLabel('');
    setFeatures(preset.features);
    setIsInterventionActive(false);

    if (weights && metadata) {
      const pred = computeClientInference(preset.features, weights, metadata);
      setPrediction(pred);
      setBaselinePrediction(pred);
    }
  };

  // Run assessment with full feature bundle (e.g. from manual submit or parsed upload)
  const handleRunAssessment = (updatedFeatures: Record<string, number>) => {
    setFeatures(updatedFeatures);
    setSelectedPresetId('');
    setCustomPatientLabel('Custom Clinician Assessment');
    setIsInterventionActive(false);

    if (weights && metadata) {
      const pred = computeClientInference(updatedFeatures, weights, metadata);
      setPrediction(pred);
      setBaselinePrediction(pred);
    }
    setActiveSection('overview');
  };

  // Toggle "What-If" Guideline Medical Therapy Intervention
  const handleToggleIntervention = (active: boolean) => {
    setIsInterventionActive(active);
    if (!weights || !metadata) return;

    if (active) {
      const postTherapyFeatures = {
        ...features,
        LDL: Math.min(features['LDL'] || 130, 70), // Target LDL < 70
        BP: Math.min(features['BP'] || 140, 118),  // Target BP < 120
        'Current Smoker': 0,                      // Smoking Cessation
        FBS: Math.min(features['FBS'] || 110, 95),  // Normal fasting glucose
      };
      const postPred = computeClientInference(postTherapyFeatures, weights, metadata);
      setPrediction(postPred);
    } else {
      if (baselinePrediction) {
        setPrediction(baselinePrediction);
      }
    }
  };

  // Reset to clean assessment
  const handleNewAssessment = () => {
    if (presets.length > 0) {
      handleSelectPreset(presets[0]);
    }
    setActiveSection('assessment');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Initializing CardioNexus 3D...</h2>
        <p className="text-xs text-slate-500 mt-1">
          Loading AI model weights and anatomical coordinate mapping
        </p>
      </div>
    );
  }

  const selectedPresetObj = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 1. Persistent Clinical Disclaimer Banner */}
      <DisclaimerBanner />

      <div className="flex flex-1 relative overflow-hidden">
        {/* 2. Collapsible Left Sidebar (Desktop) */}
        <Sidebar
          activeSection={activeSection}
          onNavigate={(sec) => {
            setActiveSection(sec);
            setIsMobileMenuOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-black/50 backdrop-blur-xs">
            <div className="w-64 bg-white h-full shadow-2xl flex flex-col">
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-teal-700" />
                  <span className="font-bold text-slate-900">CardioNexus 3D</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeSection={activeSection}
                  onNavigate={(sec) => {
                    setActiveSection(sec);
                    setIsMobileMenuOpen(false);
                  }}
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Workspace Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar Navigation */}
          <TopNav
            activeSection={activeSection}
            prediction={prediction}
            patientPresetName={customPatientLabel || selectedPresetObj?.name}
            onNewAssessment={handleNewAssessment}
            onExportReport={() => setActiveSection('reports')}
            onOpenDataset={() => setShowDatasetModal(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          {/* Page Content Container */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {prediction && (
              <>
                {activeSection === 'overview' && (
                  <OverviewPage
                    prediction={prediction}
                    features={features}
                    selectedVessel={selectedVessel}
                    onSelectVessel={setSelectedVessel}
                    onNavigateToAssessment={() => setActiveSection('assessment')}
                    onNavigateToReports={() => setActiveSection('reports')}
                    onNavigateToExplorer={() => setActiveSection('explorer')}
                    onNavigateToExplainability={() => setActiveSection('explainability')}
                    onOpenDataset={() => setShowDatasetModal(true)}
                    selectedPreset={selectedPresetObj}
                  />
                )}

                {activeSection === 'assessment' && (
                  <AssessmentPage
                    features={features}
                    onUpdateFeature={handleUpdateFeature}
                    presets={presets}
                    selectedPresetId={selectedPresetId}
                    onSelectPreset={handleSelectPreset}
                    onRunAssessment={handleRunAssessment}
                    onOpenDataset={() => setShowDatasetModal(true)}
                  />
                )}

                {activeSection === 'explorer' && (
                  <ExplorerPage
                    prediction={prediction}
                    features={features}
                    selectedVessel={selectedVessel}
                    onSelectVessel={setSelectedVessel}
                  />
                )}

                {activeSection === 'explainability' && (
                  <ExplainabilityPage
                    prediction={prediction}
                    benchmarks={benchmarks}
                    features={features}
                    onUpdateFeature={handleUpdateFeature}
                    isInterventionActive={isInterventionActive}
                    onToggleIntervention={handleToggleIntervention}
                    baselineCadProb={baselinePrediction?.overall_cad_risk ?? prediction.overall_cad_risk}
                  />
                )}

                {activeSection === 'performance' && (
                  <PerformancePage benchmarks={benchmarks} />
                )}

                {activeSection === 'reports' && (
                  <ReportsPage
                    prediction={prediction}
                    features={features}
                    selectedPreset={selectedPresetObj}
                    patientLabel={customPatientLabel}
                  />
                )}

                {activeSection === 'about' && <AboutPage />}
              </>
            )}
          </main>

          {/* Clinical Workstation Footer */}
          <footer className="mt-auto py-3 px-6 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-700" />
              <span>CardioNexus 3D &bull; Multimodal AI Hackathon 2026 (Track A)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Decision-Support Research Prototype &bull; UCI Z-Alizadeh Sani Cohort &bull; Zero Target-Leakage Architecture
            </div>
          </footer>
        </div>
      </div>

      {/* Modals */}
      {selectedVessel && prediction && (
        <VesselDetailModal
          vessel={selectedVessel}
          vesselPredictions={prediction.vessel_stenosis}
          onClose={() => setSelectedVessel(null)}
        />
      )}

      {showDatasetModal && (
        <DatasetExplorerModal
          onSelectPatientRow={(patientFeatures, patientInfo) => {
            setFeatures(patientFeatures);
            setSelectedPresetId('');
            setCustomPatientLabel(patientInfo);
            setIsInterventionActive(false);
            if (weights && metadata) {
              const pred = computeClientInference(patientFeatures, weights, metadata);
              setPrediction(pred);
              setBaselinePrediction(pred);
            }
            setShowDatasetModal(false);
            setActiveSection('overview');
          }}
          onClose={() => setShowDatasetModal(false)}
        />
      )}
    </div>
  );
}

export default App;
