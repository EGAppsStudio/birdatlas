@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  KUS ATLASI - Play magaza sayfasi cevirileri
echo  1. adim: kontrol (hicbir sey kaydedilmez)
echo.
call npm run magaza -- --dene
if errorlevel 1 (
  echo.
  echo  Kontrolde hata cikti. Bu pencerenin ekran goruntusunu Claude a gonder.
  pause
  exit /b 1
)
echo.
set /p CEVAP=  Kontrol basarili. Simdi gercekten Play e yukleyeyim mi? (E/H): 
if /i not "%CEVAP%"=="E" (
  echo  Yukleme yapilmadi.
  pause
  exit /b 0
)
call npm run magaza
echo.
pause
