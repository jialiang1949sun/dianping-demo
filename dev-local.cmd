@echo off
setlocal

cd /d %~dp0

call .\dev-find-node.cmd
if errorlevel 1 exit /b 1

echo Starting backend on PORT from .env (default 3002)...
start "dianping-server" "%NODE_EXE%" .\node_modules\nodemon\bin\nodemon.js

echo Starting frontend on http://127.0.0.1:5173 ...
start "dianping-client" "%NODE_EXE%" --max-old-space-size=4096 .\node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5173 --strictPort

echo.
echo Open: http://127.0.0.1:5173/
echo Health: http://127.0.0.1:5173/api/health
echo.
pause
