// eBird tür listesini (Türkçe + İngilizce adlar; ayrıca ES/PT/DE/FR adları + familyalar) BİR KERE indirip uygulamanın içine gömer.
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

// [bilimsel ad, Türkçe ad, İngilizce ad, eBird kodu, familya kodu] – sıra eBird'ün sistematik sırası (Türler sekmesinde "familyaya göre" bu sırayı kullanır)
const rows = tr.map(x => [x.sciName, x.comName, enByCode.get(x.speciesCode) || x.comName, x.speciesCode, x.familyCode || '']);
// Familyalar: { familya kodu: { sci, tr, en, es, pt, de, fr } } → www/data/ebird-families.json (adı olmayan dilde uygulama İngilizceyi gösterir)
const FAM = {};
const famEkle = (liste, dil) => { for (const x of liste) if (x.familyCode) { const f = FAM[x.familyCode] = FAM[x.familyCode] || { sci: x.familySciName || '' }; if (x.familyComName && !f[dil]) f[dil] = x.familyComName; } };
famEkle(en, 'en'); famEkle(tr, 'tr');
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
    famEkle(liste, dil);
    // Çevirisi olmayan türlerde eBird İngilizce adı küçük harfle verebiliyor: büyük/küçük harf farkı çeviri sayılmaz.
    // Portekizce adlar küçük harfle yazılır (gaivota-de-...); listede ilk harf büyük gösterilir.
    for (const x of liste) { const e = enByCode.get(x.speciesCode) || ''; if (x.comName && x.comName.toLowerCase() !== e.toLowerCase()) m[x.sciName] = x.comName.charAt(0).toLocaleUpperCase(loc.replace('_', '-')) + x.comName.slice(1); }
    writeFileSync(join(outDir, `ebird-names-${dil}.json`), JSON.stringify(m));
    console.log(`✓ ${dil}: ${Object.keys(m).length} tür adı → www/data/ebird-names-${dil}.json`);
  } catch (e) { console.log(`(uyarı) ${dil} tür adları indirilemedi: ${e.message}`); }
}
// Aynı adı İngilizceyle tekrar yazma (dosya küçük kalsın)
for (const f of Object.values(FAM)) for (const d of ['tr', 'es', 'pt', 'de', 'fr']) if (f[d] && f[d] === f.en) delete f[d];
writeFileSync(join(outDir, 'ebird-families.json'), JSON.stringify({ source: 'eBird / Cornell Lab of Ornithology', downloaded: new Date().toISOString().slice(0, 10), families: FAM }));
console.log(`✓ ${Object.keys(FAM).length} familya → www/data/ebird-families.json (Türkçe adı olan: ${Object.values(FAM).filter(f => f.tr).length})`);
console.log(`✓ ${rows.length} takson kaydedildi (${trCount} tanesinin Türkçe adı var) → www/data/ebird-taxonomy.json`);
console.log('Şimdi: GitHub Desktop → Commit + Push (web sitesi bu dosyaları kullanır, kendisi indirmez) · telefon için npm run sync');
