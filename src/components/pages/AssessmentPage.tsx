import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Search,
  Check,
  Edit2,
  Info,
  Database,
} from 'lucide-react';
import { PatientPreset, ReportParseResult } from '../../types/cardiac';

interface AssessmentPageProps {
  features: Record<string, number>;
  onUpdateFeature: (name: string, val: number) => void;
  presets: PatientPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: PatientPreset) => void;
  onRunAssessment: (updatedFeatures: Record<string, number>) => void;
  onOpenDataset: () => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({
  features,
  onUpdateFeature,
  presets,
  selectedPresetId,
  onSelectPreset,
  onRunAssessment,
  onOpenDataset,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [manualCategory, setManualCategory] = useState<'demo' | 'symptoms' | 'ecg' | 'labs'>('demo');

  // Local draft features for manual review before batch commit
  const [draftFeatures, setDraftFeatures] = useState<Record<string, number>>({ ...features });

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ReportParseResult | null>(null);
  const [uploadedDraftFeatures, setUploadedDraftFeatures] = useState<Record<string, number>>({});
  const [previewText, setPreviewText] = useState<string>('');

  // Keep draft in sync if external preset changes
  const handlePresetClick = (preset: PatientPreset) => {
    onSelectPreset(preset);
    setDraftFeatures({ ...preset.features });
  };

  const handleDraftChange = (name: string, val: number) => {
    const updated = { ...draftFeatures, [name]: val };
    setDraftFeatures(updated);
    onUpdateFeature(name, val);
  };

  // Upload handler for PDF or TXT
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setParseResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiBase}/api/parse-report`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: ReportParseResult = await res.json();
      setParseResult(data);
      setUploadedDraftFeatures({ ...features, ...data.extracted_features });
      setPreviewText(data.raw_text_preview);
    } catch (err: any) {
      console.warn('Backend parse failed, using client-side fallback parsing:', err);
      // Fallback: Read file text and regex parse on client
      try {
        const text = await file.text();
        const extracted: Record<string, number> = {};

        // Regex extractions
        const ageM = text.match(/(?:age|years old)[:\s]+(\d{2})/i);
        if (ageM) extracted['Age'] = parseInt(ageM[1]);

        const bpM = text.match(/(?:bp|blood pressure)[:\s]+(\d{2,3})(?:\/(\d{2,3}))?/i);
        if (bpM) extracted['BP'] = parseInt(bpM[1]);

        const prM = text.match(/(?:heart rate|pulse rate|pr|hr)[:\s]+(\d{2,3})/i);
        if (prM) extracted['PR'] = parseInt(prM[1]);

        const ldlM = text.match(/(?:ldl)[:\s]+(\d{2,3})/i);
        if (ldlM) extracted['LDL'] = parseInt(ldlM[1]);

        const hdlM = text.match(/(?:hdl)[:\s]+(\d{2,3})/i);
        if (hdlM) extracted['HDL'] = parseInt(hdlM[1]);

        const tgM = text.match(/(?:triglycerides|tg)[:\s]+(\d{2,3})/i);
        if (tgM) extracted['TG'] = parseInt(tgM[1]);

        const fbsM = text.match(/(?:fasting blood sugar|fbs|glucose)[:\s]+(\d{2,3})/i);
        if (fbsM) extracted['FBS'] = parseInt(fbsM[1]);

        const efM = text.match(/(?:ejection fraction|ef|ef-tte)[:\s]+(\d{2})/i);
        if (efM) extracted['EF-TTE'] = parseInt(efM[1]);

        const fallbackResult: ReportParseResult = {
          status: Object.keys(extracted).length > 0 ? 'partial' : 'error',
          file_name: file.name,
          features_extracted_count: Object.keys(extracted).length,
          extracted_features: extracted,
          missing_supported_fields: [
            'CR',
            'BUN',
            'ESR',
            'HB',
            'K',
            'Na',
            'WBC',
            'Lymph',
            'Neut',
            'St Elevation',
            'Tinversion',
            'LVH',
          ].filter((k) => !(k in extracted)),
          raw_text_preview: text.slice(0, 800),
          disclaimer:
            'Client-side regex extraction completed. Please verify all clinical values against primary report.',
        };

        setParseResult(fallbackResult);
        setUploadedDraftFeatures({ ...features, ...extracted });
        setPreviewText(text.slice(0, 800));
      } catch (clientErr) {
        setUploadError('Failed to parse uploaded document. Please check the file format (.pdf or .txt).');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = () => {
    onRunAssessment(uploadedDraftFeatures);
  };

  return (
    <div className="space-y-6">
      {/* Top Method Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Patient Assessment Intake</h2>
          <p className="text-xs text-slate-500">
            Choose either structured manual entry with clinical ranges or upload an existing cardiology report.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Method 1: Manual Parameter Entry
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Method 2: Medical Report Upload (PDF/TXT)
          </button>
          <button
            onClick={onOpenDataset}
            className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all text-teal-800 hover:text-teal-950 hover:bg-teal-50 flex items-center gap-1.5"
            title="Browse all 303 real patients from UCI Z-Alizadeh Sani cohort"
          >
            <Database className="w-3.5 h-3.5 text-teal-700" />
            <span>Method 3: Select from 303 Cohort Records</span>
          </button>
        </div>
      </div>

      {/* METHOD 1: MANUAL ENTRY */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Preset Quick Fill Bar */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Benchmark Patient Cohort Profiles (UCI Z-Alizadeh Sani)
                </span>
                <span className="text-xs text-slate-400">Click to autofill validated test cases or browse the full 303-patient dataset</span>
              </div>
              <button
                onClick={onOpenDataset}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-semibold text-xs transition-colors self-start sm:self-auto shadow-xs"
              >
                <Database className="w-3.5 h-3.5 text-teal-700" />
                <span>Browse All 303 Cohort Patients &rarr;</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {preset.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categorized Parameter Forms */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
            {/* Category Navigation Pills */}
            <div className="flex border-b border-slate-200 pb-3 gap-2 overflow-x-auto">
              {[
                { id: 'demo', label: '1. Demographics & Risk Factors' },
                { id: 'symptoms', label: '2. Clinical Symptoms & Exam' },
                { id: 'ecg', label: '3. ECG & Echocardiography' },
                { id: 'labs', label: '4. Laboratory & Metabolic Vitals' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setManualCategory(cat.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    manualCategory === cat.id
                      ? 'bg-teal-700 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Category 1: Demographics */}
            {manualCategory === 'demo' && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Age</span>
                    <span className="text-slate-400 font-normal">30 – 86 yrs</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['Age'] ?? 60}
                    onChange={(e) => handleDraftChange('Age', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Sex</span>
                    <span className="text-slate-400 font-normal">0: Female, 1: Male</span>
                  </label>
                  <select
                    value={draftFeatures['Sex'] ?? 1}
                    onChange={(e) => handleDraftChange('Sex', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={1}>Male</option>
                    <option value={0}>Female</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Weight (kg)</span>
                    <span className="text-slate-400 font-normal">48 – 120 kg</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['Weight'] ?? 75}
                    onChange={(e) => handleDraftChange('Weight', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Current Smoker</span>
                    <span className="text-slate-400 font-normal">0: No, 1: Yes</span>
                  </label>
                  <select
                    value={draftFeatures['Current Smoker'] ?? 0}
                    onChange={(e) => handleDraftChange('Current Smoker', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>Non-Smoker (0)</option>
                    <option value={1}>Active Smoker (1)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Diabetes Mellitus (DM)</span>
                    <span className="text-slate-400 font-normal">0: No, 1: Yes</span>
                  </label>
                  <select
                    value={draftFeatures['DM'] ?? 0}
                    onChange={(e) => handleDraftChange('DM', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>No (0)</option>
                    <option value={1}>Yes (1)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Hypertension (HTN)</span>
                    <span className="text-slate-400 font-normal">0: No, 1: Yes</span>
                  </label>
                  <select
                    value={draftFeatures['HTN'] ?? 1}
                    onChange={(e) => handleDraftChange('HTN', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>No (0)</option>
                    <option value={1}>Yes (1)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Category 2: Symptoms */}
            {manualCategory === 'symptoms' && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Systolic Blood Pressure (BP)</span>
                    <span className="text-slate-400 font-normal">90 – 190 mmHg</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['BP'] ?? 130}
                    onChange={(e) => handleDraftChange('BP', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Pulse Rate (PR)</span>
                    <span className="text-slate-400 font-normal">50 – 110 bpm</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['PR'] ?? 72}
                    onChange={(e) => handleDraftChange('PR', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Typical Chest Pain</span>
                    <span className="text-slate-400 font-normal">0: No, 1: Yes</span>
                  </label>
                  <select
                    value={draftFeatures['Typical Chest Pain'] ?? 1}
                    onChange={(e) => handleDraftChange('Typical Chest Pain', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>No (0)</option>
                    <option value={1}>Yes (1)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Dyspnea</span>
                    <span className="text-slate-400 font-normal">0: No, 1: Yes</span>
                  </label>
                  <select
                    value={draftFeatures['Dyspnea'] ?? 0}
                    onChange={(e) => handleDraftChange('Dyspnea', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>Absent (0)</option>
                    <option value={1}>Present (1)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Category 3: ECG & Echo */}
            {manualCategory === 'ecg' && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Ejection Fraction (EF-TTE)</span>
                    <span className="text-slate-400 font-normal">18% – 60%</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['EF-TTE'] ?? 45}
                    onChange={(e) => handleDraftChange('EF-TTE', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Region with RWMA</span>
                    <span className="text-slate-400 font-normal">0: None, 1–4: Segments</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={draftFeatures['Region RWMA'] ?? 0}
                    onChange={(e) => handleDraftChange('Region RWMA', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>ST Elevation</span>
                    <span className="text-slate-400 font-normal">0: Absent, 1: Present</span>
                  </label>
                  <select
                    value={draftFeatures['St Elevation'] ?? 0}
                    onChange={(e) => handleDraftChange('St Elevation', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>No ST Elevation (0)</option>
                    <option value={1}>ST Elevation Present (1)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>T-Wave Inversion</span>
                    <span className="text-slate-400 font-normal">0: Absent, 1: Present</span>
                  </label>
                  <select
                    value={draftFeatures['Tinversion'] ?? 0}
                    onChange={(e) => handleDraftChange('Tinversion', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>Normal T-Wave (0)</option>
                    <option value={1}>T-Wave Inversion (1)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Left Ventricular Hypertrophy (LVH)</span>
                    <span className="text-slate-400 font-normal">0: Absent, 1: Present</span>
                  </label>
                  <select
                    value={draftFeatures['LVH'] ?? 0}
                    onChange={(e) => handleDraftChange('LVH', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>No LVH (0)</option>
                    <option value={1}>LVH Present (1)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Category 4: Labs */}
            {manualCategory === 'labs' && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>LDL Cholesterol (mg/dL)</span>
                    <span className="text-slate-400 font-normal">&lt; 100 optimal</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['LDL'] ?? 130}
                    onChange={(e) => handleDraftChange('LDL', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>HDL Cholesterol (mg/dL)</span>
                    <span className="text-slate-400 font-normal">&gt; 40 mg/dL</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['HDL'] ?? 42}
                    onChange={(e) => handleDraftChange('HDL', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Triglycerides (TG) (mg/dL)</span>
                    <span className="text-slate-400 font-normal">&lt; 150 normal</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['TG'] ?? 160}
                    onChange={(e) => handleDraftChange('TG', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Fasting Blood Sugar (FBS) (mg/dL)</span>
                    <span className="text-slate-400 font-normal">&lt; 100 normal</span>
                  </label>
                  <input
                    type="number"
                    value={draftFeatures['FBS'] ?? 110}
                    onChange={(e) => handleDraftChange('FBS', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Serum Creatinine (CR) (mg/dL)</span>
                    <span className="text-slate-400 font-normal">0.7 – 1.3 normal</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={draftFeatures['CR'] ?? 1.1}
                    onChange={(e) => handleDraftChange('CR', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions for Manual Entry */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                All changes immediately update client-side ML feature vector.
              </span>
              <button
                onClick={() => onRunAssessment(draftFeatures)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <span>Run Assessment &amp; View 3D Twin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 2: MEDICAL REPORT UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 p-8 text-center transition-colors">
            <input
              type="file"
              id="report-file-input"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="report-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900">
                  Click to select or drag and drop cardiology report
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Supports standard Cardiology Discharge Summaries, Echo Reports, or Lab Slips (.pdf or .txt)
                </p>
              </div>
              <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[11px] font-medium text-slate-600">
                PyMuPDF OCR &bull; Clinical Entity Regex Extraction &bull; HIPAA Safe Local Processing
              </span>
            </label>
          </div>

          {/* Loading Indicator */}
          {isUploading && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                Parsing clinical document and extracting physiological parameters...
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsed Results Table */}
          {parseResult && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Extraction Complete: {parseResult.file_name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Successfully extracted {parseResult.features_extracted_count} physiological fields.
                    Please review and edit values before confirming.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-semibold">
                  Clinician Review Stage
                </span>
              </div>

              {/* Editable Extracted Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(parseResult.extracted_features).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-slate-700">{key}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">Extracted from text</div>
                    </div>
                    <input
                      type="number"
                      value={uploadedDraftFeatures[key] ?? val}
                      onChange={(e) =>
                        setUploadedDraftFeatures({
                          ...uploadedDraftFeatures,
                          [key]: Number(e.target.value),
                        })
                      }
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 text-right focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                ))}
              </div>

              {/* Missing Fields Note */}
              {parseResult.missing_supported_fields && parseResult.missing_supported_fields.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing / Defaulted Features in Report:</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    The following features were not explicitly identified in the text and will fall back to cohort medians: {parseResult.missing_supported_fields.slice(0, 8).join(', ')}...
                  </p>
                </div>
              )}

              {/* Raw Text Preview Accordion */}
              {previewText && (
                <details className="text-xs text-slate-600 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <summary className="font-semibold cursor-pointer text-slate-700">
                    View Extracted Raw Text Excerpt ({previewText.length} characters)
                  </summary>
                  <pre className="mt-2 text-[10px] font-mono text-slate-700 whitespace-pre-wrap bg-white p-3 rounded border border-slate-200 max-h-48 overflow-y-auto">
                    {previewText}
                  </pre>
                </details>
              )}

              {/* Confirmation CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirmUpload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Extracted Data &amp; Run 3D Assessment</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
