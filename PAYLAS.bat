@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  KUS ATLASI - Kendi telefonunda dene (Dahili uygulama paylasimi)
echo  En son urettigin imzali AAB Play e yuklenir, kurulum linki panoya kopyalanir.
echo  (Once Android Studio: Build - Generate Signed Bundle)
echo.
call npm run paylas
echo.
pause
