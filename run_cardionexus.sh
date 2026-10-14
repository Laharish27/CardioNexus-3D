#!/usr/bin/env bash
# ===================================================================
#     CARDIONEXUS 3D - MULTIMODAL CARDIOVASCULAR AI SUITE
#     Hackathon Track A: Cardiovascular Risk Visualization
# ===================================================================

echo ">>> [1/3] Starting FastAPI Clinical AI Engine on port 8000..."
python3 backend/server.py &
BACKEND_PID=$!

echo ">>> [2/3] Starting Vite React Frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

sleep 3
echo ">>> [3/3] Opening browser..."
if which xdg-open > /dev/null; then
  xdg-open http://localhost:5173
elif which open > /dev/null; then
  open http://localhost:5173
fi

echo "==================================================================="
echo "  CardioNexus 3D is running!"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://127.0.0.1:8000"
echo "  API Docs : http://127.0.0.1:8000/docs"
echo "  Press Ctrl+C to stop both servers."
echo "==================================================================="

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT
wait
