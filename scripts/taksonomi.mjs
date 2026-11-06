// eBird tür listesini (Türkçe + İngilizce adlar) BİR KERE indirip uygulamanın içine gömer.
// Kullanım:  npm run taksonomi -- EBIRD_API_ANAHTARIN
// Anahtar yalnızca bu indirme için kullanılır; uygulamanın içine yazılmaz.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const key = (process.argv[2] || process.env.EBIRD_API_KEY || '').trim();
if (!key) {
  console.log('\nKullanım:  npm run taksonomi -- EBIRD_API_ANAHTARIN\n(Anahtar almak için: https://ebird.org/api/keygen)\n');
  process.exit(1);
}

async function get(locale) {
  const res = await fetch(`https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=${locale}`, {
    headers: { 'X-eBirdApiToken': key }
  });
  if (!res.ok) throw new Error(`eBird ${res.status} hatası verdi (${locale}). Anahtarı kontrol et.`);
  return res.json();
}

console.log('eBird tür listesi indiriliyor (Türkçe + İngilizce)...');
const [tr, en] = await Promise.all([get('tr'), get('en')]);
const enByCode = new Map(en.map(x => [x.speciesCode, x.comName]));

// [bilimsel ad, Türkçe ad, İngilizce ad, eBird kodu]
const rows = tr.map(x => [x.sciName, x.comName, enByCode.get(x.speciesCode) || x.comName, x.speciesCode]);
const trCount = tr.filter(x => x.comName !== enByCode.get(x.speciesCode)).length;

const outDir = join(process.cwd(), 'www', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'ebird-taxonomy.json'),
  JSON.stringify({ source: 'eBird / Cornell Lab of Ornithology', downloaded: new Date().toISOString().slice(0, 10), rows }));

console.log(`✓ ${rows.length} takson kaydedildi (${trCount} tanesinin Türkçe adı var) → www/data/ebird-taxonomy.json`);
console.log('Şimdi:  npm run sync   ve Android Studio\'da ▶');
