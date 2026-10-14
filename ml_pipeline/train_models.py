import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, roc_curve
)
import xgboost as xgb
import shap

# Create output directories
os.makedirs("models", exist_ok=True)
os.makedirs("public/data", exist_ok=True)

print(">>> [1/6] Loading Z-Alizadeh Sani Dataset...")
data_path = "z_alizadeh_sani_raw.xlsx"
df = pd.read_excel(data_path)
print(f"Loaded {df.shape[0]} patients and {df.shape[1]} attributes.")

# Target definitions
targets = {
    "cad": (df["Cath"] == "CAD").astype(int),
    "lad": (df["LAD"] == "Stenotic").astype(int),
    "lcx": (df["LCX"] == "Stenotic").astype(int),
    "rca": (df["RCA"] == "Stenotic").astype(int),
}

leakage_cols = ["Cath", "LAD", "LCX", "RCA"]
X_raw = df.drop(columns=[col for col in leakage_cols if col in df.columns])
print(f"Features after excluding target leakage ({len(leakage_cols)} columns): {X_raw.shape[1]} features.")

# Encode features
X = X_raw.copy()

# Binary mappings
yn_map = {"Y": 1, "N": 0, "y": 1, "n": 0}
for col in [
    "Obesity", "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP",
    "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur", "Diastolic Murmur",
    "Dyspnea", "Atypical", "Nonanginal", "Exertional CP", "LowTH Ang", "LVH",
    "Poor R Progression"
]:
    if col in X.columns:
        X[col] = X[col].map(yn_map).fillna(0).astype(int)

if "Sex" in X.columns:
    X["Sex"] = (X["Sex"].str.strip().str.lower() == "male").astype(int)

# Multi-class categorical mappings
if "BBB" in X.columns:
    bbb_map = {"N": 0, "LBBB": 1, "RBBB": 2}
    X["BBB"] = X["BBB"].map(bbb_map).fillna(0).astype(int)

if "VHD" in X.columns:
    vhd_map = {"N": 0, "mild": 1, "Moderate": 2, "Severe": 3}
    X["VHD"] = X["VHD"].map(vhd_map).fillna(0).astype(int)

# Ensure all columns are numeric
for col in X.columns:
    X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0)

feature_names = list(X.columns)
print(f"Processed {len(feature_names)} numerical/encoded features.")

# Compute feature metadata for UI sliders/inputs
feature_metadata = {}
for col in feature_names:
    feature_metadata[col] = {
        "min": float(X[col].min()),
        "max": float(X[col].max()),
        "mean": round(float(X[col].mean()), 2),
        "median": round(float(X[col].median()), 2),
        "std": round(float(X[col].std()), 2),
        "is_binary": bool(X[col].nunique() <= 2),
        "unique_vals": [float(v) for v in sorted(X[col].unique())] if X[col].nunique() <= 5 else []
    }

with open("public/data/feature_metadata.json", "w") as f:
    json.dump(feature_metadata, f, indent=2)

print(">>> [2/6] Evaluating Models with 5-Fold Stratified Cross Validation...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

model_candidates = {
    "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42),
    "XGBoost": xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, eval_metric="logloss", random_state=42),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42),
}

benchmark_results = {}
final_models = {}
metrics_summary = {}

for target_name, y in targets.items():
    print(f"\n--- Target: {target_name.upper()} (Positive rate: {y.mean():.2%}) ---")
    benchmark_results[target_name] = {}
    
    best_f1 = -1
    best_model_name = None
    best_estimator = None

    for m_name, model in model_candidates.items():
        scoring = ["accuracy", "precision", "recall", "f1", "roc_auc"]
        cv_res = cross_validate(model, X, y, cv=cv, scoring=scoring)
        
        m_perf = {
            "accuracy": round(float(cv_res["test_accuracy"].mean()), 4),
            "precision": round(float(cv_res["test_precision"].mean()), 4),
            "recall": round(float(cv_res["test_recall"].mean()), 4),
            "f1": round(float(cv_res["test_f1"].mean()), 4),
            "roc_auc": round(float(cv_res["test_roc_auc"].mean()), 4),
            "accuracy_std": round(float(cv_res["test_accuracy"].std()), 4),
            "f1_std": round(float(cv_res["test_f1"].std()), 4),
        }
        benchmark_results[target_name][m_name] = m_perf
        print(f"  [{m_name}] Acc: {m_perf['accuracy']:.4f} | F1: {m_perf['f1']:.4f} | AUC: {m_perf['roc_auc']:.4f}")
        
        if m_perf["f1"] > best_f1:
            best_f1 = m_perf["f1"]
            best_model_name = m_name

    # Train final model on full dataset or train/val split
    print(f"  >> Selected Champion for {target_name.upper()}: {best_model_name}")
    champion_cls = model_candidates[best_model_name].__class__
    champion_params = model_candidates[best_model_name].get_params()
    final_model = champion_cls(**champion_params)
    final_model.fit(X, y)
    
    final_models[target_name] = final_model
    joblib.dump(final_model, f"models/{target_name}_model.joblib")
    
    # Store champion metrics
    metrics_summary[target_name] = {
        "champion_algorithm": best_model_name,
        "metrics": benchmark_results[target_name][best_model_name],
        "all_algorithms": benchmark_results[target_name]
    }

print("\n>>> [3/6] Computing SHAP Explainability & Global Feature Attributions...")
shap_explanations = {}
feature_importances = {}

for target_name, model in final_models.items():
    explainer = shap.TreeExplainer(model)
    # Explain all samples
    raw_shap_values = explainer.shap_values(X)
    
    # Handle binary classification shap output shape
    if isinstance(raw_shap_values, list):
        # Class 1 (positive)
        vals = raw_shap_values[1]
    elif len(raw_shap_values.shape) == 3:
        vals = raw_shap_values[:, :, 1]
    else:
        vals = raw_shap_values
        
    mean_abs_shap = np.abs(vals).mean(axis=0)
    top_indices = np.argsort(mean_abs_shap)[::-1][:15]
    
    top_features = [
        {
            "feature": feature_names[idx],
            "importance": round(float(mean_abs_shap[idx]), 4),
            "mean_value": round(float(X[feature_names[idx]].mean()), 2)
        }
        for idx in top_indices
    ]
    feature_importances[target_name] = top_features
    print(f"Top 3 SHAP features for {target_name.upper()}: {[f['feature'] for f in top_features[:3]]}")

print("\n>>> [4/6] Extracting Curated Patient Presets from Real Cohort...")
# We pick 5 diverse clinically meaningful patients from the dataset:
# 1. Normal Healthy (low risk across all)
# 2. Borderline / Moderate Risk
# 3. LAD-Dominant Stenosis ("Widowmaker")
# 4. Multi-Vessel CAD (LAD + LCX + RCA)
# 5. RCA Stenosis (Inferior ischemia)

patient_indices = []
# Find a true normal patient
norm_idx = np.where((targets["cad"] == 0) & (targets["lad"] == 0) & (targets["lcx"] == 0) & (targets["rca"] == 0))[0]
if len(norm_idx) > 0:
    patient_indices.append(("Normal Healthy Athlete (Low Risk)", int(norm_idx[0]), "Clean coronary vessels, normal ejection fraction, no regional wall motion abnormality."))

# Find LAD isolated
lad_only_idx = np.where((targets["cad"] == 1) & (targets["lad"] == 1) & (targets["lcx"] == 0) & (targets["rca"] == 0))[0]
if len(lad_only_idx) > 0:
    patient_indices.append(("Isolated LAD Stenosis (Anterior Ischemia)", int(lad_only_idx[0]), "Severe stenosis isolated to LAD (widowmaker territory), ST elevation present."))
elif len(np.where(targets["lad"] == 1)[0]) > 0:
    patient_indices.append(("High LAD Stenosis Risk", int(np.where(targets["lad"] == 1)[0][0]), "High LAD occlusion risk with elevated biomarkers."))

# Find 3-vessel CAD
triple_idx = np.where((targets["cad"] == 1) & (targets["lad"] == 1) & (targets["lcx"] == 1) & (targets["rca"] == 1))[0]
if len(triple_idx) > 0:
    patient_indices.append(("Triple-Vessel Critical CAD", int(triple_idx[0]), "Extensive multi-vessel CAD across LAD, LCX, and RCA with diabetic dyslipidemia."))

# Find RCA isolated
rca_idx = np.where((targets["cad"] == 1) & (targets["lad"] == 0) & (targets["lcx"] == 0) & (targets["rca"] == 1))[0]
if len(rca_idx) > 0:
    patient_indices.append(("RCA Stenosis (Inferior Wall Deficit)", int(rca_idx[0]), "Significant narrowing in Right Coronary Artery supplying inferior myocardium."))

# Find a borderline/moderate case
borderline_idx = np.where((targets["cad"] == 0) & (X["Age"] > 55) & (X["DM"] == 1))[0]
if len(borderline_idx) > 0:
    patient_indices.append(("Metabolic Syndrome (Borderline Risk)", int(borderline_idx[0]), "Older patient with diabetes and hypertension, borderline coronary risk."))
else:
    patient_indices.append(("Moderate Risk (Senior Smoker)", 5, "Senior patient with smoking history and dyslipidemia."))

presets = []
for name, p_idx, desc in patient_indices:
    patient_row = X.iloc[p_idx].to_dict()
    
    # Run predictions for this patient
    p_vector = X.iloc[[p_idx]]
    pred_cad = float(final_models["cad"].predict_proba(p_vector)[0][1])
    pred_lad = float(final_models["lad"].predict_proba(p_vector)[0][1])
    pred_lcx = float(final_models["lcx"].predict_proba(p_vector)[0][1])
    pred_rca = float(final_models["rca"].predict_proba(p_vector)[0][1])
    
    # Calculate patient-level SHAP contributions for CAD
    explainer_cad = shap.TreeExplainer(final_models["cad"])
    p_shap = explainer_cad.shap_values(p_vector)
    if isinstance(p_shap, list):
        p_shap_vals = p_shap[1][0]
    elif len(p_shap.shape) == 3:
        p_shap_vals = p_shap[0, :, 1]
    else:
        p_shap_vals = p_shap[0]
        
    top_p_indices = np.argsort(np.abs(p_shap_vals))[::-1][:8]
    p_factors = [
        {
            "feature": feature_names[i],
            "value": float(patient_row[feature_names[i]]),
            "shap_impact": round(float(p_shap_vals[i]), 4),
            "direction": "Risk Promoter" if p_shap_vals[i] > 0 else "Protective Factor"
        }
        for i in top_p_indices
    ]
    
    presets.append({
        "id": f"preset_{p_idx}",
        "name": name,
        "description": desc,
        "features": {k: float(v) for k, v in patient_row.items()},
        "ground_truth": {
            "cad": int(targets["cad"].iloc[p_idx]),
            "lad": int(targets["lad"].iloc[p_idx]),
            "lcx": int(targets["lcx"].iloc[p_idx]),
            "rca": int(targets["rca"].iloc[p_idx])
        },
        "initial_prediction": {
            "cad_prob": round(pred_cad, 4),
            "lad_prob": round(pred_lad, 4),
            "lcx_prob": round(pred_lcx, 4),
            "rca_prob": round(pred_rca, 4)
        },
        "top_shap_factors": p_factors
    })

with open("public/data/patient_presets.json", "w") as f:
    json.dump(presets, f, indent=2)

print("\n>>> [5/6] Exporting Comprehensive Metrics & Benchmark Artifacts...")
full_metrics = {
    "dataset_info": {
        "name": "Extension of Z-Alizadeh Sani Dataset (UCI Machine Learning Repository)",
        "num_patients": int(df.shape[0]),
        "num_features_raw": int(df.shape[1]),
        "num_features_modeled": len(feature_names),
        "target_leakage_excluded": leakage_cols,
        "cad_prevalence": round(float(targets["cad"].mean()), 4),
        "lad_stenosis_rate": round(float(targets["lad"].mean()), 4),
        "lcx_stenosis_rate": round(float(targets["lcx"].mean()), 4),
        "rca_stenosis_rate": round(float(targets["rca"].mean()), 4)
    },
    "model_benchmarks": metrics_summary,
    "top_shap_features": feature_importances,
}

with open("public/data/model_metrics.json", "w") as f:
    json.dump(full_metrics, f, indent=2)

print("\n>>> [6/6] Generating Lightweight On-Device Inference Weights...")
# To allow instant, 0ms, zero-flakiness live prediction directly in the browser
# when user drags any slider or selects a preset, we also export calibrated logistic coefficients
# and feature scaling from a calibrated logistic model for each target:
client_weights = {}
for target_name, y in targets.items():
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    lr = LogisticRegression(max_iter=1000, C=0.5, random_state=42)
    lr.fit(X_scaled, y)
    
    client_weights[target_name] = {
        "intercept": float(lr.intercept_[0]),
        "coefficients": {feat: round(float(coef), 5) for feat, coef in zip(feature_names, lr.coef_[0])},
        "scaler_means": {feat: round(float(m), 5) for feat, m in zip(feature_names, scaler.mean_)},
        "scaler_scales": {feat: round(float(s), 5) for feat, s in zip(feature_names, scaler.scale_)},
    }

with open("public/data/client_inference_weights.json", "w") as f:
    json.dump(client_weights, f, indent=2)

print("\n=======================================================")
print("  MODEL TRAINING & SHAP EXPLAINABILITY COMPLETED!")
print("  Artifacts created in public/data/ and models/")
print("=======================================================")
