# Play mağaza sayfası çevirileri

- `metinler/<klasör>/` → `title.txt` (≤30), `short_description.txt` (≤80), `full_description.txt` (≤4000)
- `gorseller/en/` → `telefon-01…08.jpg` (1440×2560) + `one-cikan.jpg` (1024×500); çeviri dillerinde İngilizce görseller kullanılır
- `ayarlar.json` → hangi Play dil kodu hangi klasörü kullanır (es-419 + es-ES → es, fr-FR + fr-CA → fr)
- Türkçe (tr-TR) ve İngilizce (en-US) metinleri de buradan gider (`metinler/tr`, `metinler/en`); bu iki dilin görsellerine dokunulmaz (Play'deki kendi TR/EN görselleri kalır).
- `ayarlar.json` → `iletisim`: Play'deki Mağaza ayarları → İletişim bilgileri (Web sitesi + e-posta) da aynı komutla güncellenir.
- Play Console'da metni elle değiştirirsen buradaki dosyayı da değiştir; yoksa bir sonraki `npm run magaza` buradakini yazar.

Yükleme (Windows): kökteki `KOMUTLAR.bat`
- **3** → METİNLER: tüm diller (TR, EN dahil) + Web sitesi/e-posta  (`npm run magaza -- --metin`)
- **8** → GÖRSELLER: uygulama ikonu (`gorseller/ikon-512.png`, tüm dillerde) + ekran görüntüleri + öne çıkan görsel (`npm run magaza -- --gorsel`)
- Görsel klasörü: `gorseller/<klasör>/telefon-01…08.jpg` + `one-cikan.jpg`; `ayarlar.json`'da dilin `gorsel` klasörü yoksa (ör. `gorseller/tr`) o dilin ekran görüntülerine dokunulmaz.
- Önce yalnız kontrol istenirse komutun sonuna `--dene` eklenir.

Anahtar: `Documents\kus-atlasi\` içindeki service account .json dosyası (ya da PLAY_ANAHTAR ortam değişkeni). Depoya ASLA girmez.
