@echo off
echo ====================================================
echo Starting CareerLens Development Environment
echo ====================================================

echo 1. Starting FastAPI Backend on http://localhost:8000
start "CareerLens Backend" cmd /k "cd /d "%~dp0..\backend" && python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload"

echo 2. Starting Vite Frontend on http://localhost:5173
start "CareerLens Frontend" cmd /k "cd /d "%~dp0..\frontend" && npm run dev"

echo.
echo CareerLens is launching!
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
pause
