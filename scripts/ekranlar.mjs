// Mağaza ekran görüntüleri: uygulamanın web sürümünü telefon boyutunda açar, örnek veriyle
// 10 ekranı 6 dilde çeker → magaza/ham-ekranlar/<dil>/ps_<dil>_01_harita.jpg … (60 görüntü).
// Claude bunlardan başlıklı, çerçeveli mağaza görsellerini (magaza/gorseller/<dil>/) hazırlar.
//
// Kullanım (KOMUTLAR.bat 9):   npm run ekranlar            → 6 dil
//                              npm run ekranlar -- de fr   → yalnız bu diller
// Başta Gemini ve eBird anahtarı sorulur (boş bırakılabilir); yalnız bu çekim için kullanılır, hiçbir yere yazılmaz.
// Tarayıcı indirilmez: bilgisayardaki Microsoft Edge (yoksa Chrome) görünmez modda kullanılır.
// Kişisel veri yok: uygulamanın kurgusal örnek verisi kullanılır.
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { createRequire } from 'node:module';

const KOK = process.cwd(), WWW = path.join(KOK, 'www'), CIKTI = path.join(KOK, 'magaza', 'ham-ekranlar');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { try { ({ chromium } = require('playwright')); } catch (e2) { console.log('playwright-core yok: önce KOMUTLAR 6 (npm install).'); process.exit(1); } }
if (!fs.existsSync(path.join(WWW, 'lib', 'leaflet'))) { console.log('www/lib yok: önce KOMUTLAR 6 (npm install).'); process.exit(1); }

const DILLER = process.argv.slice(2).filter(a => /^[a-z]{2}$/.test(a));
const LANGS = DILLER.length ? DILLER : ['tr', 'en', 'es', 'pt', 'de', 'fr'];
const LOCALE = { tr: 'tr-TR', en: 'en-US', es: 'es-ES', pt: 'pt-BR', de: 'de-DE', fr: 'fr-FR' };
const SORU = { tr: "2026'daki en iyi günüm hangisiydi?", en: 'What was my best day in 2026?', es: '¿Cuál fue mi mejor día en 2026?', pt: 'Qual foi meu melhor dia em 2026?', de: 'Was war mein bester Tag 2026?', fr: 'Quel a été mon meilleur jour en 2026 ?' };
const KESFET = { lat: 44.5136, lng: 28.6356, km: 30 };        // Köstence yakınları
const SAZ = 'Circus aeruginosus', SAZ_ML = '999000111';       // saz delicesi: eBird fotoğrafıymış gibi (sarı çerçeve)
const SAZ_FOTO = path.join(KOK, 'magaza', 'ekran-foto', 'saz-delicesi.jpg');

// ---------- Anahtarlar (yalnız bu çekimde, bellekte) ----------
let GEMINI = process.env.GEMINI_KEY || '', EBIRD = process.env.EBIRD_KEY || '';
// Hangi ekranlar: --ekran=9 ya da --ekran=8,9 (yoksa başta sorulur; Enter = hepsi)
let SECILI = ((process.argv.find(a => a.startsWith('--ekran=')) || '').split('=')[1] || '').split(',').map(Number).filter(Boolean);
if (process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (!SECILI.length) {
    console.log('\nEkranlar: 1 harita · 2 takvim · 3 grafik · 4 konumlar · 5 türler · 6 kertik · 7 foto · 8 paylaş · 9 Maviş · 10 Keşfet');
    SECILI = (await rl.question('  Hangileri çekilsin? (Enter = hepsi; ör. 9 ya da 8,9): ')).split(/[\s,]+/).map(Number).filter(Boolean);
    console.log(SECILI.length ? `    ✓ yalnız: ${SECILI.join(', ')}` : '    ✓ hepsi');
  }
  console.log('\nAnahtarlar yalnız bu çekim için kullanılır, hiçbir yere kaydedilmez. Boş bırakıp Enter: o ekran anahtarsız çekilir.');
  console.log('  (Yapıştırmak için pencereye farenin SAĞ tuşuyla tıkla, sonra Enter.)');
  GEMINI = (await rl.question('  Gemini anahtarı (Maviş cevabı için): ')).trim() || GEMINI;
  console.log(GEMINI ? `    ✓ alındı (${GEMINI.length} karakter, …${GEMINI.slice(-4)})` : '    – boş: Maviş kendisi cevaplayacak');
  EBIRD = (await rl.question('  eBird anahtarı (Keşfet için): ')).trim() || EBIRD;
  console.log(EBIRD ? `    ✓ alındı (${EBIRD.length} karakter, …${EBIRD.slice(-4)})` : '    – boş: Keşfet örnek listeyle çekilecek');
  rl.close();
}

// ---------- Android'deki yazı tipleri: Roboto + Noto Color Emoji ----------
// Uygulama 'Segoe UI' yazı tipini ister; Windows'ta bu var, Android'de yok (orada Roboto ve Noto emoji çıkar).
// Telefonla aynı görünsün diye 'Segoe UI' adını bu iki yazı tipine bağlarız.
const ONBELLEK = path.join(KOK, 'node_modules', '.ekranlar');
const EMOJI_TTF = process.env.EMOJI_TTF || path.join(ONBELLEK, 'NotoColorEmoji.ttf');
async function indir(url, hedef) {
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  await new Promise((ok, no) => {
    const al = (u) => https.get(u, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return al(r.headers.location);
      if (r.statusCode !== 200) return no(new Error('HTTP ' + r.statusCode));
      const f = fs.createWriteStream(hedef + '.tmp'); r.pipe(f); f.on('finish', () => { f.close(); fs.renameSync(hedef + '.tmp', hedef); ok(); });
    }).on('error', no);
    al(url);
  });
}
const EMOJI_ARALIK = 'U+00A9,U+00AE,U+200D,U+203C,U+2049,U+20E3,U+2122,U+2139,U+2194-21AA,U+231A-23FF,U+24C2,U+25AA-25FE,U+2600-27BF,U+2934-2935,U+2B05-2B55,U+3030,U+303D,U+3297,U+3299,U+FE0F,U+1F000-1FAFF,U+E0020-E007F';
function fontCss() {
  let css = '';
  const rob = path.join(KOK, 'node_modules', '@fontsource', 'roboto');
  for (const f of ['400.css', '500.css', '700.css']) {
    const p = path.join(rob, f); if (!fs.existsSync(p)) continue;
    css += fs.readFileSync(p, 'utf8').replace(/font-family:\s*'[^']+'/g, "font-family: 'Segoe UI'").replace(/url\(\.\/files\//g, 'url(/__font/roboto/files/');
  }
  // emoji: Android'in Noto Color Emoji'si (npm paketi @fontsource/noto-color-emoji); önce o, sonra Roboto tanımlanır,
  // ikisinde de olan karakterlerde (rakamlar vb.) sonra tanımlanan Roboto kazanır
  const emo = path.join(KOK, 'node_modules', '@fontsource', 'noto-color-emoji', '400.css');
  if (!fs.existsSync(EMOJI_TTF) && fs.existsSync(emo)) css = fs.readFileSync(emo, 'utf8').replace(/font-family:\s*'[^']+'/g, "font-family: 'Segoe UI'").replace(/url\(\.\/files\//g, 'url(/__font/noto-color-emoji/files/') + '\n' + css;
  if (fs.existsSync(EMOJI_TTF)) for (const w of [400, 700]) css += `\n@font-face{font-family:'Segoe UI';src:url(/__emoji.ttf) format('truetype');font-weight:${w};unicode-range:${EMOJI_ARALIK};}`;
  // Üstteki 4 sekmenin simgeleri: Windows'un görünmez tarayıcısı bunları çizmiyor; Android'deki (Noto) emojilerin resmini koyarız
  css += `\n#tabbar .tb b{font-size:0!important;height:21px;background:center/20px 20px no-repeat}`;
  for (const k of ['obs', 'lifer', 'explore', 'share']) css += `\n#tabbar .tb[data-tab="${k}"] b{background-image:url(/__emoji/${k}.png)}`;
  return css + `\n.fchip.sample{display:none!important}\n`;
}

// ---------- www/ klasörünü yerelde sun ----------
const TIP = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.csv': 'text/csv', '.webmanifest': 'application/manifest+json' };
const sunucu = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]), dosya;
  if (u === '/__emoji.ttf') dosya = EMOJI_TTF;
  else if (u.startsWith('/__emoji/')) dosya = path.join(KOK, 'magaza', 'ekran-foto', 'emoji', path.basename(u));
  else if (u.startsWith('/__font/')) dosya = path.join(KOK, 'node_modules', '@fontsource', u.slice(8));
  else dosya = path.join(WWW, u === '/' ? 'index.html' : u);
  if (!fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TIP[path.extname(dosya)] || 'application/octet-stream' });
  fs.createReadStream(dosya).pipe(r);
});
await new Promise(ok => sunucu.listen(0, '127.0.0.1', ok));
const ADRES = `http://127.0.0.1:${sunucu.address().port}/`;

const bekle = (ms) => new Promise(ok => setTimeout(ok, ms));
async function oturt(pg, ms = 1500) { await pg.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}); await bekle(ms); }

// Ekranlar arasında her şeyi kapat
async function sifirla(pg) {
  await pg.evaluate(() => {
    try { if (typeof closeShare === 'function') closeShare(); } catch (e) {}
    try { if (typeof closePhotoViewer === 'function') closePhotoViewer(); } catch (e) {}
    try { let c = document.getElementById('chat-window'); if (c && c.style.display === 'flex') toggleChat(); } catch (e) {}
    try { if (liferMode) toggleLiferMode(); } catch (e) {}
    try { let m = document.getElementById('mini-popup'); if (m) m.style.display = 'none'; } catch (e) {}
    try { mapObj.closePopup(); } catch (e) {}
    try { closeTabs(); } catch (e) {}
    try { selectedDates.clear(); selectedSpecies = null; selectedLocation = null; selectedProvince = null; expandedLocation = null; renderAll(); } catch (e) {}
    let s = document.getElementById('ekran-ozel'); if (s) s.textContent = '';
  });
  await bekle(600);
}
// Bir öğeyi kaydırılabilir kutusunda ekranın belli bir yüksekliğine getir (oran: 0 = üst, 1 = alt)
const KAYDIR = (el, oran) => {
  let p = el.parentElement;
  while (p && !(p.scrollHeight > p.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(p).overflowY))) p = p.parentElement;
  if (!p) return;
  let pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
  p.scrollTop += (er.top - pr.top) - pr.height * oran;
};

// ---------- Çekilecek ekranlar ----------
const EKRANLAR = [
  ['harita', async (pg) => {
    await pg.evaluate(() => { closeTabs(); mapObj.zoomIn(1, { animate: false }); mapObj.panBy([-70, 0], { animate: false }); });   // biraz sağa: Endülüs de girsin
  }],
  ['takvim', async (pg) => {
    await pg.evaluate(() => {
      openTab('obs'); setObsSub('calendar');
      currentCalDate = new Date(2025, 7, 1); selectedDates.clear(); selectedDates.add('2025-08-12'); lastClickedDay = '2025-08-12'; renderAll();
    });
  }],
  ['grafik', async (pg) => {
    await pg.evaluate((K) => {
      openTab('obs'); setObsSub('calendar');
      currentCalDate = new Date(2025, 7, 1); selectedDates.clear(); selectedDates.add('2025-08-12'); lastClickedDay = '2025-08-12'; renderAll();
      let sel = document.querySelector('#filter-panels .year-chart select');
      let v = sel && [...sel.options].find(o => o.value === '2025'); setChart('obs', 'year', v ? v.value : '2025');
      selChartBar('obs', 8);   // Eylül
    });
    await bekle(500);
    await pg.evaluate((KAYDIR) => { let c = document.querySelector('#filter-panels .year-chart'); if (c) eval('(' + KAYDIR + ')')(c, 0.07); }, KAYDIR.toString());
  }],
  ['konumlar', async (pg) => {
    await pg.evaluate(() => { openTab('obs'); setObsSub('locations'); });
    await bekle(700);
    await pg.evaluate(() => {
      let s = [...document.querySelectorAll('#location-list span[onclick*="showLocDays"]')].find(x => x.getAttribute('onclick').includes('Central Park'));
      if (s) s.click();
    });
  }],
  ['turler', async (pg) => {
    await pg.evaluate(() => { openTab('obs'); setObsSub('species'); speciesSortMode = 'loc'; renderSpecies(); });
    await bekle(700);
    await pg.evaluate((KAYDIR) => {
      let it = document.querySelector('#species-list .species-item[data-sci="Merops apiaster"]'); if (!it) return;
      eval('(' + KAYDIR + ')')(it, 0.12);
      setTimeout(() => { let s = it.querySelector('span[onclick^="showObsList"]'); if (s) s.click(); }, 400);
    }, KAYDIR.toString());
  }],
  ['kertik', async (pg) => {
    await pg.evaluate(() => { openTab('lifer'); if (!liferMode) toggleLiferMode(); });
    await bekle(1500);
    await pg.evaluate(() => {
      closeTabs();
      try { mapObj.stop(); } catch (e) {}
      let ll = L.latLng(-0.369728, 36.084359), sz = mapObj.getSize();
      mapObj.setView(ll, 11, { animate: false }); mapObj.panBy([sz.x / 2 - sz.x * 0.62, sz.y / 2 - sz.y * 0.74], { animate: false });
    });
    await bekle(1500);
    await pg.evaluate(() => {
      let hedef = null;
      markerLayerGroup.eachLayer(m => { let p = m.getPopup && m.getPopup(); if (!p || hedef) return; let c = p.getContent(); c = typeof c === 'function' ? c(m) : c; if (String(c).includes('Coracias caudatus')) hedef = m; });
      if (hedef) hedef.openPopup();
    });
    await bekle(1200);
    await pg.evaluate(() => {   // kutu üstteki filtre etiketlerinin altında kalmasın
      let p = document.querySelector('.leaflet-popup'), fb = document.getElementById('filter-bar'); if (!p) return;
      let alt = Math.max(fb && fb.offsetHeight ? fb.getBoundingClientRect().bottom : 0, document.getElementById('tabbar') ? document.getElementById('tabbar').getBoundingClientRect().bottom : 0) + 12;
      let ust = p.getBoundingClientRect().top;
      if (ust < alt) mapObj.panBy([0, ust - alt], { animate: false });
    });
  }],
  ['foto', async (pg) => {
    await pg.evaluate(([SAZ, N]) => {
      try { localStorage.setItem('ml_photos', '1'); } catch (e) {}
      ML_CANDS[SAZ] = [N]; mlOk[N] = 1; ML_PHOTOS[SAZ] = mlUrl(N); delete ML_PICK[SAZ]; applyMyPhoto(SAZ); renderAll();
      openTab('obs'); setObsSub('species'); openPhotoViewer(SAZ);
    }, [SAZ, SAZ_ML]);
  }],
  ['paylas', async (pg) => {
    await pg.evaluate(() => {
      document.getElementById('ekran-ozel').textContent = '#share-overlay .sp-pick{max-height:86px!important;overflow:hidden!important}';
      closeTabs(); openShare({ type: 'year' });
    });
    await bekle(1500);
    await pg.waitForFunction(() => { let b = document.getElementById('share-busy'); return !b || !b.offsetParent || getComputedStyle(b).display === 'none' || getComputedStyle(b).visibility === 'hidden' || getComputedStyle(b).opacity === '0'; }, null, { timeout: 30000 }).catch(() => {});
    await bekle(1500);
    await pg.evaluate((KAYDIR) => { let w = document.getElementById('share-preview-wrap'); if (w) eval('(' + KAYDIR + ')')(w, 0.5); }, KAYDIR.toString());
  }],
  ['mavis', async (pg, L) => {
    await pg.evaluate(() => { closeTabs(); toggleChat(); });
    await bekle(800);
    const buyut = () => pg.evaluate(() => {   // pencereyi yukarı doğru olabildiğince büyüt (sekmelerin hemen altına kadar)
      let cw = document.getElementById('chat-window'), cm = document.getElementById('chat-messages');
      // uygulamada sürükleyerek varılabilen en üst: ☰ düğmesinin hemen altı
      let ust = cw.getBoundingClientRect().top, mb = document.getElementById('menu-btn'), r = mb && mb.getBoundingClientRect();
      let hedef = r && r.height ? r.bottom + 10 : 150;
      cm.style.setProperty('height', Math.round(parseFloat(getComputedStyle(cm).height) + ust - hedef) + 'px', 'important');
    });
    await buyut(); await bekle(500); await buyut();
    if (GEMINI) {
      await pg.evaluate(([k, soru]) => { localStorage.setItem('ai_provider', 'gemini'); localStorage.setItem('ai_key_gemini', k); document.getElementById('chat-input').value = soru; sendChatMessage(); }, [GEMINI, SORU[L]]);
      await bekle(3000);
      // Gemini'nin cevabını bekle (yoğunsa birkaç kez dener; 4 dakikaya kadar)
      const geldi = await pg.waitForFunction(() => !document.querySelector('#chat-messages [id^="loading"]'), null, { timeout: 240000, polling: 1000 }).then(() => true).catch(() => false);
      if (!geldi) process.stdout.write('\n    ! Gemini 4 dakikada cevap vermedi');
      else { let t = await pg.evaluate(() => { let b = [...document.querySelectorAll('#chat-messages .chat-bot .msg-bubble')].pop(); return b ? b.innerText.replace(/\s+/g, ' ') : ''; }); console.log(`    Cevap: ${t.slice(0, 110)}…`); }
    } else {
      await pg.evaluate(() => askMavisLocal(LT('En iyi günüm hangisi?', 'Which was my best day?')));
    }
    await bekle(1500);
    await buyut();
    // ilk mesajdaki Maviş çizimi en üstte kalsın, altında soru ve cevap
    await pg.evaluate((KAYDIR) => {
      let cm = document.getElementById('chat-messages'), m = cm.querySelector('.chat-msg svg');
      if (m) eval('(' + KAYDIR + ')')(m, 0.01); else cm.scrollTop = 0;
    }, KAYDIR.toString());
  }],
  ['kesfet', async (pg) => {
    await pg.evaluate(([K, key]) => {
      document.getElementById('ekran-ozel').textContent = 'body #filter-panels{max-height:60vh!important}';
      openTab('explore');
      currentRadius = K.km; let sl = document.getElementById('radius-slider'); if (sl) { sl.value = K.km; sl.dispatchEvent(new Event('input')); }
      if (key) { EBIRD_API = key; fetchExploreData(K.lat, K.lng); } else demoExplore();
    }, [KESFET, EBIRD]);
    await pg.waitForFunction(() => typeof exploreData !== 'undefined' && exploreData.length > 0, null, { timeout: 30000 }).catch(() => {});
    await bekle(1000);
    const altiTur = () => pg.evaluate(() => {   // listede 6 tür tam görünsün
      let fp = document.getElementById('filter-panels');
      let rows = [...fp.querySelectorAll('#explore-content a')].map(a => a.closest('div')).filter((d, i, A) => d && A.indexOf(d) === i);
      if (rows.length < 6) return;
      let kutu = rows[5].parentElement; while (kutu && !(kutu.scrollHeight > kutu.clientHeight + 4)) kutu = kutu.parentElement; kutu = kutu || fp;
      let fazla = rows[5].getBoundingClientRect().bottom + 10 - Math.min(kutu.getBoundingClientRect().bottom, fp.getBoundingClientRect().bottom);
      if (fazla > 0) document.getElementById('ekran-ozel').textContent = `body #filter-panels{max-height:${Math.ceil(fp.offsetHeight + fazla)}px!important}`;
    });
    await altiTur(); await bekle(400); await altiTur(); await bekle(400);
    await pg.evaluate(() => {   // sarı daire paneli ile alttaki Maviş düğmesi arasındaki boşluğun ortasında
      let circle = exploreCircle || (typeof demoCircle !== 'undefined' && demoCircle); if (!circle) return;
      let alt = document.getElementById('filter-panels').getBoundingClientRect().bottom;
      mapObj.fitBounds(circle.getBounds(), { paddingTopLeft: [50, alt + 40], paddingBottomRight: [50, 120], animate: false });
    });
    await bekle(800);
  }],
];

async function tarayici() {
  for (const channel of ['msedge', 'chrome', undefined]) {
    try { return await chromium.launch({ channel, headless: true }); } catch (e) {}
  }
  console.log('Edge ya da Chrome bulunamadı.'); process.exit(1);
}

const b = await tarayici();
const css = fontCss();
let toplam = 0;
console.log(`\n📸 Mağaza ekran görüntüleri · diller: ${LANGS.join(', ')}\n`);
for (const L of LANGS) {
  const klasor = path.join(CIKTI, L); fs.mkdirSync(klasor, { recursive: true });
  const ctx = await b.newContext({
    viewport: { width: 412, height: 800 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: LOCALE[L],
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  });
  // saz delicesinin "eBird fotoğrafı": Macaulay adresine giden istek bilgisayardaki fotoğrafla cevaplanır
  if (process.env.EKRAN_SAHTE_EBIRD) await ctx.route(/api\.ebird\.org/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['Larus michahellis|Yellow-legged Gull|yelgul', 'Phalacrocorax carbo|Great Cormorant|grecor', 'Fulica atra|Eurasian Coot|eurcoo', 'Cygnus olor|Mute Swan|mutswa', 'Pica pica|Eurasian Magpie|eurmag', 'Corvus cornix|Hooded Crow|hoocro', 'Anas platyrhynchos|Mallard|mallar', 'Ardea alba|Great Egret|greegr'].map((x, i) => { let [sciName, comName, speciesCode] = x.split('|'); return { sciName, comName, speciesCode, howMany: 40 - i * 4 }; })) }));
  if (fs.existsSync(SAZ_FOTO)) await ctx.route(new RegExp(`/api/v1/asset/${SAZ_ML}/`), r => r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(SAZ_FOTO) }));
  await ctx.addInitScript(([L, css, gem]) => {
    try {
      localStorage.setItem('app_lang', L); localStorage.setItem('tour_done', '1'); localStorage.setItem('fbask_done', '1');
      localStorage.setItem('launch_count', '1'); localStorage.setItem('milestone_seen', '99999');
      // Gemini anahtarı baştan girili olsun (yoksa Maviş ilk mesajında "çevrimdışı mod" der)
      if (gem) { localStorage.setItem('ai_provider', 'gemini'); localStorage.setItem('ai_key_gemini', gem); } else localStorage.setItem('ai_provider', 'none');
    } catch (e) {}
    document.addEventListener('DOMContentLoaded', () => {
      let s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
      let o = document.createElement('style'); o.id = 'ekran-ozel'; document.head.appendChild(o);
    });
  }, [L, css, GEMINI]);
  const pg = await ctx.newPage();
  // Gemini'ye giden her isteği pencereye yaz: sorun çıkarsa kaynağı görünsün
  const gTime = new Map();
  pg.on('request', q => { if (q.url().includes('generativelanguage')) gTime.set(q, Date.now()); });
  pg.on('response', async r => {
    if (!r.url().includes('generativelanguage')) return;
    let sn = ((Date.now() - (gTime.get(r.request()) || Date.now())) / 1000).toFixed(1), model = (r.url().match(/models\/([^:?]+)/) || [])[1] || 'liste';
    let not = ''; if (!r.ok()) { try { not = ' · ' + (await r.text()).replace(/\s+/g, ' ').slice(0, 160); } catch (e) {} }
    console.log(`\n    Gemini ${model}: ${r.status()} (${sn} sn)${not}`);
  });
  pg.on('requestfailed', q => { if (q.url().includes('generativelanguage')) console.log(`\n    Gemini isteği başarısız: ${q.failure() && q.failure().errorText}`); });
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  process.stdout.write(`• ${L}: açılıyor`);
  await pg.goto(ADRES + 'index.html');
  await pg.waitForFunction(() => typeof window.loadSampleData === 'function');
  await pg.evaluate(() => window.loadSampleData());
  await pg.waitForFunction(() => typeof obsData !== 'undefined' && obsData.length > 0 && document.getElementById('upload-overlay').style.display === 'none', null, { timeout: 120000 });
  await bekle(3000);
  await pg.evaluate(() => document.querySelectorAll('.app-alert, #fbask, #mlask').forEach(e => e.remove()));
  let no = 0;
  for (const [ad, hazirla] of EKRANLAR) {
    no++;
    if (SECILI.length && !SECILI.includes(no)) continue;
    await sifirla(pg);
    try { await hazirla(pg, L); } catch (e) { console.log(`\n  ! ${ad}: ${e.message}`); }
    await oturt(pg);
    await pg.screenshot({ path: path.join(klasor, `ps_${L}_${String(no).padStart(2, '0')}_${ad}.jpg`), type: 'jpeg', quality: 90 });
    process.stdout.write('.'); toplam++;
  }
  console.log(' ✓');
  await ctx.close();
}
await b.close(); sunucu.close();
console.log(`\n✅ ${toplam} ekran görüntüsü: magaza/ham-ekranlar/`);
console.log('   Şimdi GitHub Desktop → Commit → Push; Claude mağaza görsellerini hazırlasın.\n');
