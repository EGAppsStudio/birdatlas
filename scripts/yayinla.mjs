// Kullanıcılara giden (üretim) sürümü Play'e tek komutla gönderir: en yeni imzalı AAB + 6 dilde sürüm notları.
// Sürüm notları: magaza/surum-notlari/<sürüm>.txt (Play biçiminde: <tr-TR>…</tr-TR> …); sürüm package.json'dan (1.15.0 → "1.15", versionCode 11500).
// Kullanım (Android Studio'da Build → Generate Signed Bundle yaptıktan sonra; KOMUTLAR.bat):
//   npm run yayinla                          → özet gösterir, "EVET" yazınca gönderir (Play yine inceler)
//   npm run yayinla -- --dosya="C:\yol\app-release.aab"
//   npm run yayinla -- --kademeli=20          → kullanıcıların %20'sine kademeli (sonra Play Console'dan artırılır)
//   npm run yayinla -- --dene                 → hiçbir şey göndermeden kontrol (taslak açılır, kaydedilmez)
// İzin: service account'a Play Console'da "Uygulamaları üretime yayınla" izni gerekir (test kanalları izni yetmez).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { KOK, hata, anahtarBul, jetonAl, jetonKoy, istek } from './play-ortak.mjs';

const ARG = process.argv.slice(2);
const DENE = ARG.includes('--dene');
const dosyaArg = (ARG.find(a => a.startsWith('--dosya=')) || '').slice(8).replace(/^"|"$/g, '');
const kademeli = parseFloat((ARG.find(a => a.startsWith('--kademeli=')) || '').slice(11)) || 0;
const PAKET = JSON.parse(fs.readFileSync(path.join(KOK, 'magaza', 'ayarlar.json'), 'utf8')).paket;

// ---------- sürüm ve kod ----------
const surum = JSON.parse(fs.readFileSync(path.join(KOK, 'package.json'), 'utf8')).version;   // 1.15.0
const [maj, min, yama] = surum.split('.').map(n => parseInt(n, 10) || 0);
const KOD = maj * 10000 + min * 100 + yama;
const AD = yama ? `${maj}.${min}.${yama}` : `${maj}.${min}`;
if (yama) console.log(`\n⚠️  Sürüm ${AD}: ikinci noktalı sürümler yalnız kendi denemelerin içindi (üretimde 1.15, 1.16…).`);

// ---------- sürüm notları ----------
const notDosya = path.join(KOK, 'magaza', 'surum-notlari', `${AD}.txt`);
if (!fs.existsSync(notDosya)) hata(`Sürüm notları yok: magaza/surum-notlari/${AD}.txt (Claude'dan iste).`);
const notlar = [...fs.readFileSync(notDosya, 'utf8').matchAll(/<([a-z]{2}-[A-Z0-9]{2,3})>\s*([\s\S]*?)\s*<\/\1>/g)].map(m => ({ language: m[1], text: m[2].trim() }));
if (!notlar.length) hata(`${AD}.txt içinde <tr-TR>…</tr-TR> biçiminde not bulunamadı.`);
const uzun = notlar.filter(n => n.text.length > 500);
if (uzun.length) hata('Sürüm notu 500 karakteri geçiyor: ' + uzun.map(n => `${n.language} (${n.text.length})`).join(', '));

// ---------- AAB ----------
function aabBul() {
  if (dosyaArg) { if (!fs.existsSync(dosyaArg)) hata('Dosya yok: ' + dosyaArg); return dosyaArg; }
  let en = null;
  for (const k of [path.join(KOK, 'android', 'app', 'release'), path.join(KOK, 'android', 'app', 'build', 'outputs', 'bundle', 'release')]) {
    try { for (const f of fs.readdirSync(k)) if (f.toLowerCase().endsWith('.aab')) { const y = path.join(k, f), t = fs.statSync(y).mtimeMs; if (!en || t > en.t) en = { y, t }; } } catch (e) {}
  }
  if (!en) hata('İmzalı AAB bulunamadı. Önce Android Studio → Build → Generate Signed Bundle yap.');
  return en.y;
}
const aab = aabBul(), st = fs.statSync(aab), dk = Math.round((Date.now() - st.mtimeMs) / 60000);
const ne = dk < 60 ? `${dk} dk önce` : dk < 1440 ? `${Math.round(dk / 60)} saat önce` : `${Math.round(dk / 1440)} gün önce`;

console.log(`\n🐦 Kuş Atlası – ÜRETİM yayını ${DENE ? '(DENEME: gönderilmeyecek)' : ''}`);
console.log(`   Sürüm: ${AD} · versionCode ${KOD}`);
console.log(`   Paket: ${aab}`);
console.log(`          ${ne} üretildi · ${(st.size / 1048576).toFixed(1)} MB`);
if (dk > 180) console.log('   ⚠️  Bu paket eski görünüyor. Son değişiklikler içinde olmayabilir: önce yeniden Generate Signed Bundle yap.');
console.log(`   Notlar: ${notlar.map(n => n.language).join(', ')}`);
console.log(`   Kime: ${kademeli ? `kullanıcıların %${kademeli}'i (kademeli)` : 'tüm kullanıcılar'} (Google incelemesinden sonra)\n`);
const tr = notlar.find(n => n.language === 'tr-TR'); if (tr) console.log(tr.text.split('\n').map(x => '   ' + x).join('\n') + '\n');

if (!DENE) {
  if (!process.stdin.isTTY) hata('Onay için pencere gerekiyor (KOMUTLAR.bat ile çalıştır).');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const c = (await rl.question('   Göndermek için EVET yaz (vazgeçmek için Enter): ')).trim().toUpperCase(); rl.close();
  if (c !== 'EVET') { console.log('   Vazgeçildi, hiçbir şey gönderilmedi.\n'); process.exit(0); }
}

// ---------- Play ----------
const { j: anahtar } = anahtarBul();
jetonKoy(await jetonAl(anahtar));
const A = `/androidpublisher/v3/applications/${PAKET}/edits`, U = `/upload/androidpublisher/v3/applications/${PAKET}/edits`;
const izin = (e) => {
  if (e.durum === 403 || e.durum === 401) hata('Play izin vermedi. Play Console → Kullanıcılar ve izinler → service account → Kuş Atlası:\n   "Uygulamaları üretime yayınla, cihazları hariç tut ve Play Uygulama İmzalama\'yı kullan" iznini işaretle.\n   (' + e.message + ')');
  if (/version code .* already been used|APK specifies a version code that has already been used/i.test(e.message)) hata(`versionCode ${KOD} Play'de zaten kullanılmış. Claude'a söyle: bir sonraki sürüme geçsin (ör. ${maj}.${min + 1}).\n   (${e.message})`);
  hata(e.message);
};
let edit; try { edit = await istek('POST', A, {}); } catch (e) { izin(e); }
const E = `${A}/${edit.id}`, EU = `${U}/${edit.id}`;
try {
  process.stdout.write('   Paket yükleniyor… ');
  const b = await istek('POST', `${EU}/bundles?uploadType=media`, fs.readFileSync(aab), 'application/octet-stream');
  console.log(`✓ (versionCode ${b.versionCode})`);
  if (b.versionCode !== KOD) hata(`Paketin versionCode'u ${b.versionCode}, beklenen ${KOD}. Önce KOMUTLAR'da sync yapıp yeniden Generate Signed Bundle yap.`);
  process.stdout.write('   Üretim kanalı + sürüm notları… ');
  await istek('PUT', `${E}/tracks/production`, { track: 'production', releases: [{ name: AD, versionCodes: [String(KOD)], status: kademeli ? 'inProgress' : 'completed', ...(kademeli ? { userFraction: Math.min(0.99, kademeli / 100) } : {}), releaseNotes: notlar }] });
  console.log('✓');
  if (DENE) { await istek('DELETE', E).catch(() => {}); console.log('\n   (Deneme: taslak silindi, hiçbir şey gönderilmedi.)\n'); process.exit(0); }
  process.stdout.write('   Gönderiliyor… ');
  await istek('POST', `${E}:commit`);
  console.log('✓');
} catch (e) { await istek('DELETE', E).catch(() => {}); console.log(''); izin(e); }
console.log(`\n✅ ${AD} incelemeye gönderildi. Durumu Play Console → Yayın özeti'nden izleyebilirsin (genelde birkaç saat – 1 gün).\n`);
