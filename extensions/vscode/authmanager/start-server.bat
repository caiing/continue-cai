@echo off
cd /d "%~dp0"
echo ==========================================
echo   Continue Local Auth Server
echo ==========================================

echo Checking for processes on port 8443...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8443') do (
    if not "%%a"=="0" (
        echo Found process %%a using port 8443, killing it...
        taskkill /F /PID %%a >nul 2>&1
    )
)

node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    pause
    exit /b 1
)
echo Starting server...
node server.js
pause