@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  KUS ATLASI - Android Studio aciliyor
echo  (once dosyalar Android projesine kopyalaniyor)
echo.
call npm run sync
if errorlevel 1 (
  echo.
  echo  Bir hata oldu. Bu pencerenin ekran goruntusunu Claude a gonder.
  pause
  exit /b 1
)
call npm run open
echo.
echo  Android Studio aciliyor. Bu pencereyi kapatabilirsin.
timeout /t 5 >nul
