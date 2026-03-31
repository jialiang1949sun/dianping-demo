@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "CMD=%*"

if defined CMD (
  if "!CMD:~0,1!"=="'" (
    set "CMD=!CMD:~1!"
    if "!CMD:~-1!"=="'" set "CMD=!CMD:~0,-1!"
  )
)

if defined CMD (
  if "!CMD:~0,1!"=="\"" (
    set "CMD=!CMD:~1!"
    if "!CMD:~-1!"=="\"" set "CMD=!CMD:~0,-1!"
  )
)

if not defined CMD exit /b 0

cmd.exe /d /s /c "!CMD!"

