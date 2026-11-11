// Kendi denemen için: en yeni imzalı AAB'yi Play "Dahili uygulama paylaşımı"na yükler ve kurulum linkini verir.
// Sürüm kodunu artırmak gerekmez; inceleme yok; kullanıcılara gitmez.
// Kullanım (proje klasöründe, Android Studio'da Generate Signed Bundle yaptıktan sonra):
//   npm run paylas
//   npm run paylas -- --dosya="C:\yol\app-release.aab"   (belirli bir dosya)
// Not: Google bu derlemeyi kendi test imzasıyla imzalar; telefonda Play'den gelen normal sürüm varsa önce onu sil.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { KOK, hata, anahtarBul, jetonAl, jetonKoy, istek } from './play-ortak.mjs';

const PAKET = JSON.parse(fs.readFileSync(path.join(KOK, 'magaza', 'ayarlar.json'), 'utf8')).paket;
const arg = (process.argv.slice(2).find(a => a.startsWith('--dosya=')) || '').slice(8).replace(/^"|"$/g, '');

function aabBul() {
  if (arg) { if (!fs.existsSync(arg)) hata('Dosya yok: ' + arg); return arg; }
  const klasorler = [
    path.join(KOK, 'android', 'app', 'release'),
    path.join(KOK, 'android', 'app', 'build', 'outputs', 'bundle', 'release'),
    path.join(os.homedir(), 'Downloads', 'kus-atlasi', 'kus-atlasi', 'android', 'app', 'release'), // Android Studio eski hedefi hatırlıyorsa
  ];
  let en = null;
  for (const k of klasorler) {
    try {
      for (const f of fs.readdirSync(k)) if (f.toLowerCase().endsWith('.aab')) {
        const y = path.join(k, f), t = fs.statSync(y).mtimeMs;
        if (!en || t > en.t) en = { y, t };
      }
    } catch (e) {}
  }
  if (!en) hata('İmzalı AAB bulunamadı. Önce Android Studio → Build → Generate Signed Bundle yap\n   (ya da: npm run paylas -- --dosya="dosyanın yolu").');
  return en.y;
}

const aab = aabBul();
const st = fs.statSync(aab);
const dk = Math.round((Date.now() - st.mtimeMs) / 60000);
const ne = dk < 60 ? `${dk} dk önce` : dk < 1440 ? `${Math.round(dk / 60)} saat önce` : `${Math.round(dk / 1440)} gün önce`;
console.log(`\n🐦 Kuş Atlası – dahili uygulama paylaşımı`);
console.log(`   Dosya: ${aab}`);
console.log(`   Üretildi: ${ne} · ${(st.size / 1048576).toFixed(1)} MB`);
if (dk > 120) console.log('   ⚠️  Bu dosya eski görünüyor. Yeni değişiklikleri denemek istiyorsan önce yeniden Generate Signed Bundle yap.');

const { j: anahtar } = anahtarBul();
jetonKoy(await jetonAl(anahtar));
process.stdout.write('   Yükleniyor… ');
let r;
try {
  r = await istek('POST', `/upload/androidpublisher/v3/applications/internalappsharing/${PAKET}/artifacts/bundle?uploadType=media`, fs.readFileSync(aab), 'application/octet-stream');
} catch (e) {
  console.log('');
  if (e.durum === 403) hata('Play izin vermedi. Play Console → Kullanıcılar ve izinler → service account → Kuş Atlası izinlerinde\n   "Uygulamaları test kanallarına yayınla" işaretli mi? Dahili uygulama paylaşımı şartları kabul edildi mi?\n   (' + e.message + ')');
  hata(e.message);
}
console.log('✓\n');
console.log('   📲 Kurulum linki (telefonda aç → Yükle):');
console.log('   ' + r.downloadUrl + '\n');
// Windows'ta panoya da kopyala
try {
  if (process.platform === 'win32') {
    const { execSync } = await import('node:child_process');
    execSync('clip', { input: r.downloadUrl });
    console.log('   (Link panoya kopyalandı; WhatsApp\'ta kendine yapıştırıp gönderebilirsin.)\n');
  }
} catch (e) {}
