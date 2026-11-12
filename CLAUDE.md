# Kuş Atlası · Bird Atlas – Claude için proje notları

eBird gözlemlerini kişisel bir haritaya dönüştüren uygulama. **Android (Google Play) ve web (https://birdatlas.app) aynı koddan çıkar.**
Geliştirici: EG Apps Studio · destek: egapps.support@gmail.com · Instagram: @birdatlas.app

## Nerede ne var
- GitHub deposu: **EGAppsStudio/birdatlas** (tek doğru kaynak; zip ile dosya taşınmaz)
- Kullanıcının bilgisayarındaki klon: `C:\Users\snowd\Documents\birdatlas` (Windows, GitHub Desktop ile)
- Eski klasör `Downloads\kus-atlasi` yalnızca yedek; orada çalışma, onu inceleme (eski kopya, zaten düzeltilmiş şeyleri içerir)
- Uygulama kimliği: `tr.kusatlasi.app` (capacitor.config.json; asla değişmez)
- İmza anahtarı (.jks) proje DIŞINDA: `C:\Users\snowd\Documents\kus-atlasi\kus-atlasi-anahtar.jks`

```
www/index.html     uygulamanın tamamı (tek dosya, ~4000 satır) – Android'de Capacitor, web'de /app/
www/data/          ornek-veri.csv (kurgusal örnek veri, depoda) · ebird-taxonomy.json (üretilir, depoda YOK)
www/img/           logo, PWA ikonları
www/manifest.webmanifest, www/sw.js   yalnızca web (PWA); Android'i etkilemez
www/lib/           npm install sonrası copy-libs ile dolar (depoda YOK)
site/              birdatlas.app tanıtım sayfası, privacy/, 404.html, _redirects, _headers
scripts/           copy-libs, android-ayarlari (ad + sürüm + yazı sınırı), taksonomi, ikon, web-build
android/           depoda YOK (.gitignore); kullanıcının bilgisayarında durur
```

## Çalışma akışı (GitHub Desktop + Android Studio)
- **Sohbetteki Claude değişiklik yapınca:** commit (Türkçe mesaj) → push. Kullanıcı GitHub Desktop'ta Fetch origin → Pull origin → `npm run sync` → Android Studio ▶.
- **Kullanıcı / Android Studio'daki Claude değişiklik yapınca:** GitHub Desktop'ta Commit to main → Push origin (yoksa sohbetteki Claude görmez).
- Web sitesi: Cloudflare Pages her push'ta kendisi derler (build: `npm install --omit=dev && npm run web`, çıktı: `dist`, ortam değişkeni `EBIRD_API_KEY`). 1-2 dakikada yayında.
- Kısayollar (kökte, çift tık): `ANDROID-STUDIO-AC.bat` (sync + Android Studio) · `PAYLAS.bat` (npm run paylas) · `MAGAZA.bat` (önce --dene, onay sorar, sonra yükler) · `IKON-VE-SYNC.bat` (npm run ikon + sync).
- Komutlar (proje klasöründe): `npm install` · `npm run sync` (kütüphaneleri kopyalar + `cap sync android` + ad/sürüm/yazı sınırı) · `npm run open` (Android Studio) · `npm run web` (dist/ – web) · `npm run taksonomi -- <eBird anahtarı>` (Türkçe tür adları dosyası).
- Play mağaza sayfası (çeviriler): metinler `magaza/metinler/<dil>/`, görseller `magaza/gorseller/`, diller `magaza/ayarlar.json`. Kullanıcı çalıştırır: `npm run magaza -- --dene` (yalnız kontrol) → `npm run magaza` (yükler). Service account JSON proje DIŞINDA (`Documents\kus-atlasi\`), depoya asla girmez; izinleri: uygulama bilgisi görüntüle + mağaza varlığını yönet + test kanalları (üretim YOK).
- Kendi denemesi (Enes): Android Studio → Generate Signed Bundle → `npm run paylas` → en yeni .aab'yi Play "Dahili uygulama paylaşımı"na yükler, kurulum linkini yazar (panoya da kopyalar). Sürüm kodu artmaz, kullanıcıya gitmez. Ortak kod: `scripts/play-ortak.mjs`.

## Android ve web aynı kod
- Platform ayrımı `www/index.html` içindeki `NativeCap` ile: `const NativeCap = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ? window.Capacitor : null;`
  - Native: CapacitorHttp, Browser (dış linkler), Share + Filesystem (paylaşım kartı), Play değerlendirme isteği.
  - Web: fetch, normal link, `navigator.share` ya da indirme; service worker yalnızca `!NativeCap && https` iken; değerlendirme isteği yok.
- Yeni özellik eklerken ikisinde de çalıştığını düşün; yalnız birinde çalışacaksa `NativeCap` ile ayır.
- Web derlemesi veri dosyalarına `?v=<sürüm>` ekler (`scripts/web-build.mjs`); `site/404.html` sayesinde eksik dosya yerine ana sayfa dönmez.
- localStorage aynı alan adında ortak: tanıtım sayfası ve uygulama dil seçimi için aynı `app_lang` anahtarını kullanır.

## Kurallar
- **Sürüm numarasını kullanıcı istemeden değiştirme.** Sürüm `package.json` → `version` (ör. 1.11.0) ve `www/index.html` → `APP_VERSION`; `npm run sync` versionCode'u maj*10000+min*100+yama olarak yazar (1.12 → 11200, 1.12.1 → 11201, 1.13 → 11300). Play'e her yüklemede versionCode büyümeli.
- **Sürüm düzeni (12 Kasım 2026):** kullanıcıya giden yayınlar 1.13, 1.14…; Enes'in kendi denemeleri ara sürüm (1.12.1, 1.12.2…), Play'in Dahili uygulama paylaşımı ya da dahili test kanalıyla. Ara sürümü yalnız Enes isteyince ver (package.json version + APP_VERSION).
- **Asla depoya girmeyecekler:** `.jks` / `.keystore`, `keystore.properties`, şifreler, `gizli.env`, `.env`, API anahtarları. `.gitignore` bunları engeller; GitHub Desktop'ta görünürlerse commit etme.
- Kullanıcı verisi cihazda kalır; sunucu, hesap, çerez, analiz yok. Yeni bir dış servis eklenirse gizlilik politikası (`site/privacy/index.html` + Google Sites + Play Data safety) güncellenmeli.
- Kişisel e-posta (enes…) hiçbir yerde görünmeyecek; yalnızca egapps.support@gmail.com.
- Kullanıcıyla Türkçe, kısa ve sade konuş (teknik olmayan biri gibi anlat). Büyük kararları önce sor.

## Kod notları (www/index.html)
- Çeviri: `LT('türkçe', 'english')` + `LANG`; sabit metinler `I18N_EXACT` sözlüğüyle MutationObserver üzerinden çevrilir; üretilen HTML'de `data-no-i18n` kullan.
- Bayraklar emoji değil SVG (`flagSvg(code)`) – Windows bayrak emojisi göstermez.
- Paylaşım kartları canvas ile cihazda çizilir (`drawCard`, `renderShareUI`, `openShare({type: ...})`); türler: year, month, day, trip, species, location, milestone, chart, obs.
- Maviş: yerel cevaplar `localAssistant` / `smartAssist` / `birdCountAssist`; Gemini isteğe bağlı (`gemini-flash-latest`, model kapanırsa `resolveGeminiModel` ile otomatik yeni model, olmazsa yerel cevap).
- Kendi fotoğrafların IndexedDB'de (`kusatlasi-photos`); Wikipedia fotoğraf önbelleği localStorage'da; 429/5xx'te önbelleğe "yok" yazılmaz.
- Test: Playwright ile yerel HTTP sunucusu üzerinden (file:// canvas'ı bozar).
