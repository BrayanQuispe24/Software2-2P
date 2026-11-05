@echo off
chcp 65001 > nul
echo ======================================================================
echo    DETENIENDO TODOS LOS SERVICIOS DE APEX FITNESS LOCALES
echo ======================================================================
echo.

set PORTS=3000 4000 8000 8082 8083 8084 5173 9102 9104 9105

for %%p in (%PORTS%) do (
    echo Verificando puerto %%p...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%%p[ ]" 2^>nul') do (
        if not "%%a"=="0" (
            echo Terminando proceso PID: %%a en puerto %%p...
            taskkill /F /PID %%a >nul 2>&1
        )
    )
)

echo.
echo Todos los procesos en los puertos del ecosistema han sido detenidos.
pause
