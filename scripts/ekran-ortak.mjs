// Ekran aracının ortak parçası: www/ klasörünü yerelde sunar, Android yazı tiplerini takar, Gemini/eBird isteklerini
// örnek cevaplarla karşılar, örnek veriyi yükler ve ekranları hazırlar. Kullananlar: ekranlar.mjs (görüntü), video.mjs (video).
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export const KOK = process.cwd(), WWW = path.join(KOK, 'www'), CIKTI = path.join(KOK, 'magaza', 'ham-ekranlar');
const require = createRequire(import.meta.url);
export let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) { try { ({ chromium } = require('playwright')); } catch (e2) { console.log('playwright-core yok: önce KOMUTLAR 6 (npm install).'); process.exit(1); } }
if (!fs.existsSync(path.join(WWW, 'lib', 'leaflet'))) { console.log('www/lib yok: önce KOMUTLAR 6 (npm install).'); process.exit(1); }

export const TUM_DILLER = ['tr', 'en', 'es', 'pt', 'de', 'fr'];
export const LOCALE = { tr: 'tr-TR', en: 'en-US', es: 'es-ES', pt: 'pt-BR', de: 'de-DE', fr: 'fr-FR' };
export const SORU = { tr: "2026'daki en iyi günüm hangisiydi?", en: 'What was my best day in 2026?', es: '¿Cuál fue mi mejor día en 2026?', pt: 'Qual foi meu melhor dia em 2026?', de: 'Was war mein bester Tag 2026?', fr: 'Quel a été mon meilleur jour en 2026 ?' };
const KESFET = { lat: 44.5136, lng: 28.6356, km: 30 };        // Köstence yakınları
const SAZ = 'Circus aeruginosus', SAZ_ML = '999000111';       // saz delicesi: eBird fotoğrafıymış gibi (sarı çerçeve)
const SAZ_FOTO = path.join(KOK, 'magaza', 'ekran-foto', 'saz-delicesi.jpg');

// ---------- Anahtar YOK: Maviş'in Gemini cevabı ve Keşfet listesi sabit örnek (her dilde aynı, her çekimde aynı) ----------
// Uygulama Gemini'ye / eBird'e gerçekten istek atar ama bu istekler bilgisayardan dışarı çıkmadan aşağıdaki örneklerle cevaplanır.
const GEMINI = 'ekran', EBIRD = 'ekran';
const MAVIS_CEVAP = {
  tr: "Selam! Dürbünüm hazır, 2026 kayıtlarına baktım. En çeşitli günün **15 Ağustos 2026**'da **Eymir Gölü**'ndeydi: 15 farklı tür kaydetmişsin; aralarında yeşilbaş, sakarmeke, bahri ve boz kuyrukkakan var. Ne güzel bir gözlem günü! Bu arada ardıçkuşları ve ben, göçmen tüylerin hesabını bu kadar titiz tutanlara hep hayranızdır!",
  en: "Hi! Binoculars ready, I've looked through your 2026 records. Your most diverse day was **15 August 2026** at **Eymir Gölü**, where you logged 15 different species, including Mallard, Eurasian Coot, Great Crested Grebe and Isabelline Wheatear. What a day in the field! By the way, the thrushes and I always admire anyone who keeps such an exact count of their feathered travellers!",
  es: "¡Hola! Con mis prismáticos listos, he revisado tus registros de 2026. Tu día con mayor diversidad de avistamientos fue el **15 de agosto de 2026** en **Eymir Gölü**, donde registraste 15 especies diferentes, incluyendo el ánade real, la focha común, el somormujo lavanco y la collalba isabel. ¡Qué gran jornada de observación! Por cierto, ¡los tordos y yo siempre admiramos a quienes llevan la cuenta exacta de sus plumas viajeras!",
  pt: "Olá! Com meus binóculos prontos, revisei seus registros de 2026. Seu dia com mais espécies foi **15 de agosto de 2026** no **Eymir Gölü**, onde você registrou 15 espécies diferentes, incluindo o pato-real, o galeirão-comum, o mergulhão-de-crista e a chasco-isabel. Que dia de campo incrível! Aliás, os sabiás e eu sempre admiramos quem leva a conta exata das suas penas viajantes!",
  de: "Hallo! Fernglas bereit, ich habe mir deine Beobachtungen von 2026 angesehen. Dein artenreichster Tag war der **15. August 2026** am **Eymir Gölü**: 15 verschiedene Arten, darunter Stockente, Blässhuhn, Haubentaucher und Isabellsteinschmätzer. Was für ein Tag draußen! Übrigens bewundern die Drosseln und ich jeden, der so genau über seine gefiederten Reisenden Buch führt!",
  fr: "Salut ! Jumelles prêtes, j'ai parcouru vos observations de 2026. Votre journée la plus riche a été le **15 août 2026** à **Eymir Gölü** : 15 espèces différentes, dont le canard colvert, la foulque macroule, le grèbe huppé et le traquet isabelle. Quelle belle journée de terrain ! D'ailleurs, les grives et moi admirons toujours ceux qui tiennent le compte exact de leurs voyageurs à plumes !",
};
// Keşfet: Köstence yakınlarında 30 km, son 30 gün (bilimsel ad, eBird kodu, sayı); adlar uygulamanın tür adı dosyalarından o dilde
const KESFET_LISTE = [   // ilk 7: Enes'in gerçek Köstence sonucuyla aynı sıra ve sayılar
  ['Recurvirostra avosetta', 'pieavo1', 550], ['Pluvialis apricaria', 'eugplo', 250], ['Spatula clypeata', 'norsho', 175], ['Tadorna tadorna', 'comshe', 65],
  ['Grus grus', 'comcra', 13], ['Erithacus rubecula', 'eurrob1', 12], ['Panurus biarmicus', 'beares1', 9], ['Phoenicopterus roseus', 'grefla2', 8],
  ['Anas crecca', 'gnwtea', 8], ['Mareca penelope', 'eurwig', 7], ['Anas platyrhynchos', 'mallar3', 7], ['Fulica atra', 'eurcoo', 6],
  ['Chroicocephalus ridibundus', 'bkhgul', 6], ['Calidris alpina', 'dunlin', 6], ['Anas acuta', 'norpin', 5], ['Aythya ferina', 'compoc', 5],
  ['Larus cachinnans', 'casgul', 5], ['Vanellus vanellus', 'norlap', 4], ['Phalacrocorax carbo', 'grecor', 4], ['Cygnus olor', 'mutswa', 4],
  ['Sturnus vulgaris', 'eursta', 4], ['Ardea alba', 'greegr', 3], ['Egretta garzetta', 'litegr', 3], ['Ardea cinerea', 'graher1', 3],
  ['Tringa totanus', 'comred1', 3], ['Pelecanus crispus', 'dalpel1', 2], ['Microcarbo pygmaeus', 'pygcor2', 2], ['Corvus cornix', 'hoocro1', 2],
  ['Podiceps cristatus', 'grcgre1', 2], ['Tachybaptus ruficollis', 'litgre1', 2], ['Pica pica', 'eurmag1', 1], ['Alauda arvensis', 'skylar', 1],
  ['Galerida cristata', 'creslar1', 1], ['Emberiza calandra', 'corbun1', 1], ['Motacilla alba', 'whiwag', 1], ['Circus aeruginosus', 'marhar1', 1],
  ['Buteo buteo', 'combuz1', 1], ['Buteo lagopus', 'rolhaw', 1], ['Falco tinnunculus', 'eurkes', 1], ['Tringa erythropus', 'spored', 1],
  ['Anarhynchus alexandrinus', 'kenplo1', 1],
];
const ADLAR = (() => {   // bilimsel ad → { tr, en, es, pt, de, fr }
  const m = {}, v = path.join(WWW, 'data');
  try { for (const [sci, tr, en] of JSON.parse(fs.readFileSync(path.join(v, 'ebird-taxonomy.json'), 'utf8')).rows) m[sci] = { tr, en }; } catch (e) {}
  for (const d of ['es', 'pt', 'de', 'fr']) try { for (const [sci, ad] of Object.entries(JSON.parse(fs.readFileSync(path.join(v, `ebird-names-${d}.json`), 'utf8')))) (m[sci] = m[sci] || {})[d] = ad; } catch (e) {}
  return m;
})();

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
  // (1.14'ten beri sekmelerde ve panellerde uygulamanın kendi SVG simgeleri var; emoji yazı tipine gerek kalmadı)
  return css + `\n.fchip.sample{display:none!important}\n`;
}

// ---------- www/ klasörünü yerelde sun ----------
const TIP = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.csv': 'text/csv', '.webmanifest': 'application/manifest+json' };
export const sunucu = http.createServer((q, r) => {
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
export const ADRES = `http://127.0.0.1:${sunucu.address().port}/`;

export const bekle = (ms) => new Promise(ok => setTimeout(ok, ms));
export async function oturt(pg, ms = 1500) {
  await pg.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // sade (vektör) harita: tüm parçalar çizilene kadar bekle (en çok 20 sn)
  await pg.evaluate(() => new Promise(ok => {
    let gl = null; try { mapObj.eachLayer(l => { if (!gl && l.getMaplibreMap) gl = l.getMaplibreMap(); }); } catch (e) {}
    if (!gl) return ok();
    let bitti = () => { try { return gl.loaded() && gl.areTilesLoaded(); } catch (e) { return true; } };
    let t0 = Date.now(), iv = setInterval(() => { if (bitti() || Date.now() - t0 > 20000) { clearInterval(iv); ok(); } }, 300);
  })).catch(() => {});
  await bekle(ms);
}

// Ekranlar arasında her şeyi kapat
export async function sifirla(pg) {
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
export const KAYDIR = (el, oran) => {
  let p = el.parentElement;
  while (p && !(p.scrollHeight > p.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(p).overflowY))) p = p.parentElement;
  if (!p) return;
  let pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
  p.scrollTop += (er.top - pr.top) - pr.height * oran;
};

// ---------- Çekilecek ekranlar ----------
export const EKRANLAR = [
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

// gorunur: pencere açık (Enes adım adım izler; sorun olursa siyah pencerede Ctrl+C). Görünmez için: set GIZLI=1
// pencere: [genişlik, yükseklik] — pencere sayfa boyutuna yakın olsun (büyük pencerede kayıt titriyor)
export async function tarayici({ gorunur = true, pencere = null } = {}) {
  const args = pencere ? [`--window-size=${pencere[0]},${pencere[1]}`] : [];
  for (const channel of ['msedge', 'chrome', undefined]) {
    try { return await chromium.launch({ channel, args, headless: !gorunur || process.env.GIZLI === '1' || !!process.env.CI }); } catch (e) {}
  }
  console.log('Edge ya da Chrome bulunamadı.'); process.exit(1);
}

// Örnek veriyle hazır bir uygulama sayfası (dil L); olcek = cihaz piksel oranı (görüntü 3, video 2)
export async function sayfaAc(b, L, olcek = 3) {
  const css = fontCss();
  const ctx = await b.newContext({
    viewport: { width: 412, height: 800 }, deviceScaleFactor: olcek, isMobile: true, hasTouch: true, locale: LOCALE[L],
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  });
  // saz delicesinin "eBird fotoğrafı": Macaulay adresine giden istek bilgisayardaki fotoğrafla cevaplanır
  // Keşfet (eBird) ve Maviş (Gemini) istekleri dışarı çıkmadan örnek cevaplarla
  await ctx.route(/api\.ebird\.org/, r => {
    const u = r.request().url();
    if (!/obs\/geo\/recent/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    const liste = KESFET_LISTE.map(([sci, kod, n], i) => { const a = ADLAR[sci] || {}; return { speciesCode: kod, sciName: sci, comName: a[L] || a.en || sci, howMany: n, locName: 'Lacul Siutghiol', obsDt: '2026-11-1' + (i % 7) + ' 09:00', lat: KESFET.lat + (i % 5) * 0.02, lng: KESFET.lng + (i % 4) * 0.02 }; });
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(liste) });
  });
  await ctx.route(/generativelanguage\.googleapis\.com/, r => {
    const u = r.request().url();
    if (!/:generateContent/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-flash-latest', supportedGenerationMethods: ['generateContent'] }] }) });
    setTimeout(() => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: MAVIS_CEVAP[L] }], role: 'model' }, finishReason: 'STOP' }] }) }), 1200);
  });
  if (process.env.EKRAN_SAHTE_EBIRD_ESKI) await ctx.route(/api\.ebird\.org/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['Larus michahellis|Yellow-legged Gull|yelgul', 'Phalacrocorax carbo|Great Cormorant|grecor', 'Fulica atra|Eurasian Coot|eurcoo', 'Cygnus olor|Mute Swan|mutswa', 'Pica pica|Eurasian Magpie|eurmag', 'Corvus cornix|Hooded Crow|hoocro', 'Anas platyrhynchos|Mallard|mallar', 'Ardea alba|Great Egret|greegr'].map((x, i) => { let [sciName, comName, speciesCode] = x.split('|'); return { sciName, comName, speciesCode, howMany: 40 - i * 4 }; })) }));
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
    await pg.goto(ADRES + 'index.html');
  await pg.waitForFunction(() => typeof window.loadSampleData === 'function');
  await pg.evaluate(() => window.loadSampleData());
  await pg.waitForFunction(() => typeof obsData !== 'undefined' && obsData.length > 0 && document.getElementById('upload-overlay').style.display === 'none', null, { timeout: 120000 });
  await bekle(3000);
  await pg.evaluate(() => document.querySelectorAll('.app-alert, #fbask, #mlask').forEach(e => e.remove()));
  return { ctx, pg };
}
