@echo off
setlocal

cd /d %~dp0
call .\dev-find-node.cmd
if errorlevel 1 exit /b 1

"%NODE_EXE%" --max-old-space-size=4096 .\node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort
