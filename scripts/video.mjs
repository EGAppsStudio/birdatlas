// Tanıtım videosu (KOMUTLAR 8): uygulamayı telefon boyutunda örnek veriyle açar, 7 kısa sahne kaydeder,
// sonra telefon çerçevesi + başlıklar + geçişler + logo ve Maviş'li açılış/kapanış + müzikle birleştirir.
//   çıktı : magaza/video/birdatlas-<dil>-yatay.mp4 (1920×1080; Play, YouTube, site)
//           magaza/video/birdatlas-<dil>-dikey.mp4 (1080×1920; Instagram Reels / hikâye)
//   müzik : magaza/video/muzik/ içindeki ilk ses dosyası (mp3/m4a/wav); yoksa sessiz
// Kullanım: npm run video                → 6 dil (başta sorar; Enter = hepsi), kayıt + montaj
//           npm run video -- en de       → yalnız bu diller
//           npm run video -- montaj      → kayıt yapmadan yalnız montaj (başlık/müzik değişince)
//           npm run video -- en --sahne=paylas,mavis → yalnız bu sahneleri yeniden kaydet, sonra montaj
// Her sahne önce KAYITSIZ hazırlanır (harita parçaları, fotoğraflar, kart yüklenene kadar); kayıt ekran hazır olunca başlar,
// beklemelerde durur (k.basla / k.dur). Sahneler ve başlıklar aşağıda. Ara dosyalar magaza/video/ham ve kare (depoya girmez).
// 21 Kasım 2026: harita yaklaşması kasmıyor (noktalar her adımda yeniden çizilmiyor, kare kare akıcı); takvim sahnesinde
// gün seçildikten sonra Türler alt sekmesine geçilip liste kaydırılıyor, sonra Konumlar (menüde gezinme).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { KOK, TUM_DILLER, SORU, tarayici, sayfaAc, sifirla, oturt, bekle, EKRANLAR, sunucu as appSunucu } from './ekran-ortak.mjs';

const require = createRequire(import.meta.url);
const ARG = process.argv.slice(2);
let DILLER = ARG.filter(a => TUM_DILLER.includes(a));
const YALNIZ_MONTAJ = ARG.includes('montaj');
const SECILI = ((ARG.find(a => a.startsWith('--sahne=')) || '').split('=')[1] || '').split(',').filter(Boolean);   // ör. --sahne=paylas,mavis: yalnız bunları yeniden kaydet
if (!DILLER.length && process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  DILLER = (await rl.question('\n  Hangi diller? (Enter = hepsi: tr en es pt de fr; ör. en ya da en,de): ')).toLowerCase().split(/[\s,]+/).filter(x => TUM_DILLER.includes(x));
  rl.close();
}
if (!DILLER.length) DILLER = TUM_DILLER;
const FPS = 30, GECIS = 0.4;   // saniyede kare, sahne geçişi (sn)
const VW = 412, VH = 800;      // telefon ekranı (CSS piksel); kayıt ×2
const VD = path.join(KOK, 'magaza', 'video'), KARE = path.join(VD, 'kare');
const HAMD = (L) => path.join(VD, 'ham', L);

// ---------- yardımcılar ----------
const hazirla = Object.fromEntries(EKRANLAR);
const resimler = (pg) => pg.waitForFunction(() => [...document.images].filter(i => i.offsetParent && i.src).every(i => i.complete), null, { timeout: 20000, polling: 300 }).catch(() => {});
const hazir = async (pg, ms = 400) => { await oturt(pg, 300); await resimler(pg); await bekle(ms); };   // harita parçaları + görünen resimler yüklendi
// alt sekmeye dokunur gibi: düğme kısa bir an basılı görünür, sonra tıklanır
const dokun = async (pg, sec) => {
  await pg.evaluate(s => { let b = document.querySelector(s); if (b) { b.style.transition = 'transform .12s, filter .12s'; b.style.transform = 'scale(.92)'; b.style.filter = 'brightness(.9)'; } }, sec);
  await bekle(160);
  await pg.evaluate(s => { let b = document.querySelector(s); if (b) { b.style.transform = ''; b.style.filter = ''; b.click(); } }, sec);
};
// listeyi parmakla kaydırır gibi yumuşakça aşağı indirir (kaydırılabilir kutusunu kendi bulur)
const kaydir = (pg, sec, sure, oran = 0.55) => pg.evaluate(([s, sure, oran]) => new Promise(ok => {
  let p = document.querySelector(s);
  while (p && !(p.scrollHeight > p.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(p).overflowY))) p = p.parentElement;
  if (!p) return ok();
  const y0 = p.scrollTop, dy = Math.min(p.scrollHeight - p.clientHeight - y0, p.clientHeight * oran), t0 = performance.now();
  const kare = () => { const t = Math.min(1, (performance.now() - t0) / sure); p.scrollTop = y0 + dy * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); t < 1 ? requestAnimationFrame(kare) : ok(); };
  requestAnimationFrame(kare);
}), [sec, sure, oran]);
const ozel = (pg, css) => pg.evaluate(c => { document.getElementById('ekran-ozel').textContent = c; }, css);

// ---------- sahneler: [ad, eylem(pg, L, k)] — k.basla() kaydı başlatır, k.dur() durdurur (arada hazırlık kayda girmez) ----------
const SAHNELER = [
  ['harita', async (pg, L, k) => {
    const bas = () => pg.evaluate(() => { closeTabs(); mapObj.setView([30, 22], 2, { animate: false }); });
    for (const [c, z] of [[[44, 12], 4], [[37, 17], 3]]) { await pg.evaluate(([c, z]) => mapObj.setView(c, z, { animate: false }), [c, z]); await hazir(pg); }   // hedefin ve aradaki seviyenin parçaları önceden insin
    await bas(); await hazir(pg, 800);
    k.basla(); await bekle(900);
    // parmakla yaklaştırır gibi, tek akışta: Leaflet'in flyTo'da kullandığı iç adım (_move) ekranın her karesinde çağrılır.
    // setView her adımda 'zoomend' atıyordu → il baloncukları (zoom < 8) her adımda baştan çiziliyordu = kasma. Burada
    // zoomend yalnız sonda bir kez gelir. Süre saatle ölçülür (adım sayısıyla değil), bilgisayar yavaşsa da hız aynı kalır.
    await pg.evaluate(() => new Promise(ok => {
      const z0 = mapObj.getZoom(), z1 = 4, p0 = mapObj.project(mapObj.getCenter(), z0), p1 = mapObj.project(L.latLng(44, 12), z0), SURE = 2300, t0 = performance.now();
      const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      mapObj.stop(); mapObj._moveStart(true, false);
      const kare = () => {
        const t = Math.min(1, (performance.now() - t0) / SURE), e = ease(t);
        if (t < 1) { mapObj._move(mapObj.unproject(p0.add(p1.subtract(p0).multiplyBy(e)), z0), z0 + (z1 - z0) * e, { flyTo: true }); requestAnimationFrame(kare); }
        else { mapObj._move(L.latLng(44, 12), z1)._moveEnd(true); ok(); }
      };
      requestAnimationFrame(kare);
    }));
    await bekle(300); await hazir(pg, 900); k.dur();
  }],
  ['takvim', async (pg, L, k) => {
    await pg.evaluate(() => { openTab('obs'); setObsSub('calendar'); currentCalDate = new Date(2024, 7, 1); selectedDates.clear(); renderAll(); });   // Kenya gezisi
    await hazir(pg, 600);
    k.basla(); await bekle(1000);
    await pg.evaluate(() => { selectedDates.add('2024-08-04'); lastClickedDay = '2024-08-04'; renderAll(); });
    await bekle(2000);
    // menüde gezinme: o günün türlerine geç (alt sekmeye "dokun"), listeyi yavaşça kaydır, sonra Konumlar
    await dokun(pg, '#obs-seg button[onclick*="species"]'); await bekle(1100);
    await kaydir(pg, '#species-list', 1600); await bekle(700);
    await dokun(pg, '#obs-seg button[onclick*="locations"]'); await bekle(1600);
    k.dur();
  }],
  ['kertik', async (pg, L, k) => {
    await hazirla.kertik(pg, L); await hazir(pg, 400);              // kertik haritası + açık kutu, önce sessizce
    await pg.evaluate(() => mapObj.closePopup()); await hazir(pg, 500);
    k.basla(); await bekle(900);
    await pg.evaluate(() => { let h = null; markerLayerGroup.eachLayer(m => { let p = m.getPopup && m.getPopup(); if (!p || h) return; let c = p.getContent(); c = typeof c === 'function' ? c(m) : c; if (String(c).includes('Coracias caudatus')) h = m; }); if (h) h.openPopup(); });
    await resimler(pg); await bekle(2400); k.dur();
  }],
  ['foto', async (pg, L, k) => {
    await hazirla.foto(pg, L); await hazir(pg, 800);                // fotoğraf tamamen yüklenince
    k.basla(); await bekle(3200); k.dur();
  }],
  ['paylas', async (pg, L, k) => {
    await ozel(pg, '#share-overlay .sp-pick{max-height:86px!important;overflow:hidden!important}');
    await pg.evaluate(() => { closeTabs(); openShare({ type: 'year' }); });
    await bekle(800);
    await pg.waitForFunction(() => { let b = document.getElementById('share-busy'); return !b || !b.offsetParent || getComputedStyle(b).display === 'none' || getComputedStyle(b).visibility === 'hidden' || getComputedStyle(b).opacity === '0'; }, null, { timeout: 40000 }).catch(() => {});
    await bekle(1200);                                                // kart çizildi ("Hazırlanıyor" bitti)
    await pg.evaluate(() => { let w = document.getElementById('share-preview-wrap'), p = w; while (p && !(p.scrollHeight > p.clientHeight + 4)) p = p.parentElement; if (p) p.scrollTop = 0; });
    await bekle(400);
    k.basla(); await bekle(800);
    await pg.evaluate(() => { let w = document.getElementById('share-preview-wrap'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    await bekle(2800); k.dur();
  }],
  ['mavis', async (pg, L, k) => {
    await pg.evaluate(() => { closeTabs(); toggleChat(); });
    await bekle(700);
    await pg.evaluate(() => { let cw = document.getElementById('chat-window'), cm = document.getElementById('chat-messages'), mb = document.getElementById('menu-btn').getBoundingClientRect(); cm.style.setProperty('height', Math.round(parseFloat(getComputedStyle(cm).height) + cw.getBoundingClientRect().top - mb.bottom - 10) + 'px', 'important'); cm.scrollTop = cm.scrollHeight; });
    await hazir(pg, 500);
    k.basla(); await bekle(600);
    const soru = SORU[L] || SORU.en;
    for (let i = 1; i <= soru.length; i++) { await pg.evaluate(s => { document.getElementById('chat-input').value = s; }, soru.slice(0, i)); await bekle(34); }
    await bekle(300);
    await pg.evaluate(() => sendChatMessage());
    await bekle(700); k.dur();                                        // "dürbünle bakıyorum" kısa görünsün, bekleme kayda girmesin
    await pg.waitForFunction(() => !document.querySelector('#chat-messages [id^="loading"]'), null, { timeout: 60000, polling: 200 }).catch(() => {});
    await pg.evaluate(() => { let cm = document.getElementById('chat-messages'), b = [...cm.querySelectorAll('.chat-msg.chat-user')].pop(); if (b) cm.scrollTop = b.offsetTop - 8; });
    await bekle(300);
    k.basla(); await bekle(3200); k.dur();
  }],
  ['kesfet', async (pg, L, k) => {
    await hazirla.kesfet(pg, L); await hazir(pg, 800);              // liste + sarı daire + harita hazır
    k.basla(); await bekle(3400); k.dur();
  }],
];
const ACILIS = 3.0, KAPANIS = 3.4;

// ---------- başlıklar ----------
const METIN = {
  en: { acilis: ['Bird Atlas', 'Your personal birding map'], harita: ['All your eBird sightings', 'on one map'], takvim: ['Tap a day,', 'relive it'], kertik: ['Every lifer,', 'a memory'], foto: ['Your own photos', 'on every species'], paylas: ['Beautiful cards', 'to share'], mavis: ['Ask Maviş', 'about your birds'], kesfet: ["What's around you", 'right now?'], kapanis: ['birdatlas.app', 'Android & web · free'] },
  tr: { acilis: ['Kuş Atlası', 'Kişisel kuş gözlem haritan'], harita: ['Tüm eBird gözlemlerin', 'tek haritada'], takvim: ['Bir güne dokun,', 'yeniden yaşa'], kertik: ['Her yeni tür', 'bir hatıra'], foto: ['Kendi fotoğrafların', 'her türde'], paylas: ['Paylaşmaya değer', 'kartlar'], mavis: ["Maviş'e sor,", 'verilerin konuşsun'], kesfet: ['Çevrende şu an', 'neler var?'], kapanis: ['birdatlas.app', 'Android ve web · ücretsiz'] },
  es: { acilis: ['Bird Atlas', 'Tu mapa personal de aves'], harita: ['Todos tus avistamientos de eBird', 'en un mapa'], takvim: ['Toca un día,', 'revívelo'], kertik: ['Cada lifer,', 'un recuerdo'], foto: ['Tus propias fotos', 'en cada especie'], paylas: ['Tarjetas preciosas', 'para compartir'], mavis: ['Pregunta a Maviş', 'sobre tus aves'], kesfet: ['¿Qué hay a tu alrededor', 'ahora mismo?'], kapanis: ['birdatlas.app', 'Android y web · gratis'] },
  pt: { acilis: ['Bird Atlas', 'Seu mapa pessoal de aves'], harita: ['Todas as suas observações do eBird', 'em um mapa'], takvim: ['Toque em um dia,', 'reviva-o'], kertik: ['Cada lifer,', 'uma lembrança'], foto: ['Suas próprias fotos', 'em cada espécie'], paylas: ['Cartões lindos', 'para compartilhar'], mavis: ['Pergunte ao Maviş', 'sobre suas aves'], kesfet: ['O que há perto de você', 'agora mesmo?'], kapanis: ['birdatlas.app', 'Android e web · grátis'] },
  de: { acilis: ['Bird Atlas', 'Deine persönliche Vogelkarte'], harita: ['Alle deine eBird-Beobachtungen', 'auf einer Karte'], takvim: ['Tippe auf einen Tag,', 'erlebe ihn neu'], kertik: ['Jeder Lifer', 'eine Erinnerung'], foto: ['Deine eigenen Fotos', 'bei jeder Art'], paylas: ['Schöne Karten', 'zum Teilen'], mavis: ['Frag Maviş', 'nach deinen Vögeln'], kesfet: ['Was ist gerade', 'in deiner Nähe?'], kapanis: ['birdatlas.app', 'Android & Web · kostenlos'] },
  fr: { acilis: ['Bird Atlas', 'Votre carte ornitho personnelle'], harita: ['Toutes vos observations eBird', 'sur une carte'], takvim: ['Touchez un jour,', 'revivez-le'], kertik: ['Chaque lifer,', 'un souvenir'], foto: ['Vos propres photos', 'pour chaque espèce'], paylas: ['De belles cartes', 'à partager'], mavis: ['Demandez à Maviş', 'tout sur vos oiseaux'], kesfet: ["Qu'y a-t-il autour de vous", 'en ce moment ?'], kapanis: ['birdatlas.app', 'Android et web · gratuit'] },
};

// ---------- 1) kayıt: ekran yayını (CDP screencast) sürekli açık; yalnız k.basla()–k.dur() arası 30 kare/sn'ye çevrilir ----------
async function kaydet(pg, L, ad, eylem) {
  const d = path.join(HAMD(L), ad); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
  const cdp = await pg.context().newCDPSession(pg), kareler = [], simdi = () => Date.now() / 1000;
  // yalnız telefon boyutundaki kareler (pencere boyutu değişirken gelen farklı boyutlu kareler titreme yapıyordu)
  cdp.on('Page.screencastFrame', f => { if (Math.abs(f.metadata.deviceWidth - VW) < 2 && Math.abs(f.metadata.deviceHeight - VH) < 2) kareler.push({ t: f.metadata.timestamp, b: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: VW * 2, maxHeight: VH * 2, everyNthFrame: 1 });
  const k = { parca: [], basla() { this.parca.push([simdi(), null]); }, dur() { const p = this.parca[this.parca.length - 1]; if (p && p[1] === null) p[1] = simdi(); } };
  try { await eylem(pg, L, k); } catch (e) { console.log(`\n  ! ${ad}: ${e.message}`); }
  k.dur(); await bekle(200);
  await cdp.send('Page.stopScreencast').catch(() => {}); await cdp.detach().catch(() => {});
  let no = 0, j = 0;
  for (const [t0, t1] of k.parca) for (let t = t0; t < t1; t += 1 / FPS) {
    while (j + 1 < kareler.length && kareler[j + 1].t <= t) j++;
    if (!kareler.length) break;
    fs.writeFileSync(path.join(d, String(++no).padStart(5, '0') + '.jpg'), Buffer.from(kareler[j].b, 'base64'));
  }
  return no;
}

if (!YALNIZ_MONTAJ) {
  const b = await tarayici({ pencere: [460, 900] });
  for (const L of DILLER) {
    console.log(`\n🎬 Tanıtım videosu · ${L} · kayıt (Edge penceresinde izleyebilirsin; tıklama)`);
    const { ctx, pg } = await sayfaAc(b, L, 2);
    await pg.evaluate(() => { try { localStorage.setItem('ai_provider', 'gemini'); } catch (e) {} });
    for (const [ad, eylem] of SAHNELER) {
      if (SECILI.length && !SECILI.includes(ad)) continue;
      process.stdout.write(`• ${ad} `);
      await sifirla(pg); await oturt(pg, 500);
      const n = await kaydet(pg, L, ad, eylem);
      console.log(`✓ (${(n / FPS).toFixed(1)} sn)`);
    }
    await ctx.close();
  }
  await b.close();
}
appSunucu.closeAllConnections(); appSunucu.close();

// ---------- 2) montaj: HTML sahne kare kare çizilir (yatay + dikey), ffmpeg ile mp4 ----------
const index = fs.readFileSync(path.join(KOK, 'www', 'index.html'), 'utf8');
const mavisJs = index.slice(index.indexOf('        const MAVIS_P ='), index.indexOf('        // ===== /Maviş ====='));
const mavisCss = index.slice(index.indexOf('/* ===== Maviş animasyonları ===== */'), index.indexOf('@media (prefers-reduced-motion: reduce) { .mavis'));
function poppinsCss() {
  const d = path.join(KOK, 'node_modules', '@fontsource', 'poppins'); let css = '';
  for (const f of ['400.css', '500.css', '700.css']) { const p = path.join(d, f); if (fs.existsSync(p)) css += fs.readFileSync(p, 'utf8').replace(/font-family:\s*'[^']+'/g, 'font-family: P').replace(/url\(\.\/files\//g, 'url(/node_modules/@fontsource/poppins/files/'); }
  if (!css && process.env.POPPINS_DIR) css = `@font-face{font-family:P;src:url('/__poppins/Poppins-Bold.ttf');font-weight:700}@font-face{font-family:P;src:url('/__poppins/Poppins-Regular.ttf');font-weight:400}`;
  return css;
}
// sahne süreleri kayıttan: kare sayısı / 30
function sahneler(L) {
  const M = METIN[L] || METIN.en;
  return SAHNELER.map(([ad]) => {
    const d = path.join(HAMD(L), ad), n = fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.jpg')).length : 0;
    if (!n) { console.log(`\n  ! ${L}/${ad} kaydı yok: önce kayıtla çalıştır (npm run video -- ${L})`); process.exit(1); }
    return { ad, n, sure: n / FPS, m: M[ad] };
  });
}
const toplam = (S) => ACILIS + S.reduce((a, s) => a + s.sure, 0) - GECIS * (S.length - 1) + KAPANIS - GECIS;

const sahneHtml = (W, H, L, SAHNE) => {
  const M = METIN[L] || METIN.en;
  const yatay = W > H;
  // telefon: yatayda sağda, dikeyde altta; başlık yatayda solda, dikeyde üstte
  const ph = yatay ? { h: 960, x: 1180, y: 60 } : { h: 1400, x: (W - 1400 / 1.94) / 2, y: 470 };
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
  #ac h1,#kap h1{font-size:${yatay ? 120 : 112}px} #ac h2,#kap h2{margin:18px 0 0;font-weight:400;color:#4A5B70;font-size:${yatay ? 46 : 52}px}
  .mvk{margin-bottom:6px}
  .lr{display:flex;align-items:center;justify-content:center;gap:${yatay ? 28 : 30}px} .lr img{width:${yatay ? 120 : 130}px;height:${yatay ? 120 : 130}px;border-radius:50%;box-shadow:0 10px 28px rgba(10,62,112,.25);border:5px solid #fff}
  </style></head><body><div class="bg"></div>
  <div class="glow g1" style="width:1100px;height:1100px;left:-420px;top:${yatay ? 300 : 1100}px"></div><div class="glow g2" style="width:1200px;height:1200px;right:-480px;top:${yatay ? -500 : 300}px"></div>
  <div id="sah"><div id="tel"><div id="ekr"><img id="i1"><img id="i2"></div></div><div id="cap"><h1 id="h"></h1><div class="dots"><svg width="72" height="14"><circle cx="11" cy="7" r="6" fill="#2E62B5"/><circle cx="36" cy="7" r="6" fill="#E9C440"/><circle cx="61" cy="7" r="6" fill="#1C3A6B"/></svg></div></div></div>
  <div id="ac"><div class="mvk" id="mv1"></div><div class="lr"><img src="/www/img/logo.png"><h1>${M.acilis[0].replace(/ (\S+)$/, ' <span>$1</span>')}</h1></div><h2>${M.acilis[1]}</h2></div>
  <div id="kap"><div class="mvk" id="mv2"></div><div class="lr"><img src="/www/img/logo.png"><h1>${M.kapanis[0]}</h1></div><h2>${M.kapanis[1]}</h2></div>
  <script>${mavisJs}
  const S = ${JSON.stringify(SAHNE)}, ACILIS = ${ACILIS}, KAPANIS = ${KAPANIS}, G = ${GECIS}, FPS = ${FPS};
  // açılış/kapanış başlığı (logo + yazı) ekrana yanlardan pay bırakarak sığsın
  document.fonts.ready.then(() => document.querySelectorAll('.lr').forEach(r => { const h = r.querySelector('h1'); let fs = parseFloat(getComputedStyle(h).fontSize); while (fs > 40 && r.scrollWidth > ${W} - 160) { fs -= 4; h.style.fontSize = fs + 'px'; } }));
  document.getElementById('mv1').innerHTML = mavisSVG(${yatay ? 360 : 460}, 'look', k => '/www/img/mavis/' + k + '.webp');
  document.getElementById('mv2').innerHTML = mavisSVG(${yatay ? 360 : 460}, 'wave', k => '/www/img/mavis/' + k + '.webp');
  const $ = id => document.getElementById(id), ease = x => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
  const kare = (s, t) => '/magaza/video/ham/${L}/' + s.ad + '/' + String(Math.min(s.n, Math.max(1, Math.floor(t * FPS) + 1))).padStart(5, '0') + '.jpg';
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
      const yazi = s.m[0] + '<br><span>' + s.m[1] + '</span>';
      if ($('h').innerHTML !== yazi) {   // yeni başlık: telefona çarpmayacak (yatayda taşmayacak) büyüklüğe küçült
        $('h').innerHTML = yazi; let fs = ${yatay ? 92 : 88}; $('h').style.fontSize = fs + 'px'; $('cap').style.transform = 'none';
        const sinir = ${yatay ? 'h => h.offsetHeight > 700' : 'h => $("cap").getBoundingClientRect().bottom > ' + (ph.y - 28)};
        while (fs > 44 && sinir($('h'))) { fs -= 4; $('h').style.fontSize = fs + 'px'; }
      }
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

// ffmpeg: ffmpeg-static paketi ilk videoda kendiliğinden kurulur (package.json'a yazılmaz; site derlemesini etkilemesin)
let FFMPEG = 'ffmpeg';
try { FFMPEG = require('ffmpeg-static') || 'ffmpeg'; } catch (e) {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e2) {
    console.log('  ffmpeg kuruluyor (yalnız ilk sefer)…');
    execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-save', 'ffmpeg-static@5'], { stdio: 'inherit', cwd: KOK, shell: process.platform === 'win32' });
    FFMPEG = createRequire(path.join(KOK, 'package.json'))('ffmpeg-static');
  }
}
const md = path.join(VD, 'muzik'), muzik = fs.existsSync(md) && fs.readdirSync(md).filter(f => /\.(mp3|m4a|wav|ogg|aac)$/i.test(f)).sort()[0];
const b2 = await tarayici({ gorunur: false });   // montaj görünmez çizilir (görünür pencerede kare kare çekim titriyor)
for (const L of DILLER) {
  const SAHNE = sahneler(L), TOPLAM = toplam(SAHNE);
  console.log(`\n🎞  ${L} · montaj · ${TOPLAM.toFixed(1)} sn · müzik: ${muzik || 'yok (sessiz)'}`);
  for (const [tur, W, H] of [['yatay', 1920, 1080], ['dikey', 1080, 1920]]) {
    SAYFA = sahneHtml(W, H, L, SAHNE);
    fs.rmSync(KARE, { recursive: true, force: true }); fs.mkdirSync(KARE, { recursive: true });
    const pg = await b2.newPage({ viewport: { width: W, height: H } });
    await pg.goto(ADRES + '/__sahne'); await pg.evaluate(() => document.fonts.ready); await bekle(800);
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
}
await b2.close(); srv.closeAllConnections(); srv.close();
fs.rmSync(KARE, { recursive: true, force: true });
console.log('\n✅ Videolar hazır: magaza/video/. Commit → Push (Claude baksın); yatay olanları YouTube\'a "Liste dışı" yükle.\n');
