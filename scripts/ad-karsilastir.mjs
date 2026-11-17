// Tür adları: eBird ile Wikidata'yı karşılaştırır (deneme; uygulamaya dokunmaz).
// eBird tarafı: bilgisayardaki www/data/ebird-taxonomy.json + ebird-names-<dil>.json (KOMUTLAR 7 ile indirilmiş olmalı).
// Wikidata tarafı: query.wikidata.org (anahtar gerekmez, veri CC0). Eşleştirme eBird koduyla (Wikidata P3444).
// Çıktı: rapor/ad-karsilastirma.md  → Commit + Push, Claude okusun.
// Kullanım: npm run ad-karsilastir
import fs from 'node:fs';
import path from 'node:path';

const KOK = process.cwd(), VERI = path.join(KOK, 'www', 'data');
const TAX = path.join(VERI, 'ebird-taxonomy.json');
if (!fs.existsSync(TAX)) { console.log('www/data/ebird-taxonomy.json yok: önce KOMUTLAR 7 (tür adları).'); process.exit(1); }

// ---------- eBird ----------
const { rows, downloaded } = JSON.parse(fs.readFileSync(TAX, 'utf8'));   // [bilimsel, tr, en, kod]
// yalnız "tür" düzeyi: iki kelimeli bilimsel ad (alt tür, melez, "sp.", "/" gruplar hariç)
const turMu = s => /^[A-Z][a-z-]+ [a-z-]+$/.test(s) && !/ sp$/.test(s);
const EB = new Map();   // kod → { sci, en, tr, es, pt, de, fr }
for (const [sci, tr, en, kod] of rows) if (turMu(sci)) EB.set(kod, { sci, en, tr: tr && tr !== en ? tr : '' });
const bySci = new Map([...EB.values()].map(v => [v.sci, v]));
for (const d of ['es', 'pt', 'de', 'fr']) {
  const f = path.join(VERI, `ebird-names-${d}.json`);
  if (!fs.existsSync(f)) { console.log(`(uyarı) ${f} yok`); continue; }
  for (const [sci, ad] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) { const v = bySci.get(sci); if (v) v[d] = ad; }
}
console.log(`eBird: ${EB.size} tür (indirme tarihi ${downloaded || '?'})`);

// ---------- Wikidata ----------
const UA = 'BirdAtlas/1.14 (https://birdatlas.app; egapps.support@gmail.com) ad-karsilastir';
async function sparql(q) {
  for (let deneme = 1; deneme <= 3; deneme++) {
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
    if (r.ok) return (await r.json()).results.bindings;
    console.log(`  Wikidata ${r.status}, ${deneme}. deneme; 10 sn sonra tekrar`);
    await new Promise(ok => setTimeout(ok, 10000));
  }
  throw new Error('Wikidata cevap vermedi');
}
const WD = new Map();   // kod → { sci, ad: { dil: { label, ortak } } }
const al = k => { if (!WD.has(k)) WD.set(k, { sci: '', ad: {} }); return WD.get(k); };
process.stdout.write('Wikidata: bilimsel adlar… ');
for (const b of await sparql('SELECT ?kod ?sci WHERE { ?i wdt:P3444 ?kod . OPTIONAL { ?i wdt:P225 ?sci } }')) { const w = al(b.kod.value); if (b.sci) w.sci = b.sci.value; }
console.log(WD.size + ' kayıt');
const WDIL = { en: ['en'], tr: ['tr'], es: ['es'], pt: ['pt-br', 'pt'], de: ['de'], fr: ['fr'] };
for (const [d, langs] of Object.entries(WDIL)) {
  process.stdout.write(`Wikidata: ${d}… `);
  const filtre = `FILTER(LANG(?ad) IN (${langs.map(l => `"${l}"`).join(',')}))`;
  // etiket (label) ve "taksonun yaygın adı" (P1843) ayrı ayrı
  const lab = await sparql(`SELECT ?kod ?ad WHERE { ?i wdt:P3444 ?kod ; rdfs:label ?ad . ${filtre} }`);
  const ort = await sparql(`SELECT ?kod ?ad WHERE { ?i wdt:P3444 ?kod ; wdt:P1843 ?ad . ${filtre} }`);
  const koy = (liste, alan) => liste.forEach(b => {
    const w = al(b.kod.value), dl = b.ad['xml:lang'], x = (w.ad[d] = w.ad[d] || {});
    if (!x[alan] || (dl === langs[0] && x[alan + 'Dil'] !== langs[0])) { x[alan] = b.ad.value; x[alan + 'Dil'] = dl; }
  });
  koy(lab, 'label'); koy(ort, 'ortak');
  console.log(`${lab.length} etiket, ${ort.length} yaygın ad`);
}
// Wikidata'daki yerel ad: önce yaygın ad (P1843), yoksa etiket; Latince adla aynıysa "ad yok" sayılır
function wdAd(kod, d) {
  const w = WD.get(kod); if (!w) return '';
  const x = w.ad[d] || {}, sci = (w.sci || EB.get(kod)?.sci || '').toLowerCase();
  for (const a of [x.ortak, x.label]) if (a && a.toLowerCase() !== sci) return a;
  return '';
}

// ---------- Karşılaştırma ----------
const norm = s => s.toLocaleLowerCase().normalize('NFC').replace(/[-‐\s]+/g, ' ').replace(/[’']/g, "'").trim();
const satir = [], ornek = {};
for (const d of ['en', 'tr', 'es', 'pt', 'de', 'fr']) {
  let e = 0, w = 0, iki = 0, ayni = 0, fark = 0, yE = 0, yW = 0; const F = [], YE = [], YW = [];
  for (const [kod, v] of EB) {
    const a = v[d] || '', b = wdAd(kod, d);
    if (a) e++; if (b) w++;
    if (a && b) { iki++; if (norm(a) === norm(b)) ayni++; else { fark++; F.push([v.sci, a, b]); } }
    else if (a) { yE++; YE.push([v.sci, a]); } else if (b) { yW++; YW.push([v.sci, b]); }
  }
  satir.push(`| ${d.toUpperCase()} | ${e} | ${w} | ${iki} | ${ayni} | ${fark} | ${yE} | ${yW} |`);
  const kar = A => A.sort(() => Math.random() - 0.5);
  ornek[d] = { F: kar(F).slice(0, 25), YE: kar(YE).slice(0, 15), YW: kar(YW).slice(0, 10) };
}
const eslesen = [...EB.keys()].filter(k => WD.has(k)).length;
let md = `# Tür adları: eBird ↔ Wikidata (${new Date().toISOString().slice(0, 10)})\n\n`;
md += `- eBird (Clements ${downloaded || ''}): **${EB.size}** tür (yalnız tür düzeyi)\n- Wikidata'da eBird kodu olan kayıt: **${WD.size}**; bunlardan bizim türlerle eşleşen: **${eslesen}** (%${(eslesen / EB.size * 100).toFixed(1)})\n`;
md += `- "Ad var" = Latince addan farklı bir yerel ad. Wikidata'da önce "yaygın ad" (P1843), yoksa etiket.\n- "Aynı" karşılaştırmasında büyük/küçük harf ve tire/boşluk farkı yok sayılır.\n\n`;
md += `| Dil | eBird'de adı olan | Wikidata'da adı olan | İkisinde de | Aynı | Farklı | Yalnız eBird'de | Yalnız Wikidata'da |\n|---|---|---|---|---|---|---|---|\n${satir.join('\n')}\n`;
for (const [d, o] of Object.entries(ornek)) {
  md += `\n## ${d.toUpperCase()}\n### Farklı yazılanlar (rastgele ${o.F.length})\n| Bilimsel | eBird | Wikidata |\n|---|---|---|\n${o.F.map(x => `| ${x.join(' | ')} |`).join('\n')}\n`;
  md += `### Wikidata'da adı olmayanlar (rastgele ${o.YE.length})\n${o.YE.map(x => `- ${x[0]} — eBird: ${x[1]}`).join('\n')}\n`;
  md += `### Yalnız Wikidata'da adı olanlar (rastgele ${o.YW.length})\n${o.YW.map(x => `- ${x[0]} — Wikidata: ${x[1]}`).join('\n')}\n`;
}
fs.mkdirSync(path.join(KOK, 'rapor'), { recursive: true });
fs.writeFileSync(path.join(KOK, 'rapor', 'ad-karsilastirma.md'), md);
console.log('\n' + satir.join('\n'));
console.log('\n✅ rapor/ad-karsilastirma.md yazıldı. GitHub Desktop → Commit → Push; Claude okusun.\n');
