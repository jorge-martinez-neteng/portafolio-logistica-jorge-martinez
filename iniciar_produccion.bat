@echo off
setlocal
cd /d "%~dp0"

set "APP_ENV=production"
set "YGO_LOCAL_TEST_LOGIN_ENABLED=false"

if not exist ".venv\Scripts\python.exe" (
    echo No se encontro .venv. Consulte GUIA_DESPLIEGUE_SERVIDOR.md.
    exit /b 1
)

if not exist "portafolio-frontend-jorge-martinez\node_modules" (
    echo No se encontro node_modules. Ejecute npm ci en portafolio-frontend-jorge-martinez.
    exit /b 1
)

start "YGO Backend - FastAPI" /D "%~dp0" "%~dp0.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
start "YGO Frontend - React" /D "%~dp0portafolio-frontend-jorge-martinez" cmd /k "npm run build && npm run preview -- --host 0.0.0.0 --port 4173"

echo Backend: http://10.0.0.1:8000
echo Frontend: http://10.0.0.1:4173
