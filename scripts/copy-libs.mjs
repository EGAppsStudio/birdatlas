// Leaflet, PapaParse, JSZip, MapLibre ve Poppins dosyalarını node_modules'tan www/lib içine kopyalar,
// böylece uygulama bu kütüphaneleri internetten indirmeden açılır.
import { cpSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const nm = join(root, 'node_modules');
const out = join(root, 'www', 'lib');

if (!existsSync(nm)) {
  console.log('node_modules yok, önce "npm install" çalıştırın.');
  process.exit(0);
}

mkdirSync(join(out, 'leaflet'), { recursive: true });
for (const f of ['leaflet.js', 'leaflet.css', 'images']) {
  cpSync(join(nm, 'leaflet', 'dist', f), join(out, 'leaflet', f), { recursive: true });
}
cpSync(join(nm, 'papaparse', 'papaparse.min.js'), join(out, 'papaparse.min.js'));
cpSync(join(nm, 'jszip', 'dist', 'jszip.min.js'), join(out, 'jszip.min.js'));

// Sade vektör harita: MapLibre + Leaflet eklentisi
mkdirSync(join(out, 'maplibre'), { recursive: true });
for (const f of ['maplibre-gl.js', 'maplibre-gl.css']) {
  cpSync(join(nm, 'maplibre-gl', 'dist', f), join(out, 'maplibre', f));
}
const pluginDir = join(nm, '@maplibre', 'maplibre-gl-leaflet');
const pluginFile = readdirSync(pluginDir).find(f => /^leaflet-maplibre-gl.*\.js$/.test(f));
if (!pluginFile) throw new Error('maplibre-gl-leaflet eklenti dosyası bulunamadı');
cpSync(join(pluginDir, pluginFile), join(out, 'maplibre', 'leaflet-maplibre-gl.js'));

// Kapak yazısı için Poppins yazı tipi (Türkçe karakterler latin-ext dosyasında)
mkdirSync(join(out, 'fonts'), { recursive: true });
for (const w of ['400', '700']) for (const sub of ['latin', 'latin-ext']) {
  const f = `poppins-${sub}-${w}-normal.woff2`;
  const src = join(nm, '@fontsource', 'poppins', 'files', f);
  if (existsSync(src)) cpSync(src, join(out, 'fonts', f));
  else console.log('  (uyarı) yazı tipi dosyası bulunamadı: ' + f + ' — kapak yazısı sistem yazı tipiyle görünür');
}

console.log('✓ Kütüphaneler www/lib klasörüne kopyalandı.');
