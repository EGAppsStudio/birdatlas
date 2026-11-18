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
echo   GELISTIRME
echo   1  Android Studio yu ac        (sync + Android Studio)
echo   2  Sadece sync                 (dosyalari Android projesine aktar)
echo   3  Telefonda dene linki        (en yeni imzali AAB - Play dahili paylasim; kullaniciya gitmez)
echo.
echo   YAYIN
echo   4  Play e YAYINLA              (uretim: en yeni imzali AAB + 6 dilde surum notlari; Claude hazirlar)
echo.
echo   MAGAZA SAYFASI
echo   5  Magaza METINLERI yukle      (6 dil + video linkleri + web sitesi/e-posta)
echo   6  Magaza GORSELLERI yukle     (ikon + ekran goruntuleri + one cikan gorsel)
echo   7  Ekran goruntuleri + tum gorseller uret (magaza, one cikan, site, Instagram; sonra Commit + Push)
echo   8  Tanitim videosu             (kayit + montaj + muzik; yatay ve dikey mp4)
echo   9  Video yalniz montaj         (kayit yok; baslik/muzik degisince)
echo.
echo   BAKIM
echo  10  Paketleri kur / guncelle    (npm install)
echo  11  Simgeler + sync             (logo degisince)
echo  12  Tur adlarini indir          (6 dilde kus adlari; eBird API anahtari ister)
echo.
echo   0  Cikis
echo.
set "SEC="
set /p SEC=  Numara yaz ve Enter a bas:
if "%SEC%"=="1" goto studio
if "%SEC%"=="2" goto sync
if "%SEC%"=="3" goto paylas
if "%SEC%"=="4" goto yayinla
if "%SEC%"=="5" goto magaza
if "%SEC%"=="6" goto gorsel
if "%SEC%"=="7" goto ekranlar
if "%SEC%"=="8" goto video
if "%SEC%"=="9" goto montaj
if "%SEC%"=="10" goto install
if "%SEC%"=="11" goto ikon
if "%SEC%"=="12" goto taksonomi
if "%SEC%"=="0" exit /b 0
goto menu

:studio
call npm run sync
if errorlevel 1 goto hata
call npm run open
echo.
echo  Android Studio aciliyor.
goto bitti

:yayinla
echo.
echo  (Once: Android Studio - Build - Generate Signed Bundle. Surum notlarini Claude hazirlar.)
echo.
call npm run yayinla
if errorlevel 1 goto hata
goto bitti

:paylas
echo.
echo  (Once Android Studio: Build - Generate Signed Bundle yapmis olmalisin)
echo.
call npm run paylas
goto bitti

:magaza
echo.
call npm run magaza -- --metin
if errorlevel 1 goto hata
goto bitti

:gorsel
echo.
call npm run magaza -- --gorsel
if errorlevel 1 goto hata
goto bitti

:ekranlar
echo.
echo  Birkac dakika surer. Acilan Edge penceresinde adim adim izleyebilirsin; pencereye tiklama.
echo  Bir sorun olursa bu siyah pencerede Ctrl+C ile durdur.
call npm run ekranlar
if errorlevel 1 goto hata
call npm run gorseller
if errorlevel 1 goto hata
echo.
echo  Tamam. GitHub Desktop: Commit + Push. Magazaya yuklemek icin 6.
goto bitti

:montaj
echo.
call npm run video -- montaj
if errorlevel 1 goto hata
echo.
echo  Tamam. Video: magaza\video klasorunde. GitHub Desktop: Commit + Push.
goto bitti

:video
echo.
echo  Muzik: magaza\video\muzik klasorundeki ilk ses dosyasi. 5-10 dakika surer.
echo  Acilan Edge penceresinde adim adim izleyebilirsin; pencereye tiklama. Durdurmak icin Ctrl+C.
call npm run video
if errorlevel 1 goto hata
echo.
echo  Tamam. Video: magaza\video klasorunde. GitHub Desktop: Commit + Push.
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

:taksonomi
echo.
echo  eBird API anahtarin (Ayarlar'a girdigin kisa kod). Yalnizca bu indirme icin kullanilir, hicbir yere kaydedilmez.
set "KEY="
set /p KEY=  Anahtar: 
if "%KEY%"=="" goto bitti
call npm run taksonomi -- %KEY%
if errorlevel 1 goto hata
echo.
echo  Tamam. Simdi 5 (sync) ya da 1 (Android Studio).
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
