import os
import io
import re
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import shap

# Optional PyMuPDF for robust PDF parsing
try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

try:
    import pypdf
except ImportError:
    pypdf = None

app = FastAPI(
    title="CardioNexus 3D - Clinical AI Engine",
    description="Cardiovascular Risk Visualization & Multi-Vessel Coronary Stenosis Prediction API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def resolve_path(rel_path: str) -> str:
    if os.path.exists(rel_path):
        return rel_path
    candidate = os.path.join(BASE_DIR, rel_path)
    if os.path.exists(candidate):
        return candidate
    return rel_path

# Load trained models
models = {}
for target in ["cad", "lad", "lcx", "rca"]:
    path = resolve_path(f"models/{target}_model.joblib")
    if os.path.exists(path):
        models[target] = joblib.load(path)
        print(f"Loaded champion model for {target.upper()} from {path}")
    else:
        print(f"Warning: {path} not found!")

# Load metadata
with open(resolve_path("public/data/model_metrics.json"), "r") as f:
    model_metrics = json.load(f)

with open(resolve_path("public/data/patient_presets.json"), "r") as f:
    patient_presets = json.load(f)

with open(resolve_path("public/data/feature_metadata.json"), "r") as f:
    feature_metadata = json.load(f)

feature_cols = list(feature_metadata.keys())

class PatientInput(BaseModel):
    features: Dict[str, float]

def build_feature_vector(input_features: Dict[str, float]) -> pd.DataFrame:
    row = {}
    for col in feature_cols:
        default_val = feature_metadata[col]["mean"]
        row[col] = float(input_features.get(col, default_val))
    return pd.DataFrame([row], columns=feature_cols)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CardioNexus 3D Clinical AI Engine",
        "version": "2.0.0",
        "dataset": "UCI Extension of Z-Alizadeh Sani (303 records, 55 features)",
        "models_loaded": list(models.keys()),
        "endpoints": ["/api/predict", "/api/metrics", "/api/presets", "/api/metadata", "/api/parse-report"]
    }

@app.get("/api/metrics")
def get_metrics():
    return model_metrics

@app.get("/api/presets")
def get_presets():
    return patient_presets

@app.get("/api/metadata")
def get_metadata():
    return feature_metadata

@app.post("/api/predict")
def predict_cardiac_risk(patient: PatientInput):
    if not patient.features or len(patient.features) == 0:
        raise HTTPException(status_code=400, detail="Patient feature payload cannot be empty.")

    df_feat = build_feature_vector(patient.features)
    
    predictions = {}
    for target in ["cad", "lad", "lcx", "rca"]:
        if target in models:
            model = models[target]
            prob = float(model.predict_proba(df_feat)[0][1])
            is_positive = bool(prob >= 0.50)
            
            # Uncertainty / Borderline awareness (e.g. 0.42 to 0.58)
            is_borderline = bool(0.42 <= prob <= 0.58)
            
            label = "CAD Positive (>=50% Stenosis in >=1 Vessel)" if target == "cad" else f"{target.upper()} Stenosis (>=50% Occlusion)"
            if not is_positive:
                label = "CAD Negative (<50% Stenosis)" if target == "cad" else f"{target.upper()} Patent (<50% Narrowing)"
            
            risk_tier = "Critical / High" if prob >= 0.70 else ("Moderate / Borderline" if prob >= 0.40 else "Low / Patent")

            predictions[target] = {
                "probability": round(prob, 4),
                "predicted_class": 1 if is_positive else 0,
                "label": label,
                "risk_tier": risk_tier,
                "threshold_applied": 0.50,
                "is_borderline": is_borderline,
                "uncertainty_note": "Probability is near the clinical classification boundary (50%). Close clinical correlation recommended." if is_borderline else None
            }

    # Compute patient-specific SHAP feature attributions
    top_shap_factors = []
    if "cad" in models:
        try:
            explainer = shap.TreeExplainer(models["cad"])
            raw_shap = explainer.shap_values(df_feat)
            if isinstance(raw_shap, list):
                s_vals = raw_shap[1][0]
            elif len(raw_shap.shape) == 3:
                s_vals = raw_shap[0, :, 1]
            else:
                s_vals = raw_shap[0]
                
            top_idx = np.argsort(np.abs(s_vals))[::-1][:10]
            for idx in top_idx:
                feat_name = feature_cols[idx]
                val = float(df_feat.iloc[0, idx])
                impact = float(s_vals[idx])
                top_shap_factors.append({
                    "feature": feat_name,
                    "value": round(val, 2),
                    "shap_impact": round(impact, 4),
                    "direction": "Risk Promoter" if impact > 0 else "Protective Factor",
                    "normal_range": f"{feature_metadata[feat_name]['min']} - {feature_metadata[feat_name]['max']}"
                })
        except Exception as e:
            print("Notice on real-time SHAP computation:", e)

    return {
        "status": "success",
        "predictions": predictions,
        "overall_cad_risk": predictions.get("cad", {}).get("probability", 0),
        "vessel_stenosis": {
            "LAD": predictions.get("lad", {}),
            "LCX": predictions.get("lcx", {}),
            "RCA": predictions.get("rca", {}),
        },
        "shap_attributions": top_shap_factors,
        "confirmed_patient_inputs": {k: float(v) for k, v in patient.features.items()},
        "disclaimer": "Clinical decision-support and educational research prototype only. Predictions are not a diagnosis and must not replace professional clinical assessment or formal diagnostic imaging."
    }

@app.post("/api/parse-report")
async def parse_medical_report(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_report"
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    extracted_text = ""
    lower_fn = filename.lower()

    # 1. Parse PDF
    if lower_fn.endswith(".pdf"):
        if fitz is not None:
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                extracted_text = "\n".join(page.get_text() for page in doc)
            except Exception as e:
                print("PyMuPDF parse error:", e)
        if not extracted_text and pypdf is not None:
            try:
                reader = pypdf.PdfReader(io.BytesIO(content))
                extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception as e:
                print("pypdf parse error:", e)
    # 2. Parse Plain Text / CSV
    elif lower_fn.endswith((".txt", ".csv")):
        try:
            extracted_text = content.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not decode text file: {e}")
    else:
        # Unsupported format notification
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Please upload a PDF medical report or a plain text clinical record."
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No readable text could be extracted from this document. If this is a scanned image PDF, please provide a digitally exported PDF or text summary."
        )

    # Clinical Entity Extraction Engine
    extracted_features = {}
    
    # Age
    m_age = re.search(r'\b(?:age|years?\s*old)[\s:]*([0-9]{2})\b', extracted_text, re.I)
    if m_age: extracted_features["Age"] = float(m_age.group(1))

    # Biological Sex
    if re.search(r'\b(?:male|man|gentleman)\b', extracted_text, re.I):
        extracted_features["Sex"] = 1.0
    elif re.search(r'\b(?:female|woman|lady)\b', extracted_text, re.I):
        extracted_features["Sex"] = 0.0

    # Systolic Blood Pressure
    m_bp = re.search(r'\b(?:bp|blood\s*pressure|sbp)[\s:]*([0-9]{2,3})(?:/[0-9]{2,3})?', extracted_text, re.I)
    if m_bp: extracted_features["BP"] = float(m_bp.group(1))

    # Pulse Rate
    m_pr = re.search(r'\b(?:pulse(?:\s*rate)?|heart\s*rate|pr|hr)[\s:]*([0-9]{2,3})\b', extracted_text, re.I)
    if m_pr: extracted_features["PR"] = float(m_pr.group(1))

    # Total Cholesterol / LDL / HDL / Triglycerides
    m_ldl = re.search(r'\bldl(?:-c)?[\s:]*([0-9]{2,3}(?:\.[0-9]+)?)\b', extracted_text, re.I)
    if m_ldl: extracted_features["LDL"] = float(m_ldl.group(1))

    m_hdl = re.search(r'\bhdl(?:-c)?[\s:]*([0-9]{2,3}(?:\.[0-9]+)?)\b', extracted_text, re.I)
    if m_hdl: extracted_features["HDL"] = float(m_hdl.group(1))

    m_tg = re.search(r'\b(?:triglycerides?|tg)[\s:]*([0-9]{2,3}(?:\.[0-9]+)?)\b', extracted_text, re.I)
    if m_tg: extracted_features["TG"] = float(m_tg.group(1))

    # Fasting Blood Sugar
    m_fbs = re.search(r'\b(?:fbs|fasting\s*(?:blood\s*)?sugar|fasting\s*glucose)[\s:]*([0-9]{2,3}(?:\.[0-9]+)?)\b', extracted_text, re.I)
    if m_fbs: extracted_features["FBS"] = float(m_fbs.group(1))

    # Creatinine
    m_cr = re.search(r'\b(?:creatinine|cr)[\s:]*([0-9]+(?:\.[0-9]+)?)\b', extracted_text, re.I)
    if m_cr: extracted_features["CR"] = float(m_cr.group(1))

    # Ejection Fraction
    m_ef = re.search(r'\b(?:ef(?:-tte)?|lvef|ejection\s*fraction)[\s:]*([0-9]{2}(?:\.[0-9]+)?)\s*%', extracted_text, re.I)
    if m_ef: extracted_features["EF-TTE"] = float(m_ef.group(1))

    # Regional Wall Motion Abnormality (RWMA)
    m_rwma = re.search(r'\b(?:rwma|wall\s*motion\s*abnormality)[\s:]*(?:grade\s*)?([0-4])\b', extracted_text, re.I)
    if m_rwma:
        extracted_features["Region RWMA"] = float(m_rwma.group(1))
    elif re.search(r'\b(?:hypokinesis|akinesis|dyskinesis)\b', extracted_text, re.I):
        extracted_features["Region RWMA"] = 1.0

    # Typical Angina / Chest Pain
    if re.search(r'\btypical(?:\s*substernal)?\s*chest\s*pain\b|\btypical\s*angina\b', extracted_text, re.I):
        extracted_features["Typical Chest Pain"] = 1.0

    # Diabetes Mellitus
    if re.search(r'\b(?:diabet(?:ic|es)|dm|type\s*2\s*diabetes)\b', extracted_text, re.I):
        extracted_features["DM"] = 1.0

    # Hypertension
    if re.search(r'\b(?:hypertension|htn|high\s*blood\s*pressure)\b', extracted_text, re.I):
        extracted_features["HTN"] = 1.0

    # Smoking
    if re.search(r'\b(?:active|current)?\s*(?:cigarette|tobacco)?\s*smok(?:ing|er)\b', extracted_text, re.I):
        extracted_features["Current Smoker"] = 1.0

    # ECG ST Elevation
    if re.search(r'\bst(?:-segment)?\s*elevation\b|\bstemi\b', extracted_text, re.I):
        extracted_features["St Elevation"] = 1.0

    # ECG T-Inversion
    if re.search(r'\bt(?:-wave)?\s*inversion\b', extracted_text, re.I):
        extracted_features["Tinversion"] = 1.0

    # LVH
    if re.search(r'\bleft\s*ventricular\s*hypertrophy\b|\blvh\b', extracted_text, re.I):
        extracted_features["LVH"] = 1.0

    # Supported key features list
    core_features = [
        "Age", "Sex", "BP", "PR", "LDL", "HDL", "TG", "FBS", "CR",
        "EF-TTE", "Region RWMA", "Typical Chest Pain", "DM", "HTN", "Current Smoker",
        "St Elevation", "Tinversion", "LVH"
    ]
    missing_fields = [f for f in core_features if f not in extracted_features]

    return {
        "status": "success",
        "file_name": filename,
        "features_extracted_count": len(extracted_features),
        "extracted_features": extracted_features,
        "missing_supported_fields": missing_fields,
        "raw_text_preview": extracted_text[:1200] + ("..." if len(extracted_text) > 1200 else ""),
        "disclaimer": "Automated clinical entity extraction is provided for clinician convenience. Review and confirm all values before generating model predictions."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
