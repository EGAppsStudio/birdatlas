// Tür fotoğraflarında otomatik ortalama (KOMUTLAR 13; Enes'in bilgisayarında BİR KEZ, sonra yeni tür adları gelince istenirse yeniden).
// Uygulamanın kullandığı Wikipedia fotoğrafını (aynı sorgu, 400 px) indirir, Edge içinde yapay zekâ modeliyle (COCO-SSD, "bird" sınıfı)
// kuşu bulur; kuş kare kırpmanın ortasına gelecek ve küçükse biraz yakınlaşacak şekilde ayarı hesaplar.
//   çıktı: www/data/foto-odak.json  { v, frames: { "Pica pica": [x, y, zoom, "Dosya_adı.jpg"], "Tür": null (kuş bulunamadı / fotoğraf yok) } }
// Uygulama bu ayarı varsayılan yapar (cihazda hesap yok); kullanıcı fotoğrafa dokunup elle ortalarsa onunki geçerli, çift dokunuş otomatiğe döndürür.
// Kaldığı yerden devam eder (Ctrl+C ile durdurulabilir). Bitince: Commit + Push.
// Kullanım: npm run foto-odak            → bütün türler (ilk sefer ~30-60 dk)
//           npm run foto-odak -- yeniden → hepsini baştan hesapla
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tarayici, sunucu, KOK } from './ekran-ortak.mjs';

const CIKTI = path.join(KOK, 'www', 'data', 'foto-odak.json');
const TAX = path.join(KOK, 'www', 'data', 'ebird-taxonomy.json');
const YENIDEN = process.argv.includes('yeniden');
const UA = 'BirdAtlas-photo-focus/1.0 (https://birdatlas.app; egapps.support@gmail.com)';

// uygulamadaki wikiFile() ile aynı: küçük resim adresinden dosya adı ("400px-" öneki atılır)
export const wikiFile = u => { try { return decodeURIComponent(String(u).split('?')[0].split('/').pop()).replace(/^\d+px-/, ''); } catch (e) { return ''; } };

// Kuşun kutusundan kare kırpma ayarı (uygulamadaki drawCover ile aynı hesap: s = max(w/iw, h/ih) * zoom, ox = (iw*s - w) * x)
export function ayarHesapla(iw, ih, [bx, by, bw, bh]) {
  const s0 = Math.max(1 / iw, 1 / ih);
  const boy = Math.max(bw, bh) * s0;                       // kuşun kare içindeki boyu (1 = karenin tamamı)
  const z = Math.max(1, Math.min(1.8, 0.62 / boy));        // küçükse yaklaş (en çok 1,8×)
  const s = s0 * z, SW = iw * s, SH = ih * s;
  const px = bx + bw / 2, py = by + bh * 0.45;             // biraz yukarısı: baş daha önemli
  const k = v => Math.round(Math.max(0, Math.min(1, v)) * 1000) / 1000;
  const x = SW > 1.001 ? k((px * s - 0.5) / (SW - 1)) : 0.5, y = SH > 1.001 ? k((py * s - 0.5) / (SH - 1)) : 0.5;
  return [x, y, Math.round(z * 100) / 100];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await calis();
else sunucu.close();

async function calis() {
  if (!fs.existsSync(TAX)) { console.log('www/data/ebird-taxonomy.json yok: önce KOMUTLAR 12.'); process.exit(1); }
  const turler = [...new Set(JSON.parse(fs.readFileSync(TAX, 'utf8')).rows.map(r => r[0]).filter(s => /^[A-Z][a-z]+ [a-z-]+$/.test(s)))];
  let eski = {}; try { eski = YENIDEN ? {} : (JSON.parse(fs.readFileSync(CIKTI, 'utf8')).frames || {}); } catch (e) {}
  const frames = { ...eski };
  const kalan = turler.filter(s => !(s in frames));
  console.log(`\n📷 Fotoğraf ortalama: ${turler.length} tür, ${turler.length - kalan.length} tanesi hazır, ${kalan.length} kaldı.`);
  if (!kalan.length) return bitir(frames);
  const kaydet = () => fs.writeFileSync(CIKTI, JSON.stringify({ v: 1, source: 'Wikipedia page images + COCO-SSD', updated: new Date().toISOString().slice(0, 10), frames }));

  const b = await tarayici({ gorunur: false });
  const pg = await (await b.newContext()).newPage();
  await pg.setContent(`<html><body><script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"></script><script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"></script></body></html>`, { waitUntil: 'load' });
  await pg.evaluate(async () => { window.M = await cocoSsd.load({ base: 'mobilenet_v2' }); });
  console.log('  Model hazır. (Durdurmak için Ctrl+C; sonra kaldığı yerden devam eder.)');

  const t0 = Date.now(); let n = 0, bulundu = 0;
  for (let i = 0; i < kalan.length; i += 50) {
    const grup = kalan.slice(i, i + 50), url = {};
    // Wikipedia: uygulamadaki toplu sorgunun aynısı (tür sayfasının fotoğrafı)
    for (let deneme = 0; deneme < 4; deneme++) {
      try {
        const r = await fetch('https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&redirects=1&prop=pageimages|pageprops&ppprop=disambiguation&pithumbsize=400&pilimit=50&titles=' + encodeURIComponent(grup.join('|')), { headers: { 'User-Agent': UA } });
        if (!r.ok) throw new Error('wiki ' + r.status);
        const q = (await r.json()).query || {}, norm = {}, redir = {}, pages = {};
        (q.normalized || []).forEach(x => { norm[x.from] = x.to; }); (q.redirects || []).forEach(x => { redir[x.from] = x.to; }); (q.pages || []).forEach(p => { pages[p.title] = p; });
        grup.forEach(t => { const nn = norm[t] || t, p = pages[redir[nn] || nn]; if (p && !p.missing && !(p.pageprops && 'disambiguation' in p.pageprops) && p.thumbnail) url[t] = p.thumbnail.source; });
        break;
      } catch (e) { await new Promise(r => setTimeout(r, 3000 * (deneme + 1))); }
    }
    // Kuşu bul (aynı anda 10 fotoğraf)
    for (let j = 0; j < grup.length; j += 10) {
      const parca = grup.slice(j, j + 10).filter(t => url[t]);
      const sonuc = await pg.evaluate(async list => Promise.all(list.map(u => new Promise(ok => {
        const im = new Image(); im.crossOrigin = 'anonymous';
        const t = setTimeout(() => ok(null), 20000);
        im.onload = async () => { clearTimeout(t); try { const p = (await M.detect(im, 10, 0.2)).filter(x => x.class === 'bird'); if (!p.length) return ok([im.naturalWidth, im.naturalHeight, null]); p.sort((a, b) => b.score * Math.sqrt(b.bbox[2] * b.bbox[3]) - a.score * Math.sqrt(a.bbox[2] * a.bbox[3])); ok([im.naturalWidth, im.naturalHeight, p[0].bbox]); } catch (e) { ok(null); } };
        im.onerror = () => { clearTimeout(t); ok(null); };
        im.src = u;
      }))), parca.map(t => url[t]));
      parca.forEach((t, k) => { const r = sonuc[k]; if (!r) return; frames[t] = r[2] ? [...ayarHesapla(r[0], r[1], r[2]), wikiFile(url[t])] : null; if (r[2]) bulundu++; });
    }
    grup.forEach(t => { if (!url[t]) frames[t] = null; });   // Wikipedia'da fotoğraf yok: uygulama başka yoldan bulursa ortada kalır
    n += grup.length; kaydet();
    const dk = (Date.now() - t0) / 60000, kal = dk / n * (kalan.length - n);
    process.stdout.write(`\r  ${n}/${kalan.length} · kuş bulundu: ${bulundu} · kalan ~${Math.ceil(kal)} dk   `);
  }
  await b.close();
  bitir(frames);
}
function bitir(frames) {
  const v = Object.values(frames), ok = v.filter(Array.isArray).length;
  console.log(`\n✓ ${ok} fotoğrafta kuş bulundu, ayar www/data/foto-odak.json dosyasında. Şimdi GitHub Desktop: Commit + Push.`);
  sunucu.close();
}
