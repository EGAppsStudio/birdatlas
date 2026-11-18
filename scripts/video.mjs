// Tanıtım videosu (KOMUTLAR 10): uygulamayı telefon boyutunda örnek veriyle açar, 7 kısa sahne kaydeder,
// sonra telefon çerçevesi + başlıklar + geçişler + Maviş'li açılış/kapanış + müzikle birleştirir.
//   çıktı : magaza/video/birdatlas-<dil>-yatay.mp4 (1920×1080; Play, YouTube, site)
//           magaza/video/birdatlas-<dil>-dikey.mp4 (1080×1920; Instagram Reels / hikâye)
//   müzik : magaza/video/muzik/ içindeki ilk ses dosyası (mp3/m4a/wav); yoksa sessiz
// Kullanım: npm run video                → İngilizce, kayıt + montaj
//           npm run video -- montaj      → kayıt yapmadan yalnız montaj (başlık/müzik değişince)
//           npm run video -- --sahne=paylas,mavis → yalnız bu sahneleri yeniden kaydet, sonra montaj
//           npm run video -- tr          → başka dil (o dilin başlıkları aşağıda yoksa İngilizce başlık)
// Sahne sırası, süreler ve başlıklar: aşağıdaki SAHNELER ve METIN. Ara dosyalar magaza/video/ham ve kare (depoya girmez).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { KOK, tarayici, sayfaAc, sifirla, oturt, bekle, EKRANLAR, sunucu as appSunucu } from './ekran-ortak.mjs';

const require = createRequire(import.meta.url);
const ARG = process.argv.slice(2);
const L = ARG.find(a => /^[a-z]{2}$/.test(a)) || 'en';
const YALNIZ_MONTAJ = ARG.includes('montaj');
const SECILI = ((ARG.find(a => a.startsWith('--sahne=')) || '').split('=')[1] || '').split(',').filter(Boolean);   // ör. --sahne=paylas,mavis: yalnız bunları yeniden kaydet
const FPS = 30, GECIS = 0.4;   // saniyede kare, sahne geçişi (sn)
const VD = path.join(KOK, 'magaza', 'video'), HAM = path.join(VD, 'ham'), KARE = path.join(VD, 'kare');

// ---------- sahneler: [ad, süre (sn), eylem] — eylem kayıt başlarken çalışır ----------
const hazirla = Object.fromEntries(EKRANLAR);
const SORU = { tr: "2026'daki en iyi günüm hangisiydi?", en: 'What was my best day in 2026?' };
const SAHNELER = [
  ['harita', 4.2, async (pg) => {
    await bekle(300);
    await pg.evaluate(() => mapObj.flyTo([39.86, 32.83], 9, { duration: 3.2 }));
  }],
  ['takvim', 3.8, async (pg) => {
    await bekle(300);
    await pg.evaluate(() => { openTab('obs'); setObsSub('calendar'); currentCalDate = new Date(2025, 7, 1); selectedDates.clear(); renderAll(); });
    await bekle(1200);
    await pg.evaluate(() => { selectedDates.add('2025-08-12'); lastClickedDay = '2025-08-12'; renderAll(); });
  }],
  ['kertik', 3.8, async (pg, L) => { await bekle(300); await hazirla.kertik(pg, L); }],
  ['foto', 3.4, async (pg, L) => { await bekle(300); await hazirla.foto(pg, L); }],
  ['paylas', 4.2, async (pg) => {
    await bekle(200);
    await pg.evaluate(() => { document.getElementById('ekran-ozel').textContent = '#share-overlay .sp-pick{max-height:86px!important;overflow:hidden!important}'; closeTabs(); openShare({ type: 'year' }); });
    await bekle(1300);   // kart hazırlanırken önizlemeye kay
    await pg.evaluate(() => { let w = document.getElementById('share-preview-wrap'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }],
  ['mavis', 5.2, async (pg, L) => {
    await bekle(200);
    await pg.evaluate(() => { closeTabs(); toggleChat(); });
    await bekle(500);
    await pg.evaluate(() => { let cw = document.getElementById('chat-window'), cm = document.getElementById('chat-messages'), mb = document.getElementById('menu-btn').getBoundingClientRect(); cm.style.setProperty('height', Math.round(parseFloat(getComputedStyle(cm).height) + cw.getBoundingClientRect().top - mb.bottom - 10) + 'px', 'important'); });
    const soru = SORU[L] || SORU.en;
    for (let i = 1; i <= soru.length; i++) { await pg.evaluate(s => { document.getElementById('chat-input').value = s; }, soru.slice(0, i)); await bekle(32); }
    await bekle(250);
    await pg.evaluate(() => sendChatMessage());
    await bekle(1700);
    await pg.evaluate(() => { let cm = document.getElementById('chat-messages'), b = [...cm.querySelectorAll('.chat-msg.chat-user')].pop(); if (b) cm.scrollTo({ top: b.offsetTop - 8, behavior: 'smooth' }); });
  }],
  ['kesfet', 3.8, async (pg, L) => { await bekle(300); await hazirla.kesfet(pg, L); }],
];
const ACILIS = 2.8, KAPANIS = 3.4;

// ---------- başlıklar ----------
const METIN = {
  en: {
    acilis: ['Bird Atlas', 'Your personal birding map'],
    harita: ['All your eBird sightings', 'on one map'],
    takvim: ['Tap a day,', 'relive it'],
    kertik: ['Every lifer,', 'a memory'],
    foto: ['Your own photos', 'on every species'],
    paylas: ['Beautiful cards', 'to share'],
    mavis: ['Ask Maviş', 'about your birds'],
    kesfet: ["What's around you", 'right now?'],
    kapanis: ['birdatlas.app', 'Android & web · free'],
  },
  tr: {
    acilis: ['Kuş Atlası', 'Kişisel kuş gözlem haritan'],
    harita: ['Tüm eBird gözlemlerin', 'tek haritada'],
    takvim: ['Bir güne dokun,', 'yeniden yaşa'],
    kertik: ['Her yeni tür', 'bir hatıra'],
    foto: ['Kendi fotoğrafların', 'her türde'],
    paylas: ['Paylaşmaya değer', 'kartlar'],
    mavis: ["Maviş'e sor,", 'verilerin konuşsun'],
    kesfet: ['Çevrende şu an', 'neler var?'],
    kapanis: ['birdatlas.app', 'Android ve web · ücretsiz'],
  },
};
const M = METIN[L] || METIN.en;

// ---------- 1) kayıt: sahneler ekran yayınıyla (CDP screencast) kaydedilir, 30 kare/sn'ye çevrilir ----------
async function kaydet(pg, ad, sure, eylem) {
  const d = path.join(HAM, ad); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
  const cdp = await pg.context().newCDPSession(pg), kareler = [];
  cdp.on('Page.screencastFrame', f => { kareler.push({ t: f.metadata.timestamp, b: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
  await bekle(400);
  const bas = kareler.length ? kareler[kareler.length - 1].t : Date.now() / 1000;
  const is = eylem(pg, L).catch(e => console.log(`\n  ! ${ad}: ${e.message}`));
  await bekle(sure * 1000 + 300);
  await is;
  await cdp.send('Page.stopScreencast').catch(() => {}); await cdp.detach().catch(() => {});
  let j = 0;
  for (let i = 0; i < Math.round(sure * FPS); i++) {
    const t = bas + i / FPS;
    while (j + 1 < kareler.length && kareler[j + 1].t <= t) j++;
    fs.writeFileSync(path.join(d, String(i + 1).padStart(5, '0') + '.jpg'), Buffer.from(kareler[j].b, 'base64'));
  }
  return kareler.length;
}

if (!YALNIZ_MONTAJ) {
  console.log(`\n🎬 Tanıtım videosu · ${L} · 1/2 kayıt`);
  const b = await tarayici();
  const { ctx, pg } = await sayfaAc(b, L, 2);
  await pg.evaluate(() => { try { localStorage.setItem('ai_provider', 'gemini'); } catch (e) {} });
  for (const [ad, sure, eylem] of SAHNELER) {
    if (SECILI.length && !SECILI.includes(ad)) continue;
    process.stdout.write(`• ${ad} `);
    await sifirla(pg); await oturt(pg, 800);
    const n = await kaydet(pg, ad, sure, eylem);
    console.log(`✓ (${n} kare)`);
  }
  await ctx.close(); await b.close();
}
appSunucu.closeAllConnections(); appSunucu.close();

// ---------- 2) montaj: HTML sahne kare kare çizilir (yatay + dikey), ffmpeg ile mp4 ----------
for (const [ad, sure] of SAHNELER) if (!fs.existsSync(path.join(HAM, ad, '00001.jpg'))) { console.log(`\n  ! ${ad} kaydı yok: önce kayıtla birlikte çalıştır (npm run video)`); process.exit(1); }
const index = fs.readFileSync(path.join(KOK, 'www', 'index.html'), 'utf8');
const mavisJs = index.slice(index.indexOf('        const MAVIS_P ='), index.indexOf('        // ===== /Maviş ====='));
const mavisCss = index.slice(index.indexOf('/* ===== Maviş animasyonları ===== */'), index.indexOf('@media (prefers-reduced-motion: reduce) { .mavis'));
function poppinsCss() {
  const d = path.join(KOK, 'node_modules', '@fontsource', 'poppins'); let css = '';
  for (const f of ['400.css', '500.css', '700.css']) { const p = path.join(d, f); if (fs.existsSync(p)) css += fs.readFileSync(p, 'utf8').replace(/font-family:\s*'[^']+'/g, 'font-family: P').replace(/url\(\.\/files\//g, 'url(/node_modules/@fontsource/poppins/files/'); }
  if (!css && process.env.POPPINS_DIR) css = `@font-face{font-family:P;src:url('/__poppins/Poppins-Bold.ttf');font-weight:700}@font-face{font-family:P;src:url('/__poppins/Poppins-Regular.ttf');font-weight:400}`;
  return css;
}
const SAHNE = SAHNELER.map(([ad, sure]) => ({ ad, sure, n: Math.round(sure * FPS), m: M[ad] }));
const TOPLAM = ACILIS + SAHNE.reduce((a, s) => a + s.sure, 0) - GECIS * (SAHNE.length - 1) + KAPANIS - GECIS;

const sahneHtml = (W, H) => {
  const yatay = W > H;
  // telefon: yatayda sağda, dikeyde altta; başlık yatayda solda, dikeyde üstte
  const ph = yatay ? { h: 960, x: 1180, y: 60 } : { h: 1420, x: (W - 1420 / 1.94) / 2, y: 420 };
  const pw = ph.h / 1.94;
  return `<html><head><meta charset="utf-8"><style>${poppinsCss()}
  ${mavisCss}
  body{margin:0;width:${W}px;height:${H}px;overflow:hidden;font-family:P,'Segoe UI',sans-serif;position:relative;background:#F4F7FB}
  .bg{position:absolute;inset:0;background:linear-gradient(${yatay ? '120deg' : '180deg'},#F8FAFD 0%,#EEF3FA 45%,#E3ECF8 100%)}
  .glow{position:absolute;border-radius:50%}
  .g1{background:radial-gradient(circle,rgba(233,196,64,.22) 0%,rgba(233,196,64,0) 70%)} .g2{background:radial-gradient(circle,rgba(46,98,181,.15) 0%,rgba(46,98,181,0) 70%)}
  #tel{position:absolute;left:${ph.x}px;top:${ph.y}px;width:${pw}px;height:${ph.h}px;border-radius:${pw * .1}px;background:#1B1E24;padding:${pw * .025}px;box-sizing:border-box;box-shadow:0 40px 90px rgba(10,40,80,.30),0 0 0 3px #3a3f48 inset}
  #ekr{position:relative;width:100%;height:100%;border-radius:${pw * .075}px;overflow:hidden;background:#fff}
  #ekr img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
  #cap{position:absolute;${yatay ? 'left:130px;top:0;bottom:0;width:900px;display:flex;flex-direction:column;justify-content:center' : 'left:70px;right:70px;top:120px;text-align:center'}}
  h1{margin:0;font-weight:700;color:#1C3A6B;letter-spacing:-1.5px;font-size:${yatay ? 92 : 88}px;line-height:1.08}
  h1 span{color:#2E62B5}
  .dots{margin:${yatay ? '30px 0 0' : '26px auto 0'}}
  #kap,#ac{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  #ac h1,#kap h1{font-size:${yatay ? 120 : 130}px} #ac h2,#kap h2{margin:18px 0 0;font-weight:400;color:#4A5B70;font-size:${yatay ? 46 : 52}px}
  .mvk{margin-bottom:10px}
  </style></head><body><div class="bg"></div>
  <div class="glow g1" style="width:1100px;height:1100px;left:-420px;top:${yatay ? 300 : 1100}px"></div><div class="glow g2" style="width:1200px;height:1200px;right:-480px;top:${yatay ? -500 : 300}px"></div>
  <div id="sah"><div id="tel"><div id="ekr"><img id="i1"><img id="i2"></div></div><div id="cap"><h1 id="h"></h1><div class="dots"><svg width="72" height="14"><circle cx="11" cy="7" r="6" fill="#2E62B5"/><circle cx="36" cy="7" r="6" fill="#E9C440"/><circle cx="61" cy="7" r="6" fill="#1C3A6B"/></svg></div></div></div>
  <div id="ac"><div class="mvk" id="mv1"></div><h1>${M.acilis[0].replace(/ (\S+)$/, ' <span>$1</span>')}</h1><h2>${M.acilis[1]}</h2></div>
  <div id="kap"><div class="mvk" id="mv2"></div><h1>${M.kapanis[0]}</h1><h2>${M.kapanis[1]}</h2></div>
  <script>${mavisJs}
  const S = ${JSON.stringify(SAHNE)}, ACILIS = ${ACILIS}, KAPANIS = ${KAPANIS}, G = ${GECIS}, FPS = ${FPS};
  document.getElementById('mv1').innerHTML = mavisSVG(${yatay ? 360 : 460}, 'look', k => '/www/img/mavis/' + k + '.webp');
  document.getElementById('mv2').innerHTML = mavisSVG(${yatay ? 360 : 460}, 'wave', k => '/www/img/mavis/' + k + '.webp');
  const $ = id => document.getElementById(id), ease = x => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
  const kare = (s, t) => '/magaza/video/ham/' + s.ad + '/' + String(Math.min(s.n, Math.max(1, Math.floor(t * FPS) + 1))).padStart(5, '0') + '.jpg';
  async function yukle(img, src) { if (img.getAttribute('src') !== src) { img.src = src; await img.decode().catch(() => {}); } }
  function mvZaman(el, ms) { el.querySelectorAll('svg.mavis').forEach(s => s.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = ms; })); }
  window.ciz = async (t) => {
    // sahne zaman çizelgesi
    let bas = ACILIS - G, i = -1, yerel = 0;
    for (let k = 0; k < S.length; k++) { if (t >= bas) { i = k; yerel = t - bas; } bas += S[k].sure - G; }
    const kapBas = bas;   // son sahne bitimi - G
    const acA = 1 - ease((t - (ACILIS - G)) / G), kapA = ease((t - kapBas) / G);
    $('ac').style.opacity = acA; $('kap').style.opacity = kapA; $('sah').style.opacity = Math.min(1 - acA, 1 - kapA) < 0 ? 0 : Math.min(1 - acA, 1 - kapA);
    $('ac').style.transform = 'translateY(' + (-(1 - acA) * 40) + 'px)'; $('kap').style.transform = 'translateY(' + ((1 - kapA) * 40) + 'px)';
    mvZaman($('ac'), t * 1000); mvZaman($('kap'), Math.max(0, t - kapBas) * 1000);
    if (i >= 0) {
      const s = S[i], gecis = i > 0 && yerel < G;
      await yukle($('i2'), kare(s, yerel));
      if (gecis) { await yukle($('i1'), kare(S[i - 1], S[i - 1].sure - G + yerel)); $('i2').style.opacity = ease(yerel / G); }
      else $('i2').style.opacity = 1;
      $('h').innerHTML = s.m[0] + '<br><span>' + s.m[1] + '</span>';
      const a = ease(yerel / 0.6);
      $('cap').style.opacity = a; $('cap').style.transform = 'translate' + (${yatay} ? 'X(' + (1 - a) * -50 : 'Y(' + (1 - a) * -30) + 'px)';
      const z = 1 + 0.02 * Math.min(1, yerel / s.sure);   // telefon hafifçe yaklaşır
      $('tel').style.transform = 'scale(' + z + ')';
    }
  };
  </script></body></html>`;
};

let SAYFA = '';
const TIP = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/__sahne') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(SAYFA); }
  const dosya = u.startsWith('/__poppins/') ? path.join(process.env.POPPINS_DIR || '', path.basename(u)) : path.join(KOK, u);
  if ((!dosya.startsWith(KOK) && !u.startsWith('/__poppins/')) || !fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TIP[path.extname(dosya)] || 'application/octet-stream' }); fs.createReadStream(dosya).pipe(r);
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const ADRES = `http://127.0.0.1:${srv.address().port}`;

let FFMPEG = 'ffmpeg'; try { FFMPEG = require('ffmpeg-static') || 'ffmpeg'; } catch (e) {}
const md = path.join(VD, 'muzik'), muzik = fs.existsSync(md) && fs.readdirSync(md).filter(f => /\.(mp3|m4a|wav|ogg|aac)$/i.test(f)).sort()[0];
console.log(`\n🎬 2/2 montaj · ${TOPLAM.toFixed(1)} sn · müzik: ${muzik || 'yok (sessiz)'}`);
const b2 = await tarayici();
for (const [tur, W, H] of [['yatay', 1920, 1080], ['dikey', 1080, 1920]]) {
  SAYFA = sahneHtml(W, H);
  fs.rmSync(KARE, { recursive: true, force: true }); fs.mkdirSync(KARE, { recursive: true });
  const pg = await b2.newPage({ viewport: { width: W, height: H } });
  await pg.goto(ADRES + '/__sahne'); await pg.evaluate(() => document.fonts.ready); await bekle(500);
  const N = Math.round(TOPLAM * FPS);
  process.stdout.write(`• ${tur} (${W}×${H}) `);
  for (let i = 0; i < N; i++) {
    await pg.evaluate(t => window.ciz(t), i / FPS);
    await pg.screenshot({ path: path.join(KARE, String(i + 1).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (i % FPS === 0) process.stdout.write('.');
  }
  await pg.close();
  const out = path.join(VD, `birdatlas-${L}-${tur}.mp4`);
  const a = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(KARE, '%05d.jpg')];
  if (muzik) a.push('-i', path.join(md, muzik), '-filter_complex', `[1:a]atrim=0:${TOPLAM.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:d=0.6,afade=t=out:st=${(TOPLAM - 2.2).toFixed(2)}:d=2.2,volume=0.85[a]`, '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '160k');
  a.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', TOPLAM.toFixed(2), out);
  execFileSync(FFMPEG, a, { stdio: 'inherit' });
  console.log(` ✓ ${path.relative(KOK, out)} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
}
await b2.close(); srv.closeAllConnections(); srv.close();
fs.rmSync(KARE, { recursive: true, force: true });
console.log('\n✅ Video hazır: magaza/video/. Commit → Push (Claude baksın); yatay olanı YouTube\'a "Liste dışı" yükle.\n');
