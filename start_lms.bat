@echo off
REM Start the built React app and Flask API together through Waitress.
setlocal

set "PROJECT_DIR=%~dp0"
set "VENV_ACTIVATE=%PROJECT_DIR%backend\venv\Scripts\activate.bat"

if not exist "%VENV_ACTIVATE%" (
    echo Python virtual environment not found: %VENV_ACTIVATE%
    echo Run setup.bat first, or create it with: python -m venv backend\venv
    exit /b 1
)

if not exist "%PROJECT_DIR%frontend\dist\index.html" (
    echo React production build not found. Building it now...
    pushd "%PROJECT_DIR%frontend"
    call npm run build
    if errorlevel 1 (
        popd
        exit /b 1
    )
    popd
)

call "%VENV_ACTIVATE%"

python -c "import waitress" >nul 2>&1
if errorlevel 1 (
    echo Waitress is not installed in backend\venv. Run: pip install -r backend\requirements.txt
    exit /b 1
)

REM Select the first active IPv4 address that is not a loopback/APIPA address.
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object {$_.IPAddress -notmatch '^(127\\.|169\\.254\\.)' -and $_.PrefixOrigin -ne 'WellKnown'} ^| Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LAN_IP=%%I"
if not defined LAN_IP set "LAN_IP=127.0.0.1"

set "LMS_URL=http://%LAN_IP%:5000"
REM Override backend\.env for this process so reset-email links use this
REM server's LAN address, not localhost on the recipient's device.
set "FRONTEND_URL=%LMS_URL%"
echo Starting Kinder Park LMS at %LMS_URL%
start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process '%LMS_URL%'"

pushd "%PROJECT_DIR%backend"
python run.py
set "EXIT_CODE=%ERRORLEVEL%"
popd
endlocal & exit /b %EXIT_CODE%
