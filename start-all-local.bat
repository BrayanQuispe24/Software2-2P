@echo off
chcp 65001 > nul
echo ======================================================================
echo    INICIANDO TODOS LOS SERVICIOS DE APEX FITNESS LOCALMENTE (SIN DOCKER)
echo ======================================================================
echo.

set ROOT_DIR=%~dp0

echo [1/10] Iniciando Microservicio IA (FastAPI / MediaPipe - Puerto 8000)...
start "IA-DeepLearning [8000]" cmd /k "cd /d "%ROOT_DIR%..\ia-deep-learning-sw2" && .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo [2/10] Iniciando MS-Auth (SSO / OIDC - Puerto 4000)...
start "MS-Auth [4000]" cmd /k "cd /d "%ROOT_DIR%ms-auth" && npm run start:dev"

echo Esperando a que el proveedor OIDC inicie...
timeout /t 3 /nobreak > nul

echo [3/10] Iniciando API Gateway (BFF - Puerto 3000)...
start "API-Gateway [3000]" cmd /k "cd /d "%ROOT_DIR%api-gateway" && npm run start:dev"

echo [4/10] Iniciando MS-Gimnasio (Spring Boot - Puerto 8082)...
start "MS-Gimnasio [8082]" cmd /k "cd /d "%ROOT_DIR%ms-gimnasio" && mvnw.cmd spring-boot:run"

echo [5/10] Iniciando MS-Entrenamiento (Laravel - Puerto 8083)...
start "MS-Entrenamiento [8083]" cmd /k "cd /d "%ROOT_DIR%ms-entrenamiento" && php artisan serve --port=8083"

echo [6/10] Iniciando MS-Inventario (Laravel - Puerto 8084)...
start "MS-Inventario [8084]" cmd /k "cd /d "%ROOT_DIR%ms-inventario" && php artisan serve --port=8084"

echo [7/10] Iniciando MFE-Gimnasio (Angular - Puerto 9105)...
start "MFE-Gimnasio [9105]" cmd /k "cd /d "%ROOT_DIR%mfe-gimnasio" && npm start"

echo [8/10] Iniciando MFE-Entrenamiento (Angular - Puerto 9102)...
start "MFE-Entrenamiento [9102]" cmd /k "cd /d "%ROOT_DIR%mfe-entrenamiento" && npm start"

echo [9/10] Iniciando MFE-Inventario (Angular - Puerto 9104)...
start "MFE-Inventario [9104]" cmd /k "cd /d "%ROOT_DIR%mfe-inventario" && npm start"

echo [10/10] Iniciando Shell Host (React 19 - Puerto 5173)...
start "Shell-Host [5173]" cmd /k "cd /d "%ROOT_DIR%shell" && npm run dev"

echo.
echo ======================================================================
echo    TODOS LOS SERVICIOS HAN SIDO LANZADOS EN VENTANAS INDEPENDIENTES
echo ======================================================================
echo Accede al sistema en: http://localhost:5173
echo.
pause
