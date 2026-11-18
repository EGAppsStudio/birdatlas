// Play mağaza sayfası metinlerini ve görsellerini Google Play'e yükler (Google Play Developer API).
// Diller ve iletişim bilgileri: magaza/ayarlar.json (tr-TR ve en-US dahil; görseli yazılmayan dilin görsellerine dokunulmaz)
// Kullanım (proje klasöründe; KOMUTLAR.bat 5 ve 6 bunları çalıştırır):
//   npm run magaza -- --metin       → yalnız METİNLER (tüm diller, TR ve EN dahil) + iletişim (web sitesi, e-posta)
//   npm run magaza -- --gorsel      → yalnız GÖRSELLER: uygulama ikonu (magaza/gorseller/ikon-512.png) + ekran görüntüleri + öne çıkan görsel
//   npm run magaza                  → ikisi birden
//   ek: --dene (yalnız kontrol, hiçbir şey kaydedilmez) · --dil=de-DE (yalnız bir dil)
// Görsel klasörü olmayan dilde (ör. magaza/gorseller/tr yoksa) o dilin ekran görüntülerine dokunulmaz.
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
const YALNIZ_METIN = args.includes('--metin') || args.includes('--gorselsiz');
const YALNIZ_GORSEL = args.includes('--gorsel');
const METIN = !YALNIZ_GORSEL, GORSEL = !YALNIZ_METIN;
const IKON = path.join(KOK, 'magaza', 'gorseller', 'ikon-512.png');
const TEK_DIL = (args.find(a => a.startsWith('--dil=')) || '').slice(6) || null;

// ---------- Hazırlık: metinleri ve görselleri oku, sınırları kontrol et ----------
function hazirla(ayar) {
  const isler = [];
  const sorunlar = [];
  for (const [dil, a] of Object.entries(ayar.diller)) {
    if (TEK_DIL && dil !== TEK_DIL) continue;
    const mk = path.join(MAGAZA, 'metinler', a.metin);
    const oku = (f) => { try { return fs.readFileSync(path.join(mk, f), 'utf8').trim(); } catch (e) { sorunlar.push(`${dil}: ${a.metin}/${f} yok`); return ''; } };
    const title = METIN ? oku('title.txt') : '', shortDescription = METIN ? oku('short_description.txt') : '', fullDescription = METIN ? oku('full_description.txt') : '';
    if (title.length > 30) sorunlar.push(`${dil}: ad ${title.length}/30 karakter`);
    if (shortDescription.length > 80) sorunlar.push(`${dil}: kısa açıklama ${shortDescription.length}/80 karakter`);
    if (fullDescription.length > 4000) sorunlar.push(`${dil}: uzun açıklama ${fullDescription.length}/4000 karakter`);
    // tanıtım videosu (isteğe bağlı): metinler/<dil>/video.txt içinde YouTube linki (liste dışı, reklamsız)
    let video = ''; try { video = fs.readFileSync(path.join(mk, 'video.txt'), 'utf8').trim(); } catch (e) {}
    if (video && !/^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}$/.test(video)) sorunlar.push(`${dil}: video.txt geçerli bir YouTube linki değil`);
    let telefon = [], oneCikan = null;
    const gk = a.gorsel ? path.join(MAGAZA, 'gorseller', a.gorsel) : null;
    const gorselli = GORSEL && !!gk && fs.existsSync(gk);
    if (gorselli) {
      try { telefon = fs.readdirSync(gk).filter(f => /^telefon-\d+\.(jpe?g|png)$/i.test(f)).sort().map(f => path.join(gk, f)); } catch (e) {}
      const oc = ['one-cikan.jpg', 'one-cikan.png'].map(f => path.join(gk, f)).find(f => fs.existsSync(f));
      oneCikan = oc || null;
      if (telefon.length < 2 || telefon.length > 8) sorunlar.push(`${dil}: telefon ekran görüntüsü sayısı ${telefon.length} (2–8 olmalı)`);
      if (!oneCikan) sorunlar.push(`${dil}: öne çıkan görsel (one-cikan.jpg) yok`);
    }
    isler.push({ dil, title, shortDescription, fullDescription, video, telefon, oneCikan, gorselli });
  }
  if (GORSEL && !fs.existsSync(IKON)) sorunlar.push('magaza/gorseller/ikon-512.png yok');
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
console.log(`   Yüklenecek: ${[METIN && 'metinler + iletişim', GORSEL && 'ikon + ekran görüntüleri + öne çıkan görsel'].filter(Boolean).join(', ')}`);
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
    process.stdout.write(`• ${i.dil}:`);
    if (METIN) {
      process.stdout.write(i.video ? ' metinler + video' : ' metinler');
      await istek('PUT', `${E}/listings/${i.dil}`, { language: i.dil, title: i.title, shortDescription: i.shortDescription, fullDescription: i.fullDescription, ...(i.video ? { video: i.video } : {}) });
    }
    if (GORSEL) {   // uygulama ikonu: beyaz zeminli, şeffaf değil (şeffaf olursa Play kenarı renkle doldurur)
      process.stdout.write(' ikon');
      await istek('DELETE', `${E}/listings/${i.dil}/icon`).catch(() => {});
      await istek('POST', `${EU}/listings/${i.dil}/icon?uploadType=media`, fs.readFileSync(IKON), 'image/png');
    }
    if (GORSEL && !i.gorselli) process.stdout.write(' (bu dilin görsel klasörü yok, ekran görüntülerine dokunulmadı)');
    if (i.gorselli) {
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
  // Mağaza ayarları → iletişim bilgileri (Web sitesi, e-posta)
  if (METIN && ayar.iletisim && !TEK_DIL) {
    process.stdout.write('• iletişim bilgileri (web sitesi, e-posta)');
    const govde = {};
    if (ayar.iletisim.web) govde.contactWebsite = ayar.iletisim.web;
    if (ayar.iletisim.eposta) govde.contactEmail = ayar.iletisim.eposta;
    await istek('PATCH', `${E}/details`, govde);
    console.log(' ✓');
  }
  if (DENE) {
    await istek('POST', `${E}:validate`);
    await istek('DELETE', E).catch(() => {});
    console.log('\n✅ Deneme başarılı: Google her şeyi kabul ediyor. Hiçbir şey kaydedilmedi.\n   Gerçekten yüklemek için --dene olmadan çalıştır.\n');
  } else {
    await istek('POST', `${E}:commit`);
    console.log('\n✅ Kaydedildi. Değişiklikler Play incelemesine gitti; Play Console → Yayın özeti\'nden izleyebilirsin.\n');
  }
} catch (e) {
  await istek('DELETE', E).catch(() => {});
  hata('Yükleme yarıda kaldı, hiçbir şey kaydedilmedi.\n   ' + e.message);
}
