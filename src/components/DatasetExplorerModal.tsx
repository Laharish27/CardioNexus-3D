import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Upload, CheckCircle2, AlertTriangle, X, Play, ArrowRight, User } from 'lucide-react';

interface DatasetPatient {
  id: number;
  Age: number;
  Sex: string;
  BP: number;
  PR: number;
  LDL: number;
  HDL: number;
  FBS: number;
  EF_TTE: number;
  Region_RWMA: number;
  Typical_Chest_Pain: number;
  DM: number;
  Current_Smoker: number;
  Cath_CAD: string;
  LAD: string;
  LCX: string;
  RCA: string;
}

interface DatasetExplorerModalProps {
  onSelectPatientRow: (features: Record<string, number>, patientInfo: string) => void;
  onClose: () => void;
}

export const DatasetExplorerModal: React.FC<DatasetExplorerModalProps> = ({
  onSelectPatientRow,
  onClose,
}) => {
  const [patients, setPatients] = useState<DatasetPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCad, setFilterCad] = useState<'all' | 'CAD' | 'Normal'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/dataset_cohort.json')
      .then((r) => r.json())
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dataset cohort:', err);
        setLoading(false);
      });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim());
          const firstRow = lines[1].split(',').map((v) => v.trim());
          const newFeats: Record<string, number> = {};
          headers.forEach((h, idx) => {
            const num = parseFloat(firstRow[idx]);
            if (!isNaN(num)) newFeats[h] = num;
          });
          onSelectPatientRow(newFeats, `Custom CSV: ${file.name}`);
          onClose();
        }
      } catch (err) {
        alert('Error parsing custom CSV. Please ensure valid comma-separated format.');
      }
    };
    reader.readAsText(file);
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.id.toString().includes(searchTerm) ||
      p.Age.toString().includes(searchTerm) ||
      p.Sex.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCad === 'all' || p.Cath_CAD === filterCad;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl relative my-6 text-slate-900 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  UCI Z-Alizadeh Sani Cohort Dataset Browser
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">
                  303 Real Clinical Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select any patient record to feed their actual physiological biomarkers into the 3D anatomical twin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200 transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Import Custom CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient ID (#1 to #303), Age, Sex..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <span className="text-slate-500 px-2 text-[11px] font-semibold">Cath Angiography:</span>
            <button
              onClick={() => setFilterCad('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filterCad === 'all'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All (303)
            </button>
            <button
              onClick={() => setFilterCad('CAD')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filterCad === 'CAD'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CAD Positive (216)
            </button>
            <button
              onClick={() => setFilterCad('Normal')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filterCad === 'Normal'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Normal (87)
            </button>
          </div>
        </div>

        {/* Dataset Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Loading 303 patient records from UCI dataset...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No patient records match "{searchTerm}"
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Age / Sex</th>
                  <th className="py-2.5 px-3">BP / Pulse</th>
                  <th className="py-2.5 px-3 font-mono">Lipids (LDL/HDL)</th>
                  <th className="py-2.5 px-3 font-mono">EF-TTE</th>
                  <th className="py-2.5 px-3">RWMA</th>
                  <th className="py-2.5 px-3">Cath CAD Ground Truth</th>
                  <th className="py-2.5 px-3">Vessels (LAD / LCX / RCA)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => {
                  const isCad = p.Cath_CAD === 'CAD';
                  return (
                    <tr key={p.id} className="hover:bg-teal-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        #{p.id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {p.Age} yrs &bull; {p.Sex}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {p.BP} / {p.PR}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {p.LDL} / {p.HDL}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                        {p.EF_TTE}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.Region_RWMA > 0 ? (
                          <span className="font-semibold text-rose-700">{p.Region_RWMA} Segments</span>
                        ) : (
                          <span className="text-slate-400">None (0)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isCad
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {p.Cath_CAD}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-mono">
                        <span className={p.LAD === 'Stenotic' ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                          LAD:{p.LAD === 'Stenotic' ? 'Sten' : 'Norm'}
                        </span>
                        {' '}&bull;{' '}
                        <span className={p.LCX === 'Stenotic' ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                          LCX:{p.LCX === 'Stenotic' ? 'Sten' : 'Norm'}
                        </span>
                        {' '}&bull;{' '}
                        <span className={p.RCA === 'Stenotic' ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                          RCA:{p.RCA === 'Stenotic' ? 'Sten' : 'Norm'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            const feats: Record<string, number> = {
                              Age: p.Age,
                              Sex: p.Sex === 'Male' ? 1 : 0,
                              BP: p.BP,
                              PR: p.PR,
                              LDL: p.LDL,
                              HDL: p.HDL,
                              FBS: p.FBS,
                              'EF-TTE': p.EF_TTE,
                              'Region RWMA': p.Region_RWMA,
                              'Typical Chest Pain': p.Typical_Chest_Pain,
                              DM: p.DM,
                              'Current Smoker': p.Current_Smoker,
                            };
                            onSelectPatientRow(feats, `Cohort Patient #${p.id} (${p.Cath_CAD})`);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[11px] font-semibold transition-colors shadow-xs"
                          title={`Load patient #${p.id} into 3D twin`}
                        >
                          <span>Load &amp; Predict</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer Notes */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            <strong>Dataset Source:</strong> UCI Machine Learning Repository (Z-Alizadeh Sani et al., Tehran Heart Center).
          </div>
          <div className="text-slate-400">
            Showing {filteredPatients.length} of {patients.length} cohort records
          </div>
        </div>
      </div>
    </div>
  );
};
