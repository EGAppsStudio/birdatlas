# Kuş Atlası · Bird Atlas

eBird gözlemlerini kişisel bir haritaya dönüştüren uygulama. Android (Google Play) ve web (https://birdatlas.app).
Turns your eBird sightings into a personal map. Android app and web app.

- `www/` – uygulamanın kendisi (Android'de Capacitor ile, web'de birdatlas.app/app adresinde aynı dosyalar)
- `site/` – tanıtım sayfası (birdatlas.app) ve gizlilik politikası (birdatlas.app/privacy)
- `scripts/` – derleme yardımcıları (`npm run sync` Android, `npm run web` web sitesi)

## Web sitesi (Cloudflare Pages)
- Build command: `npm install --omit=dev && npm run web`
- Build output directory: `dist`
- Ortam değişkeni (isteğe bağlı, gizli): `EBIRD_API_KEY` → Türkçe tür adları derlemeye eklenir

## Android
Masaüstünde: `npm install` → `npm run sync` → `npm run open` (Android Studio).
İmza anahtarı (.jks), şifreler ve API anahtarları bu depoya asla eklenmez.

© 2026 EG Apps Studio · egapps.support@gmail.com
