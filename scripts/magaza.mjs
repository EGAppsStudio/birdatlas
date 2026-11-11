// Play mağaza sayfası metinlerini ve görsellerini Google Play'e yükler (Google Play Developer API).
// Kullanım (proje klasöründe):
//   npm run magaza -- --dene        → yalnızca kontrol eder, hiçbir şeyi değiştirmez
//   npm run magaza                  → yükler ve kaydeder (Play incelemesine gider)
//   npm run magaza -- --dil=de-DE   → yalnızca bir dil
//   npm run magaza -- --gorselsiz   → yalnızca metinler
// Anahtar (service account JSON) proje DIŞINDA durur, depoya asla girmez. Aranan yerler:
//   1) PLAY_ANAHTAR ortam değişkeni (dosya yolu)
//   2) Belgeler\kus-atlasi\ klasöründeki "service_account" türündeki .json dosyası
// Ek paket gerekmez (yalnız Node.js).

import fs from 'node:fs';
import path from 'node:path';
import { KOK, hata, anahtarBul, jetonAl, jetonKoy, istek } from './play-ortak.mjs';

const MAGAZA = path.join(KOK, 'magaza');
const args = process.argv.slice(2);
const DENE = args.includes('--dene');
const GORSELSIZ = args.includes('--gorselsiz');
const TEK_DIL = (args.find(a => a.startsWith('--dil=')) || '').slice(6) || null;

// ---------- Hazırlık: metinleri ve görselleri oku, sınırları kontrol et ----------
function hazirla(ayar) {
  const isler = [];
  const sorunlar = [];
  for (const [dil, a] of Object.entries(ayar.diller)) {
    if (TEK_DIL && dil !== TEK_DIL) continue;
    const mk = path.join(MAGAZA, 'metinler', a.metin);
    const oku = (f) => { try { return fs.readFileSync(path.join(mk, f), 'utf8').trim(); } catch (e) { sorunlar.push(`${dil}: ${a.metin}/${f} yok`); return ''; } };
    const title = oku('title.txt'), shortDescription = oku('short_description.txt'), fullDescription = oku('full_description.txt');
    if (title.length > 30) sorunlar.push(`${dil}: ad ${title.length}/30 karakter`);
    if (shortDescription.length > 80) sorunlar.push(`${dil}: kısa açıklama ${shortDescription.length}/80 karakter`);
    if (fullDescription.length > 4000) sorunlar.push(`${dil}: uzun açıklama ${fullDescription.length}/4000 karakter`);
    let telefon = [], oneCikan = null;
    if (!GORSELSIZ && a.gorsel) {
      const gk = path.join(MAGAZA, 'gorseller', a.gorsel);
      try { telefon = fs.readdirSync(gk).filter(f => /^telefon-\d+\.(jpe?g|png)$/i.test(f)).sort().map(f => path.join(gk, f)); } catch (e) {}
      const oc = ['one-cikan.jpg', 'one-cikan.png'].map(f => path.join(gk, f)).find(f => fs.existsSync(f));
      oneCikan = oc || null;
      if (telefon.length < 2 || telefon.length > 8) sorunlar.push(`${dil}: telefon ekran görüntüsü sayısı ${telefon.length} (2–8 olmalı)`);
      if (!oneCikan) sorunlar.push(`${dil}: öne çıkan görsel (one-cikan.jpg) yok`);
    }
    isler.push({ dil, title, shortDescription, fullDescription, telefon, oneCikan });
  }
  if (TEK_DIL && !isler.length) sorunlar.push(`"${TEK_DIL}" magaza/ayarlar.json içinde yok`);
  if (sorunlar.length) hata('Yüklemeden önce düzeltilmesi gerekenler:\n   • ' + sorunlar.join('\n   • '));
  return isler;
}

// ---------- Ana akış ----------
const ayar = JSON.parse(fs.readFileSync(path.join(MAGAZA, 'ayarlar.json'), 'utf8'));
const PAKET = ayar.paket;
const isler = hazirla(ayar);
const { j: anahtar, yol: anahtarYolu } = anahtarBul();

console.log(`\n🐦 Kuş Atlası – Play mağaza sayfası ${DENE ? '(DENEME: hiçbir şey kaydedilmeyecek)' : ''}`);
console.log(`   Paket: ${PAKET} · Anahtar: ${path.basename(anahtarYolu)} · Diller: ${isler.map(i => i.dil).join(', ')}\n`);

jetonKoy(await jetonAl(anahtar));
const A = `/androidpublisher/v3/applications/${PAKET}/edits`;
const U = `/upload/androidpublisher/v3/applications/${PAKET}/edits`;
let edit;
try { edit = await istek('POST', A, {}); }
catch (e) {
  if (e.durum === 403 || e.durum === 401) hata('Play bu hesaba izin vermedi. Play Console → Kullanıcılar ve izinler bölümünde service account\'a Kuş Atlası için\n   "Mağazadaki varlığı yönet" izni verildi mi?\n   (' + e.message + ')');
  if (e.durum === 404) hata('Uygulama bulunamadı ya da Google Play Android Developer API etkin değil.\n   (' + e.message + ')');
  hata(e.message);
}
const E = `${A}/${edit.id}`, EU = `${U}/${edit.id}`;

try {
  for (const i of isler) {
    process.stdout.write(`• ${i.dil}: metinler`);
    await istek('PUT', `${E}/listings/${i.dil}`, { language: i.dil, title: i.title, shortDescription: i.shortDescription, fullDescription: i.fullDescription });
    if (!GORSELSIZ) {
      process.stdout.write(', ekran görüntüleri');
      await istek('DELETE', `${E}/listings/${i.dil}/phoneScreenshots`);
      for (const f of i.telefon) {
        await istek('POST', `${EU}/listings/${i.dil}/phoneScreenshots?uploadType=media`, fs.readFileSync(f), /\.png$/i.test(f) ? 'image/png' : 'image/jpeg');
        process.stdout.write('.');
      }
      process.stdout.write(', öne çıkan görsel');
      await istek('DELETE', `${E}/listings/${i.dil}/featureGraphic`);
      await istek('POST', `${EU}/listings/${i.dil}/featureGraphic?uploadType=media`, fs.readFileSync(i.oneCikan), /\.png$/i.test(i.oneCikan) ? 'image/png' : 'image/jpeg');
    }
    console.log(' ✓');
  }
  if (DENE) {
    await istek('POST', `${E}:validate`);
    await istek('DELETE', E).catch(() => {});
    console.log('\n✅ Deneme başarılı: Google her şeyi kabul ediyor. Hiçbir şey kaydedilmedi.\n   Gerçekten yüklemek için: npm run magaza\n');
  } else {
    await istek('POST', `${E}:commit`);
    console.log('\n✅ Kaydedildi. Değişiklikler Play incelemesine gitti; Play Console → Yayın özeti\'nden izleyebilirsin.\n');
  }
} catch (e) {
  await istek('DELETE', E).catch(() => {});
  hata('Yükleme yarıda kaldı, hiçbir şey kaydedilmedi.\n   ' + e.message);
}
