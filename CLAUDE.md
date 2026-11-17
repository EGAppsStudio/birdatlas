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
www/data/          ornek-veri.csv (kurgusal örnek veri) · ebird-taxonomy.json + ebird-names-<dil>.json (KOMUTLAR 7 ile üretilir, depoda)
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
- Kısayol (kökte, çift tık): `KOMUTLAR.bat` – tek menü: 1 sync + Android Studio · 2 paylas (telefonda dene linki) · 3 mağaza METİNLERİ · 4 ikon + sync · 5 sync · 6 npm install · 7 tür adları (6 dil, eBird anahtarı ister) · 8 mağaza GÖRSELLERİ (ikon + ekran görüntüleri + öne çıkan) · 9 mağaza ekran görüntülerini çek.
- Komutlar (proje klasöründe): `npm install` · `npm run sync` (kütüphaneleri kopyalar + `cap sync android` + ad/sürüm/yazı sınırı) · `npm run open` (Android Studio) · `npm run web` (dist/ – web) · `npm run taksonomi -- <eBird anahtarı>` (Türkçe tür adları dosyası).
- **Play mağaza sayfası Claude'un işi:** metinleri ve görselleri Claude değiştirir (`magaza/metinler/<dil>/`, `magaza/gorseller/<klasör>/`, `magaza/gorseller/ikon-512.png`, diller `magaza/ayarlar.json`), Enes yalnız KOMUTLAR 3 (metinler) / 8 (görseller) çalıştırır. Play ikonu şeffaf olmamalı (beyaz zemin; şeffafsa Play kenarı renkle dolduruyor). Service account JSON proje DIŞINDA (`Documents\kus-atlasi\`), depoya asla girmez; izinleri: uygulama bilgisi görüntüle + mağaza varlığını yönet + test kanalları (üretim YOK).
- Mağaza ekran görüntüleri: KOMUTLAR 9 (`npm run ekranlar`, `scripts/ekranlar.mjs`) Enes'in bilgisayarında Edge ile web uygulamasını telefon boyutunda (412×800, ×3) örnek veriyle açar, tanıtım turu adımlarıyla 10 ekran × 6 dil çeker → `magaza/ham-ekranlar/<dil>/`; Roboto + Noto emoji ile Android görünümü. Enes push eder, Claude `python3 scripts/magaza-gorseller.py` ile başlık + telefon çerçevesi ekler → `magaza/gorseller/<dil>/telefon-01…08.jpg` + `one-cikan.jpg` (ES/PT/DE/FR o dilde; kaynak `magaza/kaynak/`) ve `magaza/instagram/ig_en_01…10.jpg`; başlıklar o dosyada 6 dilde. Enes KOMUTLAR 8.
- Yayın notları: `magaza/surum-notlari/<sürüm>.txt` (Play biçiminde, `<tr-TR>…</tr-TR>`; Play Console'da sürüm notları kutusuna olduğu gibi yapıştırılır).
- Kendi denemesi (Enes): Android Studio → Generate Signed Bundle → `npm run paylas` → en yeni .aab'yi Play "Dahili uygulama paylaşımı"na yükler, kurulum linkini yazar (panoya da kopyalar). Sürüm kodu artmaz, kullanıcıya gitmez. Ortak kod: `scripts/play-ortak.mjs`.

## Android ve web aynı kod
- Platform ayrımı `www/index.html` içindeki `NativeCap` ile: `const NativeCap = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ? window.Capacitor : null;`
  - Native: CapacitorHttp, Browser (dış linkler), Share + Filesystem (paylaşım kartı), Play değerlendirme isteği.
  - Web: fetch, normal link, `navigator.share` ya da indirme; service worker yalnızca `!NativeCap && https` iken; değerlendirme isteği yok.
- Yeni özellik eklerken ikisinde de çalıştığını düşün; yalnız birinde çalışacaksa `NativeCap` ile ayır.
- Tanıtım sayfası 6 dilde: kaynak `site/index.html` (TR+EN) + `scripts/site-diller.json` (ES/PT/DE/FR, anahtar = İngilizce metin); `npm run web` /tr/ /en/ /es/ /pt/ /de/ /fr/ sayfalarını üretir. `/` TR/EN arasında yerinde değişir, ES/PT/DE/FR tarayıcı dilinde kendi sayfasına yönlenir (`site_lang`). İngilizce metni değiştirince site-diller.json anahtarlarını da güncelle.
- Web derlemesi veri dosyalarına `?v=<sürüm>` ekler (`scripts/web-build.mjs`); `site/404.html` sayesinde eksik dosya yerine ana sayfa dönmez.
- localStorage aynı alan adında ortak: tanıtım sayfası ve uygulama dil seçimi için aynı `app_lang` anahtarını kullanır.

## Kurallar
- **Sürüm numarasını kullanıcı istemeden değiştirme.** Sürüm `package.json` → `version` (ör. 1.11.0) ve `www/index.html` → `APP_VERSION`; `npm run sync` versionCode'u maj*10000+min*100+yama olarak yazar (1.12 → 11200, 1.12.1 → 11201, 1.13 → 11300). Play'e her yüklemede versionCode büyümeli.
- **Sürüm düzeni (12 Kasım 2026):** kullanıcıya giden yayınlar 1.13, 1.14…; Enes'in kendi denemeleri ara sürüm (1.12.1, 1.12.2…), Play'in Dahili uygulama paylaşımı ya da dahili test kanalıyla. Ara sürümü yalnız Enes isteyince ver (package.json version + APP_VERSION).
- **Kullanıcıya giden (üretim) sürümlerde ikinci nokta YOK (Enes, 18 Kasım 2026):** 1.15, 1.16, 1.17… (1.14.1 bir istisnaydı). Play'e yeni paket gerekirse ve son numara Play'de kullanılmışsa Claude bir sonraki ana sürüme (1.15 → 11500) geçer ve Enes'e söyler; ara sürüm (1.15.1…) yalnız Enes'in kendi denemeleri için ve yalnız o isteyince.
- **Asla depoya girmeyecekler:** `.jks` / `.keystore`, `keystore.properties`, şifreler, `gizli.env`, `.env`, API anahtarları. `.gitignore` bunları engeller; GitHub Desktop'ta görünürlerse commit etme.
- Kullanıcı verisi cihazda kalır; sunucu, hesap, çerez, analiz yok. Yeni bir dış servis eklenirse gizlilik politikası (`site/privacy/index.html` = birdatlas.app/privacy + Play Data safety; Google Sites KULLANILMIYOR) güncellenmeli.
- Kişisel e-posta (enes…) hiçbir yerde görünmeyecek; yalnızca egapps.support@gmail.com.
- Kullanıcıyla Türkçe, kısa ve sade konuş (teknik olmayan biri gibi anlat). Büyük kararları önce sor.

## Kod notları (www/index.html)
- Çeviri: `LT('türkçe', 'english')` + `LANG`; sabit metinler `I18N_EXACT` sözlüğüyle MutationObserver üzerinden çevrilir; üretilen HTML'de `data-no-i18n` kullan.
- **6 dil (1.14):** TR (kaynak) · EN · ES · PT · DE · FR. ES/PT/DE/FR sözlükleri `www/i18n/<dil>.js` (`window.I18N_ES` …), anahtar = İngilizce metin; şablonlarda `${…}` → `{0}`, `{1}`. `LT` ek dilde `trans(en)` çağırır; `tx` TR→EN→ek dil zinciri.
  - Yeni/değişen İngilizce metinden sonra: `node scripts/ceviri.mjs kontrol` (eksikleri listeler, `-v` ayrıntı) → 4 dosyaya çeviri ekle.
  - `LANG === 'en'` yazma: İngilizce yolu için `LANG !== 'tr'`, Türkçe için `LANG === 'tr'`. Tarih/ay/gün adları `mNice()`, `wdNames()`, `loc()`; sıra sayısı `ordN()`.
  - Tür adları ek dillerde `data/ebird-names-<dil>.json` (`npm run taksonomi`, KOMUTLAR 7, Enes'in bilgisayarında BİR KEZ; dosyalar depoya commit edilir, Cloudflare indirmez – web-build depodaki dosyayı kullanır). Yoksa İngilizce ad. eBird API şartları ticari olmayan kullanım: ücretli/reklamlı sürüm düşünülürse adlar için açık kaynak (Wikidata CC0, `npm run ad-karsilastir` raporu `rapor/`) değerlendiriliyor.
  - Maviş yerel cevapları: ek dilde soru `toEnQuery` ile İngilizceye yaklaştırılır (`MAVIS_Q`). Gemini talimatı İngilizce + dil kuralı (`LTen`).
- Bayraklar emoji değil SVG (`flagSvg(code)`) – Windows bayrak emojisi göstermez.
- Paylaşım kartları canvas ile cihazda çizilir (`drawCard`, `renderShareUI`, `openShare({type: ...})`); türler: year, month, day, trip, species, location, milestone, chart, obs.
- Maviş: yerel cevaplar `localAssistant` / `smartAssist` / `birdCountAssist`; Gemini isteğe bağlı (`gemini-flash-latest`, model kapanırsa `resolveGeminiModel` ile otomatik yeni model, olmazsa yerel cevap).
- Kendi fotoğrafların IndexedDB'de (`kusatlasi-photos`); Wikipedia fotoğraf önbelleği localStorage'da; 429/5xx'te önbelleğe "yok" yazılmaz.
- Test: Playwright ile yerel HTTP sunucusu üzerinden (file:// canvas'ı bozar).
