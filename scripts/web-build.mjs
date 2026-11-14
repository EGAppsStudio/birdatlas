// Web sitesini derler: dist/ = site/ (tanıtım sayfası) + dist/app/ (uygulamanın web sürümü = www/)
// Cloudflare Pages bunu her GitHub yüklemesinde çalıştırır:  npm install --omit=dev && npm run web
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const www = join(root, 'www'), dist = join(root, 'dist');

if (!existsSync(join(www, 'lib', 'leaflet'))) execFileSync('node', ['scripts/copy-libs.mjs'], { stdio: 'inherit' });

// Tür adları (Türkçe + İngilizce): Cloudflare'de EBIRD_API_KEY ortam değişkeni varsa indirilir
if (!existsSync(join(www, 'data', 'ebird-taxonomy.json'))) {
  if (process.env.EBIRD_API_KEY) execFileSync('node', ['scripts/taksonomi.mjs'], { stdio: 'inherit' });
  else console.log('(uyarı) EBIRD_API_KEY yok: tür adları yalnız CSV\'deki İngilizce adlarla görünecek');
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'site'), dist, { recursive: true });
cpSync(www, join(dist, 'app'), { recursive: true });

// Her derlemede yeni önbellek adı → kullanıcılar yeni sürümü hemen alır
const ver = (process.env.CF_PAGES_COMMIT_SHA || Date.now().toString(36)).slice(0, 10);
const sw = join(dist, 'app', 'sw.js');
writeFileSync(sw, readFileSync(sw, 'utf8').replace('__VERSION__', ver));
// Veri dosyaları sürüm ekiyle istensin: eski/eksik bir kopya tarayıcıda takılı kalmasın
const appHtml = join(dist, 'app', 'index.html');
writeFileSync(appHtml, readFileSync(appHtml, 'utf8')
  .replace("fetch('data/ebird-taxonomy.json')", `fetch('data/ebird-taxonomy.json?v=${ver}')`)
  .replace("fetch('data/ornek-veri.csv')", `fetch('data/ornek-veri.csv?v=${ver}')`));

// ---------- Tanıtım sayfasının dil sayfaları: /tr/ /en/ /es/ /pt/ /de/ /fr/ ----------
// Kaynak: site/index.html (TR + EN) + scripts/site-diller.json (ES, PT, DE, FR). Google her dili kendi adresinde görür.
{
  const kaynak = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  const diller = JSON.parse(readFileSync(join(root, 'scripts', 'site-diller.json'), 'utf8'));
  const SPAN = (l) => new RegExp(`<(span|small)([^>]*?)\\sdata-l="${l}"([^>]*)>([\\s\\S]*?)</\\1>`, 'g');
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const URL = 'https://birdatlas.app';
  const BASLIK = { tr: 'Kuş Atlası – eBird gözlemlerin, kendi haritanda', en: 'Bird Atlas – your eBird sightings, on your own map' };
  const ACIKLAMA = {
    tr: 'Kuş Atlası, eBird verini kişisel bir haritaya çevirir: her gözlem, kertiklerin, takvimin ve yıllık grafiklerin, paylaşım kartlarıyla. Verilerin cihazında kalır.',
    en: 'Bird Atlas turns your eBird data into a personal map: every sighting, lifer, calendar and chart, with share cards. Your data stays on your device.' };
  const OG = { tr: 'Her gözlem, kertik, takvim ve grafik tek bir kişisel haritada. Verilerin cihazında kalır.', en: 'Every sighting, lifer, calendar and chart on one personal map. Your data stays on your device.' };
  let eksik = 0;
  for (const L of ['tr', 'en', 'es', 'pt', 'de', 'fr']) {
    const T = diller[L];
    let h = kaynak;
    if (L === 'tr') h = h.replace(SPAN('en'), '');
    else {
      h = h.replace(SPAN('tr'), '');
      if (T) h = h.replace(SPAN('en'), (m, tag, a, b, ic) => {
        if (T[ic] === undefined) { eksik++; console.log(`(uyarı) ${L}: çeviri yok → "${ic.slice(0, 60)}…"`); return m; }
        return `<${tag}${a} data-l="en"${b}>${T[ic]}</${tag}>`;
      });
    }
    const baslik = T ? T._title : BASLIK[L], aciklama = T ? T._desc : ACIKLAMA[L], og = T ? T._ogdesc : OG[L];
    const resim = L === 'tr' ? 'tr' : 'en';
    h = h.replace('<html lang="tr" data-lang="tr">', `<html lang="${L}" data-lang="${L === 'tr' ? 'tr' : 'en'}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(baslik)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(aciklama)}">`)
      .replace('<link rel="canonical" href="https://birdatlas.app/">', `<link rel="canonical" href="${URL}/${L}/">`)
      .replace('<meta property="og:url" content="https://birdatlas.app/">', `<meta property="og:url" content="${URL}/${L}/">`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(baslik)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(og)}">`)
      .replace('/img/og-en.jpg', `/img/og-${resim}.jpg`)
      .replace('<a class="brand" href="/">', `<a class="brand" href="/${L}/">`)
      .replace(/<img data-shot="([a-z]+)"/g, (m, k) => `<img src="/img/shots/${k}-${resim}.webp" data-shot="${k}"`)
      .replace(`data-set="${L}"`, `data-set="${L}" aria-current="true"`)
      .replace('<span class="cur">TR</span>', `<span class="cur">${L.toUpperCase()}</span>`)
      .replace(/\/\*DIL-BASLA\*\/[\s\S]*?\/\*DIL-BITIR\*\//,
        `try { localStorage.setItem('site_lang', '${L}');${L === 'tr' || L === 'en' ? ` localStorage.setItem('app_lang', '${L}');` : ''} } catch (e) {}`);
    if (T && T._uygulama_dili) h = h.replace('<p class="note">', `<p class="note applang">${T._uygulama_dili}</p>\n        <p class="note">`);
    mkdirSync(join(dist, L), { recursive: true });
    writeFileSync(join(dist, L, 'index.html'), h);
  }
  console.log('✓ tanıtım sayfası 6 dilde: /tr/ /en/ /es/ /pt/ /de/ /fr/' + (eksik ? ` (${eksik} çevirisi eksik satır İngilizce kaldı)` : ''));
}

console.log('✓ dist/ hazır (sürüm ' + ver + ')');
