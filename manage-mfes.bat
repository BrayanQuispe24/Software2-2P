@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

set CMD=%1
set TARGET=%2

if "%CMD%"=="" (
    echo ======================================================================
    echo        GESTIÓN INDEPENDIENTE DE MICROFRONTENDS (DOCKER)
    echo ======================================================================
    echo Uso:
    echo   manage-mfes.bat up ^<mfe-name^|all^>      - Levanta el/los microfrontends
    echo   manage-mfes.bat down ^<mfe-name^|all^>    - Detiene el/los microfrontends
    echo   manage-mfes.bat restart ^<mfe-name^>     - Reinicia un microfrontend
    echo.
    echo Opciones para ^<mfe-name^>:
    echo   shell, mfe-entrenamiento, mfe-gimnasio, mfe-inventario, all
    echo.
    echo Ejemplos:
    echo   manage-mfes.bat up mfe-entrenamiento
    echo   manage-mfes.bat restart shell
    echo ======================================================================
    exit /b 0
)

rem Verificar si existe la red fitness-network
docker network inspect apex-fitness-platform_fitness-network >nul 2>&1
if %errorlevel% neq 0 (
    echo Creando red Docker compartida: apex-fitness-platform_fitness-network...
    docker network create apex-fitness-platform_fitness-network
)

if "%CMD%"=="up" (
    if "%TARGET%"=="all" (
        echo Levantando Shell y todos los Microfrontends...
        cd shell && docker compose up -d && cd ..
        cd mfe-entrenamiento && docker compose up -d && cd ..
        cd mfe-gimnasio && docker compose up -d && cd ..
        cd mfe-inventario && docker compose up -d && cd ..
    ) else if not "%TARGET%"=="" (
        if exist "%TARGET%\docker-compose.yml" (
            echo Levantando microfrontend independiente: %TARGET%...
            cd %TARGET% && docker compose up -d && cd ..
        ) else (
            echo Error: Directorio o docker-compose.yml no encontrado para: %TARGET%
        )
    )
)

if "%CMD%"=="down" (
    if "%TARGET%"=="all" (
        echo Deteniendo Shell y todos los Microfrontends...
        cd shell && docker compose down && cd ..
        cd mfe-entrenamiento && docker compose down && cd ..
        cd mfe-gimnasio && docker compose down && cd ..
        cd mfe-inventario && docker compose down && cd ..
    ) else if not "%TARGET%"=="" (
        if exist "%TARGET%\docker-compose.yml" (
            echo Deteniendo microfrontend: %TARGET%...
            cd %TARGET% && docker compose down && cd ..
        )
    )
)

if "%CMD%"=="restart" (
    if not "%TARGET%"=="" (
        if exist "%TARGET%\docker-compose.yml" (
            echo Reiniciando microfrontend: %TARGET%...
            cd %TARGET% && docker compose restart && cd ..
        )
    )
)

echo.
echo Operación completada.
docker ps --filter "name=mfe-" --filter "name=shell" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

