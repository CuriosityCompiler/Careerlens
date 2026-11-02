@echo off
echo Starting CareerLens frontend and API...
pushd "%~dp0.."
npm run dev
set "exit_code=%errorlevel%"
popd
exit /b %exit_code%
