import { PredictionResult, VesselPrediction } from '../types/cardiac';

interface ClientWeights {
  intercept: number;
  coefficients: Record<string, number>;
  scaler_means: Record<string, number>;
  scaler_scales: Record<string, number>;
}

export function computeClientInference(
  features: Record<string, number>,
  weights: Record<string, ClientWeights>,
  metadata: Record<string, any>
): PredictionResult {
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));

  const predictTarget = (targetName: string): VesselPrediction => {
    const targetWeights = weights[targetName];
    if (!targetWeights) {
      return { probability: 0.1, predicted_class: 0, label: 'Normal', risk_tier: 'Low' };
    }

    let z = targetWeights.intercept;
    for (const [feat, coef] of Object.entries(targetWeights.coefficients)) {
      const val = features[feat] ?? (metadata[feat]?.mean ?? 0);
      const mean = targetWeights.scaler_means[feat] ?? 0;
      const scale = targetWeights.scaler_scales[feat] || 1;
      const scaledVal = (val - mean) / scale;
      z += scaledVal * coef;
    }

    const prob = Math.round(sigmoid(z) * 10000) / 10000;
    const isStenotic = prob >= 0.50;
    
    let risk_tier: 'Low' | 'Moderate' | 'Critical' = 'Low';
    if (prob >= 0.70) risk_tier = 'Critical';
    else if (prob >= 0.40) risk_tier = 'Moderate';

    return {
      probability: prob,
      predicted_class: isStenotic ? 1 : 0,
      label: targetName === 'cad' 
        ? (isStenotic ? 'CAD Positive (>=50% Occlusion)' : 'Normal / Low CAD Risk')
        : (isStenotic ? 'Significant Stenosis (>=50%)' : 'Patent / Normal Flow'),
      risk_tier
    };
  };

  const cadPred = predictTarget('cad');
  const ladPred = predictTarget('lad');
  const lcxPred = predictTarget('lcx');
  const rcaPred = predictTarget('rca');

  // Compute local SHAP-like attribution for each feature
  const targetWeights = weights['cad'];
  const shapAttributions: Array<{
    feature: string;
    value: number;
    shap_impact: number;
    direction: 'Risk Promoter' | 'Protective Factor';
    normal_range?: string;
  }> = [];

  if (targetWeights) {
    for (const [feat, coef] of Object.entries(targetWeights.coefficients)) {
      const val = features[feat] ?? (metadata[feat]?.mean ?? 0);
      const mean = targetWeights.scaler_means[feat] ?? 0;
      const scale = targetWeights.scaler_scales[feat] || 1;
      const impact = ((val - mean) / scale) * coef;

      shapAttributions.push({
        feature: feat,
        value: val,
        shap_impact: Math.round(impact * 1000) / 1000,
        direction: impact > 0 ? 'Risk Promoter' : 'Protective Factor',
        normal_range: metadata[feat] ? `${metadata[feat].min} - ${metadata[feat].max}` : undefined
      });
    }

    shapAttributions.sort((a, b) => Math.abs(b.shap_impact) - Math.abs(a.shap_impact));
  }

  return {
    status: 'success',
    predictions: {
      cad: cadPred,
      lad: ladPred,
      lcx: lcxPred,
      rca: rcaPred,
    },
    overall_cad_risk: cadPred.probability,
    vessel_stenosis: {
      LAD: ladPred,
      LCX: lcxPred,
      RCA: rcaPred,
    },
    shap_attributions: shapAttributions.slice(0, 8),
    disclaimer: 'FOR CLINICAL DECISION SUPPORT & EDUCATIONAL PURPOSES ONLY. NOT A SUBSTITUTE FOR FORMAL CORONARY ANGIOGRAPHY OR DIAGNOSTIC IMAGING.'
  };
}
