// Geliştiricinin öyküsünü (scripts/hikaye.json, 6 dil) uygulamaya ve siteye yazar:
//   www/index.html  → const HIKAYE = {menu};  (☰ → "Geliştiriciyi tanı" → birdatlas.app/<dil>/#hikaye)
//   site/index.html → <section class="hikaye" id="hikaye"> (TR + EN)
//   scripts/site-diller.json → ES / PT / DE / FR karşılıkları (anahtar = İngilizce metin)
// Kullanım: node scripts/hikaye.mjs   (metni değiştirince yeniden çalıştır)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const H = JSON.parse(readFileSync(join(KOK, 'scripts', 'hikaye.json'), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- uygulama ----------
const app = join(KOK, 'www', 'index.html');
let s = readFileSync(app, 'utf8');
const veri = { menu: H.menu };   // uygulamada yalnız ☰ menü yazısı; menü sitedeki öyküyü (birdatlas.app/<dil>/#hikaye) açar
const yeni = s.replace(/const HIKAYE = \{.*\};/, () => 'const HIKAYE = ' + JSON.stringify(veri) + ';');
if (yeni === s && !s.includes('const HIKAYE = ' + JSON.stringify(veri))) throw new Error('www/index.html içinde "const HIKAYE = {...};" bulunamadı');
writeFileSync(app, yeni);

// ---------- site (TR + EN) ----------
const site = join(KOK, 'site', 'index.html');
let t = readFileSync(site, 'utf8');
const sp = o => `<span data-l="tr">${esc(o.tr)}</span><span data-l="en">${esc(o.en)}</span>`;
const bolum = `<section class="hikaye" id="hikaye">
    <div class="wrap">
      <div class="hk-bas"><div class="mv-hk" data-mavis="wave" role="img" aria-label="Maviş"></div>
      <h2>${sp(H.title)}</h2></div>
${H.p.map(p => `      <p>${sp(p)}</p>`).join('\n')}
      <p class="hk-imza">${esc(H.imza)}</p>
    </div>
  </section>`;
const a = t.indexOf('<section class="hikaye"'), b = a < 0 ? -1 : t.indexOf('</section>', a);
if (a < 0) throw new Error('site/index.html içinde <section class="hikaye"> yok');
t = t.slice(0, a) + bolum + t.slice(b + '</section>'.length);
writeFileSync(site, t);

// ---------- site ek dilleri ----------
const dp = join(KOK, 'scripts', 'site-diller.json');
const D = JSON.parse(readFileSync(dp, 'utf8'));
for (const L of ['es', 'pt', 'de', 'fr']) {
  if (!D[L]) continue;
  for (const o of [H.title, H.link, ...H.p]) D[L][o.en] = o[L];
}
writeFileSync(dp, JSON.stringify(D, null, 2) + '\n');
console.log('Öykü yazıldı: uygulama + site (6 dil).');
