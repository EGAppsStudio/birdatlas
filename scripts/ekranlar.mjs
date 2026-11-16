// Mağaza ekran görüntüleri: uygulamanın web sürümünü telefon boyutunda açar, örnek veriyle
// 10 ekranı 6 dilde çeker → magaza/ham-ekranlar/<dil>/01-harita.jpg … (60 görüntü).
// Claude bunlardan başlıklı, çerçeveli mağaza görsellerini (magaza/gorseller/<dil>/) hazırlar.
//
// Kullanım (KOMUTLAR.bat 9):   npm run ekranlar            → 6 dil
//                              npm run ekranlar -- de fr   → yalnız bu diller
// Tarayıcı indirilmez: bilgisayardaki Microsoft Edge (yoksa Chrome) görünmez modda kullanılır.
// Kişisel veri yok: uygulamanın kurgusal örnek verisi kullanılır. Keşfet ekranı turdaki örnek sonuçlarla çekilir (anahtar gerekmez).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const KOK = process.cwd(), WWW = path.join(KOK, 'www'), CIKTI = path.join(KOK, 'magaza', 'ham-ekranlar');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { try { ({ chromium } = require('playwright')); } catch (e2) { console.log('playwright-core yok: önce KOMUTLAR 6 (npm install).'); process.exit(1); } }
if (!fs.existsSync(path.join(WWW, 'lib', 'leaflet'))) { console.log('www/lib yok: önce KOMUTLAR 6 (npm install).'); process.exit(1); }

const DILLER = process.argv.slice(2).filter(a => /^[a-z]{2}$/.test(a));
const LANGS = DILLER.length ? DILLER : ['tr', 'en', 'es', 'pt', 'de', 'fr'];
const LOCALE = { tr: 'tr-TR', en: 'en-US', es: 'es-ES', pt: 'pt-BR', de: 'de-DE', fr: 'fr-FR' };

// ---------- Android'deki yazı tipleri: Roboto + Noto Color Emoji ----------
// Uygulama 'Segoe UI' yazı tipini ister; Windows'ta bu var, Android'de yok (orada Roboto çıkar).
// Telefonla aynı görünsün diye 'Segoe UI' adını Roboto + Noto emoji dosyalarına bağlarız.
function fontCss() {
  const fsrc = (pkg) => path.join(KOK, 'node_modules', '@fontsource', pkg);
  let css = '';
  const al = (pkg, files, fam) => {
    for (const f of files) {
      const p = path.join(fsrc(pkg), f); if (!fs.existsSync(p)) continue;
      css += fs.readFileSync(p, 'utf8')
        .replace(/font-family:\s*'[^']+'/g, `font-family: '${fam}'`)
        .replace(/url\(\.\/files\//g, `url(/__font/${pkg}/files/`);
    }
  };
  al('noto-color-emoji', ['400.css'], 'Segoe UI');   // önce emoji, sonra Roboto: çakışan harflerde Roboto kazanır
  al('roboto', ['400.css', '500.css', '700.css'], 'Segoe UI');
  return css + `\n.fchip.sample{display:none!important}\n`;
}

// ---------- www/ klasörünü yerelde sun ----------
const TIP = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.csv': 'text/csv', '.webmanifest': 'application/manifest+json' };
const sunucu = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  let dosya = u.startsWith('/__font/') ? path.join(KOK, 'node_modules', '@fontsource', u.slice(8)) : path.join(WWW, u === '/' ? 'index.html' : u);
  if (!dosya.startsWith(KOK) || !fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TIP[path.extname(dosya)] || 'application/octet-stream' });
  fs.createReadStream(dosya).pipe(r);
});
await new Promise(ok => sunucu.listen(0, '127.0.0.1', ok));
const ADRES = `http://127.0.0.1:${sunucu.address().port}/`;

// ---------- Çekilecek ekranlar (uygulamanın tanıtım turu adımları kullanılır) ----------
const EKRANLAR = [
  ['01-harita', 'map'],
  ['02-konumlar', 'locations'],
  ['03-turler', 'species'],
  ['04-takvim', 'calendar'],
  ['05-grafik', 'calendar', async (pg) => { await pg.evaluate(() => { let c = document.querySelector('#filter-panels .year-chart'); if (c) c.scrollIntoView({ block: 'start' }); }); }],
  ['06-kertik', 'lifer'],
  ['07-foto', 'myphoto'],
  ['08-paylas', 'share', async (pg) => { await pg.evaluate(() => { closeShare(); try { clearFilter('all'); } catch (e) {} openShare({ type: 'year' }); }); await bekle(2500); }],
  ['09-mavis', 'mavis'],
  ['10-kesfet', 'explore'],
];

const bekle = (ms) => new Promise(ok => setTimeout(ok, ms));
async function tarayici() {
  for (const channel of ['msedge', 'chrome', undefined]) {
    try { return await chromium.launch({ channel, headless: true }); } catch (e) {}
  }
  console.log('Edge ya da Chrome bulunamadı.'); process.exit(1);
}

const b = await tarayici();
const css = fontCss();
let toplam = 0;
console.log(`\n📸 Mağaza ekran görüntüleri · diller: ${LANGS.join(', ')}\n`);
for (const L of LANGS) {
  const klasor = path.join(CIKTI, L); fs.mkdirSync(klasor, { recursive: true });
  const ctx = await b.newContext({
    viewport: { width: 412, height: 800 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: LOCALE[L],
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  });
  await ctx.addInitScript(([L, css]) => {
    try {
      localStorage.setItem('app_lang', L); localStorage.setItem('tour_done', '1'); localStorage.setItem('fbask_done', '1');
      localStorage.setItem('launch_count', '1'); localStorage.setItem('milestone_seen', '99999');
    } catch (e) {}
    document.addEventListener('DOMContentLoaded', () => { let s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); });
  }, [L, css]);
  const pg = await ctx.newPage();
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  process.stdout.write(`• ${L}: açılıyor`);
  await pg.goto(ADRES + 'index.html');
  await pg.waitForFunction(() => typeof window.loadSampleData === 'function');
  await pg.evaluate(() => window.loadSampleData());
  await pg.waitForFunction(() => typeof obsData !== 'undefined' && obsData.length > 0 && document.getElementById('upload-overlay').style.display === 'none', null, { timeout: 120000 });
  await bekle(3000);
  await pg.evaluate(() => { document.querySelectorAll('.app-alert, #fbask').forEach(e => e.remove()); startTour(true); });
  for (const [ad, adim, sonra] of EKRANLAR) {
    await pg.evaluate(async (adim) => {
      let i = tourSteps.findIndex(s => s.id === adim);
      if (i < 0) throw new Error('tur adımı yok: ' + adim);
      if (tourIdx !== i) await goTour(i);
    }, adim);
    await bekle(adim === 'lifer' ? 3500 : 1800);
    if (sonra) { await sonra(pg); await bekle(800); }
    await pg.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await bekle(1500);   // harita parçaları ve fotoğraflar otursun
    await pg.evaluate(() => { let t = document.getElementById('tour'); if (t) t.style.visibility = 'hidden'; });
    await pg.screenshot({ path: path.join(klasor, ad + '.jpg'), type: 'jpeg', quality: 90 });
    await pg.evaluate(() => { let t = document.getElementById('tour'); if (t) t.style.visibility = ''; });
    process.stdout.write('.'); toplam++;
  }
  console.log(' ✓');
  await ctx.close();
}
await b.close(); sunucu.close();
console.log(`\n✅ ${toplam} ekran görüntüsü: magaza/ham-ekranlar/`);
console.log('   Şimdi GitHub Desktop → Commit → Push; Claude mağaza görsellerini hazırlasın.\n');
