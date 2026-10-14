@echo off
echo ===================================================================
echo     CARDIONEXUS 3D - MULTIMODAL CARDIOVASCULAR AI SUITE
echo     Hackathon Track A: Cardiovascular Risk Visualization
echo ===================================================================
echo.
echo [1/3] Launching FastAPI Clinical AI Engine (port 8000)...
start "CardioNexus AI Backend" cmd /k "python backend/server.py"
timeout /t 2 /nobreak > nul

echo [2/3] Launching Vite Modern Frontend Workstation (port 5173)...
start "CardioNexus Web Client" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Launching browser interface...
start http://localhost:5173
echo.
echo ===================================================================
echo   CardioNexus 3D is running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000
echo   API Docs : http://127.0.0.1:8000/docs
echo ===================================================================
