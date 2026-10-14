export interface VesselPrediction {
  probability: number;
  predicted_class: number;
  label: string;
  risk_tier: 'Low' | 'Moderate' | 'Critical';
  threshold_applied?: number;
  is_borderline?: boolean;
  uncertainty_note?: string | null;
}

export interface PredictionResult {
  status: string;
  predictions: {
    cad: VesselPrediction;
    lad: VesselPrediction;
    lcx: VesselPrediction;
    rca: VesselPrediction;
  };
  overall_cad_risk: number;
  vessel_stenosis: {
    LAD: VesselPrediction;
    LCX: VesselPrediction;
    RCA: VesselPrediction;
  };
  shap_attributions: Array<{
    feature: string;
    value: number;
    shap_impact: number;
    direction: 'Risk Promoter' | 'Protective Factor';
    normal_range?: string;
  }>;
  confirmed_patient_inputs?: Record<string, number>;
  disclaimer: string;
}

export interface PatientPreset {
  id: string;
  name: string;
  description: string;
  features: Record<string, number>;
  ground_truth: {
    cad: number;
    lad: number;
    lcx: number;
    rca: number;
  };
  initial_prediction: {
    cad_prob: number;
    lad_prob: number;
    lcx_prob: number;
    rca_prob: number;
  };
  top_shap_factors: Array<{
    feature: string;
    value: number;
    shap_impact: number;
    direction: string;
  }>;
}

export interface FeatureMetadata {
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  is_binary: boolean;
  unique_vals: number[];
}

export interface ModelBenchmarks {
  dataset_info: {
    name: string;
    num_patients: number;
    num_features_raw: number;
    num_features_modeled: number;
    target_leakage_excluded: string[];
    cad_prevalence: number;
    lad_stenosis_rate: number;
    lcx_stenosis_rate: number;
    rca_stenosis_rate: number;
  };
  model_benchmarks: Record<string, {
    champion_algorithm: string;
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
      roc_auc: number;
    };
    all_algorithms: Record<string, any>;
  }>;
  top_shap_features: Record<string, Array<{
    feature: string;
    importance: number;
    mean_value: number;
  }>>;
}

export type SelectedVessel = 'LAD' | 'LCX' | 'RCA' | 'AORTA' | 'MYOCARDIUM' | null;

export type ActiveNavSection =
  | 'overview'
  | 'assessment'
  | 'explorer'
  | 'explainability'
  | 'performance'
  | 'reports'
  | 'about';

export interface ReportParseResult {
  status: 'success' | 'partial' | 'error';
  file_name: string;
  features_extracted_count: number;
  extracted_features: Record<string, number>;
  missing_supported_fields: string[];
  raw_text_preview: string;
  disclaimer: string;
}
