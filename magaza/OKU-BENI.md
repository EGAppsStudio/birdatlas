# Play mağaza sayfası çevirileri

- `metinler/<klasör>/` → `title.txt` (≤30), `short_description.txt` (≤80), `full_description.txt` (≤4000)
- `gorseller/en/` → `telefon-01…08.jpg` (1440×2560) + `one-cikan.jpg` (1024×500); çeviri dillerinde İngilizce görseller kullanılır
- `ayarlar.json` → hangi Play dil kodu hangi klasörü kullanır (es-419 + es-ES → es, fr-FR + fr-CA → fr)
- Türkçe (tr-TR) ve İngilizce (en-US) sayfalara bu komut DOKUNMAZ; onlar Play Console'dan elle.

Yükleme (Windows, proje klasöründe):
1. `npm run magaza -- --dene`  → yalnız kontrol, hiçbir şey kaydedilmez
2. `npm run magaza`            → yükler; değişiklikler Play incelemesine gider

Anahtar: `Documents\kus-atlasi\` içindeki service account .json dosyası (ya da PLAY_ANAHTAR ortam değişkeni). Depoya ASLA girmez.
