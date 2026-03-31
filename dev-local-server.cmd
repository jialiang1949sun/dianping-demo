@echo off
setlocal

cd /d %~dp0
call .\dev-find-node.cmd
if errorlevel 1 exit /b 1

"%NODE_EXE%" .\node_modules\nodemon\bin\nodemon.js
