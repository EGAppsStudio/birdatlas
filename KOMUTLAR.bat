@echo off
chcp 65001 >nul
cd /d "%~dp0"
:menu
cls
echo.
echo  ==============================================
echo   KUS ATLASI - Komutlar
echo  ==============================================
echo.
echo   1  Android Studio yu ac        (sync + Android Studio)
echo   2  Telefonda dene linki        (en yeni imzali AAB - Play dahili paylasim)
echo   3  Play magaza sayfasi         (once kontrol, sonra onay ister)
echo   4  Simgeler + sync             (logo degisince / yeni surumden once)
echo   5  Sadece sync                 (dosyalari Android projesine aktar)
echo   6  Paketleri kur / guncelle    (npm install)
echo.
echo   0  Cikis
echo.
set "SEC="
set /p SEC=  Numara yaz ve Enter a bas:
if "%SEC%"=="1" goto studio
if "%SEC%"=="2" goto paylas
if "%SEC%"=="3" goto magaza
if "%SEC%"=="4" goto ikon
if "%SEC%"=="5" goto sync
if "%SEC%"=="6" goto install
if "%SEC%"=="0" exit /b 0
goto menu

:studio
call npm run sync
if errorlevel 1 goto hata
call npm run open
echo.
echo  Android Studio aciliyor.
goto bitti

:paylas
echo.
echo  (Once Android Studio: Build - Generate Signed Bundle yapmis olmalisin)
echo.
call npm run paylas
goto bitti

:magaza
echo.
echo  1. adim: kontrol (hicbir sey kaydedilmez)
echo.
call npm run magaza -- --dene
if errorlevel 1 goto hata
echo.
set "CEVAP="
set /p CEVAP=  Kontrol basarili. Simdi gercekten Play e yukleyeyim mi? (E/H):
if /i not "%CEVAP%"=="E" (
  echo  Yukleme yapilmadi.
  goto bitti
)
call npm run magaza
goto bitti

:ikon
call npm run ikon
if errorlevel 1 goto hata
call npm run sync
if errorlevel 1 goto hata
echo.
echo  Tamam. Simdi Android Studio da Build - Generate Signed Bundle yapabilirsin.
goto bitti

:sync
call npm run sync
if errorlevel 1 goto hata
echo.
echo  Tamam. Android Studio aciksa yesil ucgen ile telefona kurabilirsin.
goto bitti

:install
call npm install
if errorlevel 1 goto hata
goto bitti

:hata
echo.
echo  Bir hata oldu. Bu pencerenin ekran goruntusunu Claude a gonder.

:bitti
echo.
pause
goto menu
