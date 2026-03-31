@echo off
setlocal

set "NODE_EXE="

for %%I in (node.exe) do set "NODE_EXE=%%~$PATH:I"

if not defined NODE_EXE (
  for /d %%D in ("%USERPROFILE%\.trae\binaries\node\versions\*") do (
    if exist "%%D\node.exe" set "NODE_EXE=%%D\node.exe"
  )
)

if not defined NODE_EXE (
  if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
)

if not defined NODE_EXE (
  echo.
  echo [ERROR] 找不到 node.exe。
  echo 1) 请安装 Node.js ^(https://nodejs.org^) 并确保 node 在 PATH 里
  echo 2) 或者在 Trae 的 Node 已安装路径下：%USERPROFILE%\.trae\binaries\node\versions\...\node.exe
  echo.
  exit /b 1
)

endlocal & set "NODE_EXE=%NODE_EXE%"
exit /b 0

