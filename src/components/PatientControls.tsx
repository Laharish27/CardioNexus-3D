import React, { useState } from 'react';
import { PatientPreset } from '../types/cardiac';
import { User, Sliders, RotateCcw, Check, Heart, Stethoscope, Activity, Zap } from 'lucide-react';

interface PatientControlsProps {
  presets: PatientPreset[];
  selectedPresetId: string;
  features: Record<string, number>;
  onSelectPreset: (preset: PatientPreset) => void;
  onUpdateFeature: (featureName: string, value: number) => void;
  onReset: () => void;
}

export const PatientControls: React.FC<PatientControlsProps> = ({
  presets,
  selectedPresetId,
  features,
  onUpdateFeature,
  onSelectPreset,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'labs' | 'ecg_echo'>('vitals');

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-5">
      {/* Patient Preset Header & Selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Clinical Patient Cohort Presets</h3>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Custom
          </button>
        </div>

        {/* Preset Cards for Quick Judge Demos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-950/50 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span className="truncate pr-1">{preset.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Ground Truth Audit Badge */}
      {selectedPreset && (
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Hospital Catheterization Ground Truth:</span>
            <span className="font-mono text-indigo-300">Cohort ID: #{selectedPreset.id}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className={`p-1.5 rounded-lg border ${
              selectedPreset.ground_truth.cad ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              <div className="text-[10px] uppercase font-bold">Cath CAD</div>
              <div className="font-extrabold">{selectedPreset.ground_truth.cad ? 'Positive' : 'Normal'}</div>
            </div>
            <div className={`p-1.5 rounded-lg border ${
              selectedPreset.ground_truth.lad ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              <div className="text-[10px] uppercase font-bold">LAD Stenosis</div>
              <div className="font-extrabold">{selectedPreset.ground_truth.lad ? '>=50%' : 'Normal'}</div>
            </div>
            <div className={`p-1.5 rounded-lg border ${
              selectedPreset.ground_truth.lcx ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              <div className="text-[10px] uppercase font-bold">LCX Stenosis</div>
              <div className="font-extrabold">{selectedPreset.ground_truth.lcx ? '>=50%' : 'Normal'}</div>
            </div>
            <div className={`p-1.5 rounded-lg border ${
              selectedPreset.ground_truth.rca ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              <div className="text-[10px] uppercase font-bold">RCA Stenosis</div>
              <div className="font-extrabold">{selectedPreset.ground_truth.rca ? '>=50%' : 'Normal'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Parameter Sliders & Toggles */}
      <div className="pt-2 border-t border-slate-800">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('vitals')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'vitals' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vitals & History
          </button>
          <button
            onClick={() => setActiveTab('ecg_echo')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'ecg_echo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ECG & Echo (RWMA)
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'labs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lipids & Labs
          </button>
        </div>

        {/* Tab 1: Vitals & History */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Age</span>
                <span className="font-mono text-indigo-400 font-bold">{features['Age'] ?? 55} yrs</span>
              </div>
              <input
                type="range"
                min="30"
                max="85"
                value={features['Age'] ?? 55}
                onChange={(e) => onUpdateFeature('Age', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Systolic Blood Pressure (BP)</span>
                <span className="font-mono text-indigo-400 font-bold">{features['BP'] ?? 130} mmHg</span>
              </div>
              <input
                type="range"
                min="90"
                max="200"
                value={features['BP'] ?? 130}
                onChange={(e) => onUpdateFeature('BP', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Pulse Rate (PR)</span>
                <span className="font-mono text-indigo-400 font-bold">{features['PR'] ?? 72} BPM</span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                value={features['PR'] ?? 72}
                onChange={(e) => onUpdateFeature('PR', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['DM'])}
                  onChange={(e) => onUpdateFeature('DM', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">Diabetes (DM)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['HTN'])}
                  onChange={(e) => onUpdateFeature('HTN', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">Hypertension (HTN)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['Current Smoker'])}
                  onChange={(e) => onUpdateFeature('Current Smoker', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">Active Smoker</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['Sex'])}
                  onChange={(e) => onUpdateFeature('Sex', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">Male Sex</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: ECG & Echocardiography */}
        {activeTab === 'ecg_echo' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Ejection Fraction (EF-TTE)</span>
                <span className="font-mono text-indigo-400 font-bold">{features['EF-TTE'] ?? 50}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="65"
                value={features['EF-TTE'] ?? 50}
                onChange={(e) => onUpdateFeature('EF-TTE', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Region with RWMA (Wall Motion Abnormality)</span>
                <span className="font-mono text-indigo-400 font-bold">Grade {features['Region RWMA'] ?? 0}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={features['Region RWMA'] ?? 0}
                onChange={(e) => onUpdateFeature('Region RWMA', parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['Typical Chest Pain'])}
                  onChange={(e) => onUpdateFeature('Typical Chest Pain', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">Typical Chest Pain</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['St Elevation'])}
                  onChange={(e) => onUpdateFeature('St Elevation', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">ST Elevation</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['Tinversion'])}
                  onChange={(e) => onUpdateFeature('Tinversion', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">T Inversion</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(features['LVH'])}
                  onChange={(e) => onUpdateFeature('LVH', e.target.checked ? 1 : 0)}
                  className="rounded accent-indigo-500"
                />
                <span className="text-slate-200">LVH (Hypertrophy)</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Lipids & Labs */}
        {activeTab === 'labs' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">LDL Cholesterol</span>
                <span className="font-mono text-indigo-400 font-bold">{features['LDL'] ?? 105} mg/dL</span>
              </div>
              <input
                type="range"
                min="50"
                max="240"
                value={features['LDL'] ?? 105}
                onChange={(e) => onUpdateFeature('LDL', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">HDL Cholesterol (Protective)</span>
                <span className="font-mono text-emerald-400 font-bold">{features['HDL'] ?? 40} mg/dL</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={features['HDL'] ?? 40}
                onChange={(e) => onUpdateFeature('HDL', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Fasting Blood Sugar (FBS)</span>
                <span className="font-mono text-indigo-400 font-bold">{features['FBS'] ?? 110} mg/dL</span>
              </div>
              <input
                type="range"
                min="70"
                max="300"
                value={features['FBS'] ?? 110}
                onChange={(e) => onUpdateFeature('FBS', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Serum Creatinine (CR)</span>
                <span className="font-mono text-indigo-400 font-bold">{features['CR'] ?? 1.0} mg/dL</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={features['CR'] ?? 1.0}
                onChange={(e) => onUpdateFeature('CR', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
