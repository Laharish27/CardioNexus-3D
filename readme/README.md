# 🫀 CardioNexus 3D
### *Precision Cardiovascular Risk Stratification & 3D Hemodynamic Visualization Suite*

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_2.0-000000?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3%2B-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0%2B-EB5424?style=flat&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-TreeExplainer-8A2BE2?style=flat)](https://shap.readthedocs.io/)
[![Architecture](https://img.shields.io/badge/Architecture-Zero_Target_Leakage-059669?style=flat)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](LICENSE)

---

## 🌐 Live Web Demo

> 🚀 **Live Interactive Application:** **[Launch CardioNexus 3D Web Station](https://cardionexus-3d.vercel.app)**  
>
> 💡 **For Reviewers & Clinicians:** No installation or local setup required. The live application runs directly in any modern desktop or mobile browser with WebGL 2.0. *(See Cloud Deployment section below to deploy your own instance in 1 minute)*

---

## 📖 Overview

**CardioNexus 3D** is a multimodal clinical decision-support and spatial visualization platform engineered to bridge the communication gap between non-invasive cardiac diagnostic markers and physical coronary artery disease (CAD).

Conventional clinical risk calculators output abstract risk percentages (e.g., *"18% 10-year Framingham score"*) that fail to convey **where** physical stenosis is developing or **which** specific physiological parameters drive that occlusion. Conversely, invasive coronary catheterization (Cath) carries procedural risk and high cost.

CardioNexus 3D ingests non-invasive patient biomarkers (demographics, vital signs, 12-lead ECG findings, echocardiographic regional wall motion abnormalities, and serum biochemistry), runs a multi-target machine learning ensemble with **zero target leakage**, and renders the results on an **interactive 3D WebGL anatomical cardiac twin** with game-theoretic **TreeSHAP explainability** and **ACC/AHA clinical target benchmarking**.

---

## 🎯 Clinical Scope & Multi-Vessel Targets

Trained and cross-validated on ground-truth catheterization records from the **UCI Z-Alizadeh Sani Cardiovascular Cohort (303 patients, 55 attributes)**, CardioNexus 3D independently predicts:

| Target | Anatomical Artery | Myocardial Territory | Clinical Significance |
| :--- | :--- | :--- | :--- |
| **Overall CAD** | Coronary Tree ($\ge 1$ vessel) | Global Myocardium | $\ge 50\%$ luminal diameter stenosis in $\ge 1$ major epicardial coronary artery |
| **LAD Stenosis** | Left Anterior Descending | Anterior Wall & Septum | Critical vessel supplying ~50% of left ventricular myocardium ("the widow-maker") |
| **LCX Stenosis** | Left Circumflex Artery | Lateral & Posterior LV | Supplies lateral free wall; frequently under-detected on standard 12-lead ECG |
| **RCA Stenosis** | Right Coronary Artery | Inferior Wall & RV | Perfuses the AV node, right ventricle, and inferior diaphragmatic myocardium |

---

## 🌟 Key Features

### 1. Dual Ingestion Modalities
- **Structured Manual Entry:** Clean clinical form organized into Demographics, Clinical History, ECG/Echo findings, and Laboratory panels with real-time range validation.
- **Automated Medical Report PDF Parser:** Built-in in-memory regex extractor that extracts clinical biomarkers from electronic lab summaries without sending sensitive patient health information (PHI) over external third-party APIs.
- **Cohort Dataset Explorer:** Instant access to 303 real-world patient records with ground-truth catheterization outcomes (`CAD` vs `Normal`) for direct clinical benchmarking.

### 2. Interactive 3D Cardiac Anatomical Twin
- **WebGL 2.0 / Three.js Engine:** 60 FPS real-time rendering on standard laptops without requiring a discrete GPU.
- **Biomechanical Heartbeat:** Physiologically accurate wringing and torsional apical contraction synchronized to patient heart rate (BPM).
- **Procedural Arterial Twin:** Complete coronary anatomy featuring main trunks and bifurcations:
  - **LAD:** Diagonal 1 (D1) and Diagonal 2 (D2)
  - **LCX:** Obtuse Marginal (OM)
  - **RCA:** Acute Marginal (AM) and Posterior Descending Artery (PDA)
- **Physical Atheroma Plaque Cuffs:** Visualizes localized lipid core accumulation and lumen reduction.
- **Dynamic Particle Hemodynamics:** Real-time animated blood flow particles that decelerate in stenotic zones to illustrate downstream hypoperfusion.
- **4-Chamber Cavity Slicer:** Real-time interior anatomical cross-section revealing the Left Ventricle, Right Ventricle, Left Atrium, and Right Atrium.

### 3. Rigorous Machine Learning & Zero Target Leakage
- Independent multi-target classification rather than assuming vessel risks derive from an arbitrary average.
- 5-Fold Stratified Cross-Validation on all models.
- **Strict Zero Target-Leakage Architecture:** Diagnostic angiography labels (`Cath`, `LAD`, `LCX`, `RCA`) are quarantined from input matrices.

### 4. Game-Theoretic Explainability (TreeSHAP)
- Decomposes predictions into positive **Risk Promoters** (e.g., Regional Wall Motion Abnormalities, Age, Fasting Blood Sugar) and negative **Protective Factors** (e.g., preserved Ejection Fraction, absence of T-wave inversion).
- Interactive **"What-If" Simulation** to explore how modifying blood pressure or lipids alters vessel risk in real time.

### 5. ACC/AHA Guideline Target Comparison
- Every key biomarker displays:
  - **Observed Patient Value** (e.g., Systolic BP: `145 mmHg`, FBS: `135 mg/dL`, Chol: `240 mg/dL`)
  - **Recommended Clinical Target** (e.g., `< 120 mmHg`, `< 100 mg/dL`, `< 200 mg/dL`)
  - **Guideline Concordance Badge:** Optimal (Green), Borderline / Pre-Disease (Amber), Elevated / At Risk (Red)

### 6. Exportable Clinical Report
- ACC/AHA-styled printable medical report with patient summary, multi-vessel stenosis breakdown, SHAP explanations, recommended targets, and physician sign-off block.

---

## 🔬 Clinical Targets vs Observed Values

CardioNexus 3D compares patient values against established international cardiology guidelines:

| Biomarker | Observed Format | Recommended Clinical Target | Sponsoring Guideline |
| :--- | :---: | :---: | :--- |
| **Systolic BP** | `mmHg` | `< 120 mmHg` | ACC/AHA 2017 Hypertension Guidelines |
| **Fasting Blood Sugar (FBS)** | `mg/dL` | `< 100 mg/dL` | ADA 2024 Standards of Medical Care in Diabetes |
| **Total Cholesterol** | `mg/dL` | `< 200 mg/dL` | ACC/AHA 2019 Primary Prevention Guidelines |
| **Triglycerides (TG)** | `mg/dL` | `< 150 mg/dL` | NCEP ATP III Guidelines |
| **Ejection Fraction (EF-TTE)**| `%` | `≥ 50%` | ASE / EACVI Chamber Quantification |
| **Resting Pulse Rate** | `BPM` | `60 – 100 BPM` | AHA Clinical Guidelines |
| **Regional Wall Motion (RWMA)**| Score | `0` (Normal wall excursion) | ASE 17-Segment LV Model |

---

## 📊 Model Evaluation & Benchmarks

All models were evaluated using **5-Fold Stratified Cross-Validation** with isolated training and test preprocessing pipelines:

| Target Model | Champion Algorithm | ROC-AUC | Accuracy | Precision | Recall | F1-Score |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Overall CAD** | **Gradient Boosting** | **0.9065** | **85.5%** | **88.2%** | **91.7%** | **0.899** |
| Overall CAD | Random Forest | 0.8872 | 82.8% | 85.9% | 90.3% | 0.880 |
| Overall CAD | XGBoost | 0.8710 | 81.8% | 84.8% | 90.3% | 0.875 |
| **LAD Stenosis** | **Random Forest** | **0.8553** | **79.5%** | **80.3%** | **82.1%** | **0.812** |
| LAD Stenosis | Gradient Boosting | 0.8320 | 76.2% | 77.8% | 79.1% | 0.784 |
| **LCX Stenosis** | **Gradient Boosting** | **0.7070** | **69.6%** | **59.3%** | **40.0%** | **0.478** |
| **RCA Stenosis** | **Gradient Boosting** | **0.6742** | **66.7%** | **52.2%** | **37.5%** | **0.436** |

> **Zero Target-Leakage Architecture Guarantee:**  
> Catheterization outcomes (`Cath`) and target vessel stenosis labels (`LAD`, `LCX`, `RCA`) were strictly removed prior to feature matrix construction. Predictions rely exclusively on non-invasive pre-catheterization clinical data.

---

## 🛠 System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT WORKSTATION (BROWSER)                    │
│  React 19 • TypeScript • Tailwind CSS v4 • Three.js WebGL 2.0 Engine   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │   Overview   │ │  Assessment  │ │ 3D Explorer  │ │Explainability │ │
│  │  Dashboard   │ │ Manual / PDF │ │ Arterial Twin│ │(TreeSHAP/Sim) │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FASTAPI CLINICAL AI ENGINE (PORT 8000)               │
│  Endpoints: /api/predict • /api/metrics • /api/presets • /api/parse-pdf│
│  ┌─────────────────┐ ┌──────────────────┐ ┌────────────────────────┐   │
│  │ 4 Champion ML   │ │ TreeSHAP Engine  │ │ In-Memory PDF Parser   │   │
│  │ Models (Joblib) │ │ Exact Shapley    │ │ PyMuPDF Clinical Regex │   │
│  └─────────────────┘ └──────────────────┘ └────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             UCI Z-ALIZADEH SANI CLINICAL DATASET (303 PATIENTS)         │
│  55 Features: Vitals, ECG Leads, Echo Wall Motion, Serum Biomarkers    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Prerequisites & Environment Requirements

Before running the project, ensure you have the following installed on your system:

| Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` | `v20.x` or `v22.x` | `node -v` |
| **npm** | `v9.0.0` | `v10.x` | `npm -v` |
| **Python** | `v3.10.0` | `v3.10` – `v3.14` | `python --version` |
| **Browser** | Chrome 110+, Edge 110+, Firefox 115+, Safari 16+ (WebGL 2.0 enabled) |

---

## 🚀 Step-by-Step Installation & Setup

Open your terminal or command prompt and navigate to the project directory:

```bash
cd CardioNexus-3D
```

### 1. Backend Setup (Python)

#### Windows (PowerShell / Command Prompt):
```powershell
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\activate

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### macOS / Linux (Terminal):
```bash
# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 2. Frontend Setup (Node.js)

In the same root directory (`CardioNexus-3D`):

```bash
# Install frontend packages
npm install
```

---

## 🏃 Instructions for Running Locally (On Your Machine)

> ℹ️ **Note on Localhost URLs:**  
> The `http://localhost:5173` (Frontend) and `http://127.0.0.1:8000` (Backend) URLs below are **local workstation addresses** generated when executing the code on your own machine.  
> If you want to evaluate the live application without running it locally, visit our **[Live Web Application](https://cardionexus-3d.vercel.app)** or deploy to Vercel using Method 4 below.

### Method 1: One-Click Execution (Easiest)

#### Windows:
Double-click the included batch script or run it from CMD/PowerShell:
```cmd
run_cardionexus.bat
```
*This launches the FastAPI AI server on `http://127.0.0.1:8000`, the Vite React application on `http://localhost:5173`, and opens your default browser automatically.*

#### macOS / Linux:
Make the launcher executable and run:
```bash
chmod +x run_cardionexus.sh
./run_cardionexus.sh
```

---

### Method 2: Manual Terminal Execution (Developer Mode)

For granular logging and development, run each service in its own terminal:

#### Terminal 1 — Start the AI Engine (FastAPI):
```bash
# Windows
.\venv\Scripts\activate
python backend/server.py

# macOS / Linux
source venv/bin/activate
python3 backend/server.py
```
**Expected Console Output:**
```text
Loaded champion model for CAD from models/cad_model.joblib
Loaded champion model for LAD from models/lad_model.joblib
Loaded champion model for LCX from models/lcx_model.joblib
Loaded champion model for RCA from models/rca_model.joblib
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```
- **Root Health Check:** `http://127.0.0.1:8000/`
- **Interactive Swagger API Docs:** `http://127.0.0.1:8000/docs`

#### Terminal 2 — Start the Modern Frontend (Vite):
```bash
npm run dev
```
**Expected Console Output:**
```text
  VITE v8.3.4  ready in 210 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open **`http://localhost:5173`** in your browser.

---

### Method 3: Production Build

To test the compiled and minified production build:

```bash
npm run build
npm run preview
```

---

### Method 4: 1-Click Cloud Deployment (Vercel)

CardioNexus 3D can be hosted in the cloud for free with zero server maintenance:
1. Push this repository to your GitHub account (`git push origin main`).
2. Sign in to **[Vercel](https://vercel.com)** and click **"Add New Project"** $\rightarrow$ **"Import"** your repository.
3. Vercel automatically detects the Vite configuration:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **"Deploy"**. Your live public application will be online in under 60 seconds with an instant public URL!

---

## 🔧 Troubleshooting & FAQs

### 1. Port 8000 is already in use (`WinError 10048` / `EADDRINUSE`)
If a previous Python process is occupying port 8000:
- **Windows (PowerShell):**
  ```powershell
  Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```
- **macOS / Linux:**
  ```bash
  kill -9 $(lsof -t -i:8000)
  ```

### 2. Port 5173 is already in use
Vite will automatically offer to bind to the next available port (e.g., `http://localhost:5174`). You can also specify a custom port:
```bash
npm run dev -- --port 3000
```

### 3. Client-Side Fallback Engine
If the Python backend is paused or not yet started, CardioNexus 3D includes a **built-in browser-side inference fallback**. It automatically executes calibrated multi-target approximations directly in WebAssembly/TypeScript so the 3D twin and assessment workflows remain fully interactive at all times.

### 4. 3D Heart Not Displaying / Black Screen
Ensure hardware acceleration is enabled in your browser:
- **Chrome / Edge:** Settings $\rightarrow$ System $\rightarrow$ Enable "Use graphics acceleration when available".
- Ensure your browser supports WebGL 2.0 (standard on all modern browsers).

---

## 📁 Repository Directory Structure

```text
CardioNexus-3D/
├── README.md                 # Primary project documentation
├── package.json              # Frontend dependencies and scripts
├── requirements.txt          # Python backend dependencies
├── index.html                # HTML5 entry point & clinical metadata
├── vite.config.ts            # Vite bundler configuration
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Cloud SPA deployment routing configuration
├── run_cardionexus.bat       # Windows 1-click execution script
├── run_cardionexus.sh        # macOS/Linux 1-click execution script
├── readme/
│   └── README.md             # Project documentation mirror
├── backend/
│   ├── server.py             # FastAPI REST server & clinical inference engine
│   └── requirements.txt      # Backend dependency manifest
├── ml_pipeline/
│   └── train_models.py       # 5-Fold Stratified CV trainer script
├── models/
│   ├── cad_model.joblib      # Champion CAD model (Gradient Boosting)
│   ├── lad_model.joblib      # Champion LAD model (Random Forest)
│   ├── lcx_model.joblib      # Champion LCX model (Gradient Boosting)
│   └── rca_model.joblib      # Champion RCA model (Gradient Boosting)
├── public/
│   ├── data/                 # Cohort datasets, presets, and model metrics JSON
│   └── models/               # 3D Anatomical Meshes (BodyParts3D & Heart GLB)
├── src/
│   ├── App.tsx               # Root application component
│   ├── main.tsx              # React DOM render entry
│   ├── components/           # UI, 3D Canvas, SHAP, and ECG components
│   │   ├── layout/           # Sidebar, TopNav, DisclaimerBanner
│   │   └── pages/            # 7 Application sections
│   ├── types/                # Strict TypeScript clinical type definitions
│   └── utils/                # Client-side fallback inference engine
└── data/
    └── z_alizadeh_sani_raw.xlsx # UCI Z-Alizadeh Sani raw dataset
```

---

## ⚖️ Clinical Safety & Regulatory Notice

> **IMPORTANT CLINICAL NOTICE:**  
> **CardioNexus 3D** is developed strictly as an educational and clinical research decision-support prototype. It is **not** cleared by the U.S. FDA, European CE, or any health regulatory agency as Medical Device Software (SaMD).  
> Predictions generated by this system are mathematical probabilities derived from an observational cohort and **must never** be used as a standalone autonomous diagnosis, emergency triage filter, or replacement for qualified clinical evaluation, echocardiography, or invasive coronary angiography (Cath).

---

## 📄 License & Attribution

- **License:** Distributed under the MIT License.
- **Dataset:** UCI Machine Learning Repository — *Z-Alizadeh Sani Cardiovascular Cohort*.
- **3D Meshes:** Anatomical structures adapted from DBCLS BodyParts3D (Japan) under CC-BY-SA 2.1.
