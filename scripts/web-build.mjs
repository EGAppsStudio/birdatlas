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

console.log('✓ dist/ hazır (sürüm ' + ver + ')');
