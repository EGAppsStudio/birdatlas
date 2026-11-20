// Geliştiricinin öyküsünü (scripts/hikaye.json, 6 dil) uygulamaya ve siteye yazar:
//   www/index.html  → const HIKAYE = {menu};  (☰ → "Kuş Atlası'nın öyküsü" → birdatlas.app/story/?lang=<dil>)
//   site/story/index.html → ayrı sayfa birdatlas.app/story/?lang=xx (6 dil)
//   scripts/site-diller.json → ana sayfanın altındaki "Geliştiriciyi tanıyın" bağlantısının ES/PT/DE/FR karşılığı
// Kullanım: node scripts/hikaye.mjs   (metni değiştirince yeniden çalıştır)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const H = JSON.parse(readFileSync(join(KOK, 'scripts', 'hikaye.json'), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- uygulama ----------
const app = join(KOK, 'www', 'index.html');
let s = readFileSync(app, 'utf8');
const veri = { menu: H.menu };   // uygulamada yalnız ☰ menü yazısı; menü sitedeki öykü sayfasını açar
const yeni = s.replace(/const HIKAYE = \{.*\};/, () => 'const HIKAYE = ' + JSON.stringify(veri) + ';');
if (yeni === s && !s.includes('const HIKAYE = ' + JSON.stringify(veri))) throw new Error('www/index.html içinde "const HIKAYE = {...};" bulunamadı');
writeFileSync(app, yeni);

// ---------- site: ayrı sayfa /story/ (6 dil tek sayfada; dil ?lang= → gelinen sayfa → app_lang → tarayıcı) ----------
const DIL = { tr: 'TR', en: 'EN', es: 'ES', pt: 'PT', de: 'DE', fr: 'FR' };
const art = L => `<article data-l="${L}" lang="${L}">
<div class="bas"><div class="mv" data-mavis="wave" role="img" aria-label="Maviş"></div><h1>${esc(H.title[L])}</h1></div>
${H.p.map(p => `<p>${esc(p[L])}</p>`).join('\n')}
<p class="imza">${esc(H.imza)}</p>
<p class="geri"><a href="/${L}/">← ${esc(H.geri[L])}</a> · <a href="/app/?lang=${L}">${esc(H.ac[L])}</a></p>
</article>`;
const sayfa = `<!doctype html>
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(H.title.en)} · ${esc(H.title.tr)}</title>
<meta name="description" content="${esc(H.p[0].en.slice(0, 150))}…">
<meta name="theme-color" content="#10325C">
<link rel="icon" type="image/svg+xml" href="/img/logo.svg">
<link rel="icon" type="image/png" href="/img/favicon-64.png">
<link rel="canonical" href="https://birdatlas.app/story/">
<!-- Bu dosyayı elle düzenleme: metin scripts/hikaye.json, üreten node scripts/hikaye.mjs -->
<style>
@font-face { font-family: "Poppins"; font-weight: 400; src: url("/app/lib/fonts/poppins-latin-ext-400-normal.woff2") format("woff2"); unicode-range: U+0100-0130, U+0132-024F; }
@font-face { font-family: "Poppins"; font-weight: 400; src: url("/app/lib/fonts/poppins-latin-400-normal.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+2000-206F; }
@font-face { font-family: "Poppins"; font-weight: 700; src: url("/app/lib/fonts/poppins-latin-ext-700-normal.woff2") format("woff2"); unicode-range: U+0100-0130, U+0132-024F; }
@font-face { font-family: "Poppins"; font-weight: 700; src: url("/app/lib/fonts/poppins-latin-700-normal.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+2000-206F; }
body { margin: 0; background: #F5F8FC; color: #42536A; font: 400 17px/1.75 "Poppins", system-ui, sans-serif; }
main { width: min(720px, 100% - 32px); margin: 0 auto; padding: 28px 0 64px; }
header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
header a.home { display: flex; align-items: center; gap: 10px; color: #10325C; font-weight: 700; text-decoration: none; }
header img { width: 36px; height: 36px; border-radius: 50%; background: #fff; }
.langs { display: flex; gap: 4px; flex-wrap: wrap; }
.langs button { font: inherit; font-size: 13px; border: 1px solid #D9E3F0; background: #fff; color: #10325C; padding: 2px 10px; border-radius: 999px; cursor: pointer; }
.langs button[aria-pressed="true"] { background: #10325C; color: #fff; }
.bas { display: flex; align-items: center; gap: 16px; margin: 30px 0 18px; }
.mv { flex: 0 0 92px; height: 92px; }
h1 { color: #10325C; font-size: clamp(26px, 5vw, 38px); line-height: 1.2; margin: 0; }
p { margin: 0 0 16px; }
.imza { font-weight: 700; color: #10325C; margin-top: 24px; }
.geri { margin-top: 36px; font-size: 15px; }
a { color: #1F5FB0; }
article { display: none; }
${Object.keys(DIL).map(L => `html[data-lang="${L}"] article[data-l="${L}"]`).join(', ')} { display: block; }
</style>
</head>
<body><main>
<header><a class="home" href="/"><img src="/img/logo.svg" alt="">Kuş Atlası · Bird Atlas</a>
<div class="langs">${Object.entries(DIL).map(([L, k]) => `<button data-set="${L}" aria-pressed="${L === 'en'}">${k}</button>`).join(' ')}</div></header>
${Object.keys(DIL).map(art).join('\n')}
</main>
<script>
(function () {
  var D = ${JSON.stringify(Object.keys(DIL))}, T = ${JSON.stringify(H.title)}, l = null;
  try { l = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (D.indexOf(l) < 0) { var m = (document.referrer || '').match(/\\/\\/[^\\/]*birdatlas\\.app\\/(tr|en|es|pt|de|fr)\\//); l = m ? m[1] : null; }
  if (D.indexOf(l) < 0) { try { l = localStorage.getItem('app_lang'); } catch (e) {} }
  if (D.indexOf(l) < 0) l = (navigator.language || 'en').slice(0, 2).toLowerCase();
  if (D.indexOf(l) < 0) l = 'en';
  function set(x) {
    document.documentElement.setAttribute('data-lang', x); document.documentElement.lang = x; document.title = T[x];
    [].forEach.call(document.querySelectorAll('.langs button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-set') === x); });
  }
  set(l);
  [].forEach.call(document.querySelectorAll('.langs button'), function (b) { b.onclick = function () { set(b.getAttribute('data-set')); }; });
})();
</script>
<script src="/mavis.js" defer></script>
</body>
</html>
`;
mkdirSync(join(KOK, 'site', 'story'), { recursive: true });
writeFileSync(join(KOK, 'site', 'story', 'index.html'), sayfa);

// ---------- ana sayfadaki alt bağlantı (ES/PT/DE/FR karşılıkları) ----------
const dp = join(KOK, 'scripts', 'site-diller.json');
const D = JSON.parse(readFileSync(dp, 'utf8'));
for (const L of ['es', 'pt', 'de', 'fr']) if (D[L]) { D[L][H.link.en] = H.link[L]; D[L][H.title.en] = H.title[L]; }   // alt bağlantı + video altındaki düğme
writeFileSync(dp, JSON.stringify(D, null, 2) + '\n');
console.log('Öykü yazıldı: uygulama menüsü + site/story/ (6 dil).');
