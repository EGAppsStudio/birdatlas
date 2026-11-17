// eBird tür listesini (Türkçe + İngilizce adlar; ayrıca ES/PT/DE/FR adları) BİR KERE indirip uygulamanın içine gömer.
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

// Ek diller (ES, PT, DE, FR): yalnız İngilizceden farklı adlar → www/data/ebird-names-<dil>.json  { bilimsel ad: ad }
const EK = { es: 'es', pt: 'pt_BR', de: 'de', fr: 'fr' };
for (const [dil, loc] of Object.entries(EK)) {
  try {
    const liste = await get(loc), m = {};
    // Çevirisi olmayan türlerde eBird İngilizce adı küçük harfle verebiliyor: büyük/küçük harf farkı çeviri sayılmaz.
    // Portekizce adlar küçük harfle yazılır (gaivota-de-...); listede ilk harf büyük gösterilir.
    for (const x of liste) { const e = enByCode.get(x.speciesCode) || ''; if (x.comName && x.comName.toLowerCase() !== e.toLowerCase()) m[x.sciName] = x.comName.charAt(0).toLocaleUpperCase(loc.replace('_', '-')) + x.comName.slice(1); }
    writeFileSync(join(outDir, `ebird-names-${dil}.json`), JSON.stringify(m));
    console.log(`✓ ${dil}: ${Object.keys(m).length} tür adı → www/data/ebird-names-${dil}.json`);
  } catch (e) { console.log(`(uyarı) ${dil} tür adları indirilemedi: ${e.message}`); }
}
console.log(`✓ ${rows.length} takson kaydedildi (${trCount} tanesinin Türkçe adı var) → www/data/ebird-taxonomy.json`);
console.log('Şimdi: GitHub Desktop → Commit + Push (web sitesi bu dosyaları kullanır, kendisi indirmez) · telefon için npm run sync');
