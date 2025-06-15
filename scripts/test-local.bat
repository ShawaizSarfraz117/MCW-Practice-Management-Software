@echo off
REM Cross-platform test runner for Windows

REM Check if tsx is available
where tsx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    tsx scripts\test-local.ts %*
) else (
    REM Use npx as fallback
    npx tsx scripts\test-local.ts %*
)