// Uygulama çevirileri (ES, PT, DE, FR) için yardımcı.
// Uygulama Türkçe + İngilizce yazılır: LT('türkçe', 'english'), I18N_EXACT, I18N_RULES, GUIDE.en, SUGGESTIONS.en.
// Diğer diller İngilizce metni anahtar olarak kullanır: www/i18n/<dil>.js  →  window.I18N_<DIL> = { "English": "çeviri", ... }
// Şablonlu metinlerde ${...} yerleri {0}, {1} … olur; çeviride de aynı numaralar kullanılır (yerleri değişebilir).
//
// Kullanım:
//   node scripts/ceviri.mjs kontrol        → her dilde eksik / artık anahtarları listeler
//   node scripts/ceviri.mjs cikar out.json → İngilizce anahtarların tam listesini (Türkçe karşılıklarıyla) yazar
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const HTML = fs.readFileSync(path.join(KOK, 'www', 'index.html'), 'utf8');
export const DILLER = ['es', 'pt', 'de', 'fr'];

// ---- Küçük JS okuyucu: tırnaklı / şablon metinleri ve ${...} içlerini doğru atlar ----
function readString(s, i) {            // s[i] tırnak: ' " `  →  { end, cooked, parts, exprs }
  const q = s[i]; let j = i + 1, cooked = '', parts = [], exprs = [];
  while (j < s.length) {
    const c = s[j];
    if (c === '\\') {
      const n = s[j + 1];
      const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
      if (n === 'u') {
        if (s[j + 2] === '{') { const k = s.indexOf('}', j); cooked += String.fromCodePoint(parseInt(s.slice(j + 3, k), 16)); j = k + 1; continue; }
        cooked += String.fromCharCode(parseInt(s.slice(j + 2, j + 6), 16)); j += 6; continue;
      }
      if (n === 'x') { cooked += String.fromCharCode(parseInt(s.slice(j + 2, j + 4), 16)); j += 4; continue; }
      if (n === '\n') { j += 2; continue; }
      cooked += map[n] !== undefined ? map[n] : n; j += 2; continue;
    }
    if (c === q) { parts.push(cooked); return { end: j + 1, cooked, parts, exprs }; }
    if (q === '`' && c === '$' && s[j + 1] === '{') {
      parts.push(cooked); cooked = '';
      const e = skipExpr(s, j + 2); exprs.push(s.slice(j + 2, e)); j = e + 1; continue;
    }
    cooked += c; j++;
  }
  throw new Error('Kapanmayan metin: ' + s.slice(i, i + 60));
}
function skipExpr(s, i) {             // ${ sonrasından eşleşen } konumuna
  let d = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\'' || c === '"' || c === '`') { i = readString(s, i).end; continue; }
    if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); continue; }
    if (c === '{') d++;
    if (c === '}') { if (d === 0) return i; d--; }
    i++;
  }
  throw new Error('Kapanmayan ${');
}
function skipWs(s, i) { while (/\s/.test(s[i])) i++; return i; }
// Metin argümanı → { key, tr? } ; key: ${…} yerleri {0},{1}…
function argAt(s, i) {
  i = skipWs(s, i);
  if (!/['"`]/.test(s[i])) return null;
  const r = readString(s, i);
  let key = r.parts.map((p, k) => p + (k < r.exprs.length ? `{${k}}` : '')).join('');
  return { end: r.end, key, n: r.exprs.length, exprs: r.exprs };
}
// ${…} içindeki iç içe metinler (ör. `<b>${n}</b> more`) de anahtar olsun
function icMetinler(exprs, add) {
  for (const e of exprs || []) {
    for (let i = 0; i < e.length; i++) {
      const c = e[i];
      if (c === '\'' || c === '"' || c === '`') {
        try { const r = argAt(e, i); if (r) { if (/[A-Za-z]{2}/.test(r.key.replace(/\{\d+\}/g, '')) && !/^[a-z_]+$/.test(r.key) ) add(r.key, '', 'LTi'); icMetinler(r.exprs, add); i = r.end - 1; } } catch (x) {}
      }
    }
  }
}

export function cikar() {
  const out = new Map();             // key → { tr, src }
  const add = (key, tr, src) => { if (!key || !/[A-Za-z]/.test(key.replace(/\{\d+\}/g, ''))) return; if (!out.has(key)) out.set(key, { tr: tr || '', src }); };
  // 1) LT('tr', 'en')
  let re = /\bLT\(/g, m;
  while ((m = re.exec(HTML))) {
    try {
      const a = argAt(HTML, m.index + 3); if (!a) continue;
      let j = skipWs(HTML, a.end); if (HTML[j] !== ',') continue;
      const b = argAt(HTML, j + 1);
      if (b && HTML[skipWs(HTML, b.end)] === ')') { add(b.key, a.key, 'LT'); icMetinler(b.exprs, add); continue; }
      // İngilizce taraf bir ifade (ör. n === 1 ? 'day' : 'days'): içindeki tüm metinler anahtar olur
      let k = j + 1, d = 0;
      for (; k < HTML.length; k++) {
        const c = HTML[k];
        if (c === '\'' || c === '"' || c === '`') { const r = argAt(HTML, k); if (r) add(r.key, '', 'LTx'); k = r.end - 1; continue; }
        if (c === '(' || c === '[' || c === '{') d++;
        if (c === ')' || c === ']' || c === '}') { if (d === 0) break; d--; }
      }
    } catch (e) {}
  }
  // 2) I18N_EXACT değerleri
  const ex = HTML.slice(HTML.indexOf('const I18N_EXACT = {'), HTML.indexOf('const I18N_RULES'));
  for (let i = 0; i < ex.length; i++) {
    if (ex[i] === '"' || ex[i] === '\'') {
      const k = readString(ex, i); let j = skipWs(ex, k.end);
      if (ex[j] === ':') { const v = argAt(ex, j + 1); add(v.key, k.cooked, 'EXACT'); i = v.end; } else i = k.end;
    }
  }
  // 3) I18N_RULES İngilizce kalıpları ($1 → {0})
  const ru = HTML.slice(HTML.indexOf('const I18N_RULES'), HTML.indexOf('function tx(str)'));
  for (const mm of ru.matchAll(/\],?\s*'([^']*)'\]/g)) add(mm[1].replace(/\$(\d)/g, (_, d) => `{${d - 1}}`), '', 'RULE');
  for (const mm of ru.matchAll(/, '([^']*\$\d[^']*)'\]/g)) add(mm[1].replace(/\$(\d)/g, (_, d) => `{${d - 1}}`), '', 'RULE');
  // 4) GUIDE.en ve SUGGESTIONS.en içindeki tüm metinler
  for (const [bas, son] of [['const GUIDE = {', '// ===== /Kılavuz'], ['const SUGGESTIONS = {', 'function pickSuggestions']]) {
    let blk = HTML.slice(HTML.indexOf(bas)); blk = blk.slice(0, blk.indexOf(son) > 0 ? blk.indexOf(son) : 60000);
    const enAt = blk.search(/\n\s*en: [\[{]/); if (enAt < 0) continue;
    let e = blk.slice(enAt);
    // en bloğunun sonu: aynı girinti düzeyinde kapanan }; ya da }
    let i = e.indexOf(':') + 1, d = 0, start = i;
    for (; i < e.length; i++) {
      const c = e[i];
      if (c === '\'' || c === '"' || c === '`') { const r = readString(e, i); add(r.parts.map((p, k) => p + (k < r.exprs.length ? `{${k}}` : '')).join(''), '', bas.includes('GUIDE') ? 'GUIDE' : 'SUGG'); i = r.end - 1; continue; }
      if (c === '[' || c === '{') d++;
      if (c === ']' || c === '}') { d--; if (d === 0) break; }
    }
  }
  // 5) Elle eklenen ek anahtarlar (koddaki İngilizce dizi/sabitler)
  for (const k of EK) add(k, '', 'EK');
  return out;
}
// Kodda LT dışında kalan İngilizce metinler
const EK = [];

export function yukleDil(l) {
  const f = path.join(KOK, 'www', 'i18n', `${l}.js`);
  if (!fs.existsSync(f)) return {};
  const t = fs.readFileSync(f, 'utf8');
  return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
}

if (process.argv[1] && process.argv[1].endsWith('ceviri.mjs')) {
  const cmd = process.argv[2];
  const keys = cikar();
  if (cmd === 'cikar') {
    const o = process.argv[3] || 'ceviri-anahtarlar.json';
    fs.writeFileSync(o, JSON.stringify([...keys].map(([k, v]) => ({ en: k, tr: v.tr, src: v.src })), null, 1));
    console.log(`${keys.size} anahtar → ${o}`);
  } else {
    console.log(`İngilizce anahtar: ${keys.size}`);
    let sorun = 0;
    for (const l of DILLER) {
      const d = yukleDil(l);
      const eksik = [...keys.keys()].filter(k => !(k in d));
      const artik = Object.keys(d).filter(k => !keys.has(k));
      const yer = Object.entries(d).filter(([k, v]) => { const a = (k.match(/\{\d+\}/g) || []).sort().join(), b = (String(v).match(/\{\d+\}/g) || []).sort().join(); return a !== b; });
      console.log(`${l}: ${Object.keys(d).length} çeviri · eksik ${eksik.length} · artık ${artik.length} · yer tutucu uyumsuz ${yer.length}`);
      if (process.argv.includes('-v')) { eksik.forEach(k => console.log('   - ' + k.slice(0, 100))); yer.forEach(([k]) => console.log('   ! ' + k.slice(0, 100))); }
      sorun += eksik.length + yer.length;
    }
    process.exitCode = sorun ? 1 : 0;
  }
}
