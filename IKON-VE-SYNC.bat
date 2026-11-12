@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  KUS ATLASI - Uygulama simgelerini yeniden uret + Android projesine aktar
echo  (Logo degisince ya da yeni surumden once)
echo.
call npm run ikon
if errorlevel 1 goto hata
call npm run sync
if errorlevel 1 goto hata
echo.
echo  Tamam. Simdi Android Studio da Build - Generate Signed Bundle yapabilirsin.
pause
exit /b 0
:hata
echo.
echo  Bir hata oldu. Bu pencerenin ekran goruntusunu Claude a gonder.
pause
exit /b 1
