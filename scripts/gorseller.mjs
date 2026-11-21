// Mağaza, site ve Instagram görsellerini ham ekran görüntülerinden üretir (Enes'in bilgisayarında, Edge ile; KOMUTLAR 7'nin ikinci yarısı).
//   girdi : magaza/ham-ekranlar/<dil>/ps_<dil>_NN_<ad>.jpg  (npm run ekranlar)
//   çıktı : magaza/gorseller/<dil>/telefon-01…08.jpg (1440×2560) + one-cikan.jpg (1024×500, ES/PT/DE/FR o dilde)
//           magaza/instagram/ig_en_01…10.jpg (1080×1350, yalnız İngilizce); gönderi/Reels/hikâye/biyografi metinleri elle: magaza/instagram/aciklama.txt
//           site/img/shots/<ekran>-<dil>.webp (600×1167; birdatlas.app tanıtım sayfası)
// Başlıklar aşağıda (6 dil); değiştirmek için yalnız bu dosya. Tasarım tarifi: proje dokümanı magaza-instagram-gorsel-tarifi.md
// Kullanım: npm run gorseller            → 6 dil
//           npm run gorseller -- de fr   → yalnız bu diller
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { KOK, tarayici, TUM_DILLER, sunucu as appSunucu } from './ekran-ortak.mjs';
appSunucu.close();   // uygulama sunucusu burada gerekmiyor

const HAM = path.join(KOK, 'magaza', 'ham-ekranlar'), OUT = path.join(KOK, 'magaza', 'gorseller');
const ARG = process.argv.slice(2).filter(a => /^[a-z]{2}$/.test(a));
const DILLER = ARG.length ? ARG : TUM_DILLER;

// 8 Play görseli: [ham ekran numaraları, başlık, alt başlık] – dil başına
const SL = {
  tr: [
    [[1], "Tüm eBird gözlemlerin tek haritada", "Daire büyüdükçe tür sayısı artar; her şey üstteki sekmelerde, bir dokunuş uzakta"],
    [[2, 3], "Takvim ve grafiklerle kuş yılın", "Bir güne dokun, o günü yeniden yaşa; aylık, haftalık grafikler ve yıl karşılaştırma"],
    [[4, 5], "Nerede, ne zaman gördüğünü hatırla", "Konum konum, tür tür listeler; gün gün neler gördüğün tek dokunuşta"],
    [[6], "Her yeni tür bir hatıra", "Kertik haritasında her türü ilk gördüğün yerde, fotoğrafıyla gör"],
    [[7], "Kendi fotoğraflarınla senin atlasın", "eBird'e yüklediğin ya da cihazından seçtiğin fotoğraflar; paylaşım kartlarında da onlar görünür"],
    [[8], "Kartla ya da bağlantıyla paylaş", "Yıl, ay, gün, gezi, tür ve kertik kartları; bağlantıyı arkadaşın uygulamasız açar"],
    [[9], "Maviş'e sor, verilerin konuşsun", "Dürbünlü asistanın gezilerini, kertiklerini ve en iyi günlerini anlatır"],
    [[10], "Çevrende şu an neler var?", "Haritaya dokun; seçtiğin çaptaki son 30 günün eBird kayıtlarını gör"]
  ],
  en: [
    [[1], "All your eBird sightings on one map", "Bigger circles mean more species; everything is one tap away in the tabs"],
    [[2, 3], "Your bird year in calendars and charts", "Tap a day to relive it; monthly and weekly charts, compare years"],
    [[4, 5], "Remember where and when", "Lists by place and by species; every day in the field one tap away"],
    [[6], "Every lifer, a memory", "The lifer map shows each species where you first saw it, with its photo"],
    [[7], "Your atlas, your own photos", "Your eBird photos or shots from your device — they show on your share cards too"],
    [[8], "Share as a card or a link", "Year, month, day, trip, species and lifer cards; friends open links without the app"],
    [[9], "Ask Maviş and let your data talk", "Your binocular-toting assistant recalls your trips, lifers and best days"],
    [[10], "What's around you right now?", "Tap the map to see the last 30 days of eBird sightings nearby"]
  ],
  es: [
    [[1], "Todos tus avistamientos de eBird en un mapa", "Círculos más grandes, más especies; todo a un toque en las pestañas"],
    [[2, 3], "Tu año pajarero en calendarios y gráficos", "Toca un día para revivirlo; gráficos mensuales y semanales, compara años"],
    [[4, 5], "Recuerda dónde y cuándo", "Listas por lugar y por especie; cada día de campo a un toque"],
    [[6], "Cada lifer, un recuerdo", "El mapa de lifers muestra cada especie donde la viste por primera vez, con su foto"],
    [[7], "Tu atlas, con tus propias fotos", "Tus fotos de eBird o de tu dispositivo; también aparecen en tus tarjetas"],
    [[8], "Comparte como tarjeta o enlace", "Tarjetas de año, mes, día, salida, especie y lifer; tus amigos abren el enlace sin la app"],
    [[9], "Pregunta a Maviş y deja hablar a tus datos", "Tu asistente con prismáticos recuerda tus salidas, lifers y mejores días"],
    [[10], "¿Qué hay a tu alrededor ahora?", "Toca el mapa y mira los avistamientos de eBird de los últimos 30 días cerca de ti"]
  ],
  pt: [
    [[1], "Todas as suas observações do eBird em um mapa", "Círculos maiores, mais espécies; tudo a um toque nas abas"],
    [[2, 3], "Seu ano de passarinhada em calendários e gráficos", "Toque em um dia para revivê-lo; gráficos mensais e semanais, compare anos"],
    [[4, 5], "Lembre onde e quando", "Listas por local e por espécie; cada dia de campo a um toque"],
    [[6], "Cada lifer, uma lembrança", "O mapa de lifers mostra cada espécie onde você a viu pela primeira vez, com foto"],
    [[7], "Seu atlas, com suas próprias fotos", "Suas fotos do eBird ou do seu aparelho; elas aparecem também nos seus cartões"],
    [[8], "Compartilhe como cartão ou link", "Cartões de ano, mês, dia, saída, espécie e lifer; amigos abrem o link sem o app"],
    [[9], "Pergunte ao Maviş e deixe seus dados falarem", "Seu assistente de binóculos lembra suas saídas, lifers e melhores dias"],
    [[10], "O que há perto de você agora?", "Toque no mapa e veja as observações do eBird dos últimos 30 dias por perto"]
  ],
  de: [
    [[1], "Alle deine eBird-Beobachtungen auf einer Karte", "Größere Kreise, mehr Arten; alles ist in den Tabs nur einen Tipp entfernt"],
    [[2, 3], "Dein Vogeljahr in Kalendern und Diagrammen", "Tippe auf einen Tag und erlebe ihn neu; Monats- und Wochendiagramme, Jahresvergleich"],
    [[4, 5], "Erinnere dich: wo und wann", "Listen nach Ort und nach Art; jeder Tag im Feld nur einen Tipp entfernt"],
    [[6], "Jeder Lifer eine Erinnerung", "Die Lifer-Karte zeigt jede Art dort, wo du sie zuerst gesehen hast – mit Foto"],
    [[7], "Dein Atlas mit deinen eigenen Fotos", "Deine eBird-Fotos oder Bilder vom Gerät – auch auf deinen Teilen-Karten"],
    [[8], "Als Karte oder Link teilen", "Jahres-, Monats-, Tages-, Exkursions-, Art- und Lifer-Karten; Freunde öffnen Links ohne App"],
    [[9], "Frag Maviş und lass deine Daten sprechen", "Dein Assistent mit Fernglas erinnert sich an Touren, Lifer und beste Tage"],
    [[10], "Was ist gerade in deiner Nähe?", "Tippe auf die Karte und sieh die eBird-Beobachtungen der letzten 30 Tage in der Umgebung"]
  ],
  fr: [
    [[1], "Toutes vos observations eBird sur une carte", "Plus le cercle est grand, plus il y a d'espèces ; tout est à un toucher dans les onglets"],
    [[2, 3], "Votre année ornitho en calendriers et graphiques", "Touchez un jour pour le revivre ; graphiques mensuels et hebdomadaires, comparez les années"],
    [[4, 5], "Où et quand, en un coup d'œil", "Listes par site et par espèce ; chaque sortie à un toucher"],
    [[6], "Chaque lifer, un souvenir", "La carte des lifers montre chaque espèce là où vous l'avez vue la première fois, avec sa photo"],
    [[7], "Votre atlas, avec vos propres photos", "Vos photos eBird ou celles de votre appareil ; elles apparaissent aussi sur vos cartes"],
    [[8], "Partagez en carte ou en lien", "Cartes année, mois, jour, sortie, espèce et lifer ; vos amis ouvrent le lien sans l'appli"],
    [[9], "Demandez à Maviş, laissez parler vos données", "Votre assistant à jumelles se souvient de vos sorties, lifers et meilleurs jours"],
    [[10], "Qu'y a-t-il autour de vous ?", "Touchez la carte pour voir les observations eBird des 30 derniers jours à proximité"]
  ],
};
// Instagram (yalnız İngilizce): her ekran ayrı
const IG = [
  [1, "All your eBird sightings on one map", "Bigger circles mean more species; everything is one tap away in the tabs"],
  [2, "Tap a day, relive it", "Which places, which species — your day in the field at a glance"],
  [3, "Your bird year in one chart", "Species, sightings, days or birds — monthly, weekly or year vs year"],
  [4, "Every place, day by day", "Sort your spots by species or rarity and see what you saw there, day by day"],
  [5, "Every species you've seen", "Photos, first sightings, places and dates — search in any language"],
  [6, "Every lifer, a memory", "The lifer map shows each species where you first saw it, with its photo"],
  [7, "Your atlas, your own photos", "Your eBird photos or shots from your device — they show on your share cards too"],
  [8, "Share as a card or a link", "Year, month, day, trip, species and lifer cards; friends open links without the app"],
  [9, "Ask Maviş and let your data talk", "Your binocular-toting assistant recalls your trips, lifers and best days"],
  [10, "What's around you right now?", "Tap the map to see the last 30 days of eBird sightings nearby"]
];
// Öne çıkan görsel (1024×500): [başlık1, başlık2, alt yazı, çipler, selam]
const FG = {
  tr: ["Kuş ", "Atlası", "Kişisel kuş gözlem haritan", ["🗺️ Harita", "🏆 Kertikler", "📊 Grafikler", "🐦 Maviş", "📤 Paylaşım kartları", "📷 Kendi fotoğrafın"], "Selam! Ben Maviş 👋"],
  es: ["Bird ", "Atlas", "Tu mapa personal de aves", ["🗺️ Mapa", "🏆 Lifers", "📊 Gráficos", "🐦 Maviş", "📤 Tarjetas", "📷 Tus fotos"], "¡Hola! Soy Maviş 👋"],
  pt: ["Bird ", "Atlas", "Seu mapa pessoal de aves", ["🗺️ Mapa", "🏆 Lifers", "📊 Gráficos", "🐦 Maviş", "📤 Cartões", "📷 Suas fotos"], "Olá! Eu sou o Maviş 👋"],
  de: ["Bird ", "Atlas", "Deine persönliche Vogelkarte", ["🗺️ Karte", "🏆 Lifer", "📊 Diagramme", "🐦 Maviş", "📤 Teilen-Karten", "📷 Eigene Fotos"], "Hallo! Ich bin Maviş 👋"],
  fr: ["Bird ", "Atlas", "Votre carte ornitho personnelle", ["🗺️ Carte", "🏆 Lifers", "📊 Graphiques", "🐦 Maviş", "📤 Cartes à partager", "📷 Vos photos"], "Salut ! Moi, c'est Maviş 👋"]
};
const FG_EN = ["Bird ", "Atlas", "Your personal birding map", ["🗺️ Map", "🏆 Lifers", "📊 Charts", "🐦 Maviş", "📤 Share cards", "📷 Your own photos"], "Hi! I'm Maviş 👋"];
// Sitedeki ekran görüntüleri: ad → ham ekran numarası
const SITE = { map: 1, calendar: 2, chart: 3, place: 4, lifers: 6, photo: 7, share: 8, mavis: 9, explore: 10 };

// ---------- yazı tipi: Poppins (npm paketi; yoksa sistemdeki) ----------
function poppinsCss() {
  const d = path.join(KOK, 'node_modules', '@fontsource', 'poppins');
  let css = '';
  for (const f of ['400.css', '500.css', '700.css']) {
    const p = path.join(d, f); if (fs.existsSync(p)) css += fs.readFileSync(p, 'utf8').replace(/font-family:\s*'[^']+'/g, 'font-family: P').replace(/url\(\.\/files\//g, 'url(/node_modules/@fontsource/poppins/files/');
  }
  if (!css && process.env.POPPINS_DIR) css = `@font-face{font-family:P;src:url('/__poppins/Poppins-Bold.ttf');font-weight:700}@font-face{font-family:P;src:url('/__poppins/Poppins-Regular.ttf');font-weight:400}`;
  return css;
}
const CSS = poppinsCss() + `
body{margin:0;overflow:hidden;position:relative;font-family:P,'Segoe UI',sans-serif;background:#F4F7FB}
.bg{position:absolute;inset:0;background:linear-gradient(180deg,#F8FAFD 0%,#EEF3FA 45%,#E3ECF8 100%)}
.glow{position:absolute;border-radius:50%}
.g1{background:radial-gradient(circle,rgba(233,196,64,.20) 0%,rgba(233,196,64,0) 70%)}
.g2{background:radial-gradient(circle,rgba(46,98,181,.14) 0%,rgba(46,98,181,0) 70%)}
.cap{position:absolute;text-align:center}
h1{margin:0;text-wrap:balance;font-weight:700;color:#1C3A6B;letter-spacing:-1px}
h2{margin:0;text-wrap:balance;font-weight:400;color:#4A5B70}
.phone{position:absolute;background:#1B1E24;box-sizing:border-box;box-shadow:0 40px 80px rgba(10,40,80,.28),0 0 0 3px #3a3f48 inset}
.scr{width:100%;height:100%;overflow:hidden;background:#fff}
.scr img{width:100%;height:100%;object-fit:cover;object-position:top}`;

const dots = (sz) => { const r = sz / 2.3; return `<svg width="${sz * 6}" height="${sz * 1.2}"><circle cx="${sz * .85}" cy="${sz * .6}" r="${r}" fill="#2E62B5"/><circle cx="${sz * 3}" cy="${sz * .6}" r="${r}" fill="#E9C440"/><circle cx="${sz * 5.15}" cy="${sz * .6}" r="${r}" fill="#1C3A6B"/></svg>`; };
function phone(img, x, y, w, rot = 0) {
  const h = w * 1.92, pad = w * .022, rad = w * .078;
  return `<div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${rad}px;padding:${pad}px;transform:rotate(${rot}deg)"><div class="scr" style="border-radius:${rad - pad}px"><img src="${img}"></div></div>`;
}
function sayfa(W, H, h1, h2, imgs, ig = false) {
  let cap, ph, g;
  if (!ig) {
    const fs_ = h1.length <= 38 ? 82 : 74;   // uzun başlıklar (ES/PT/DE/FR) biraz küçük
    cap = `<div class="cap" style="top:120px;left:100px;right:100px"><h1 style="font-size:${fs_}px;line-height:1.12">${h1}</h1><div style="margin:30px 0 22px">${dots(12)}</div><h2 style="font-size:42px;line-height:1.35">${h2}</h2></div>`;
    ph = imgs.length === 1 ? phone(imgs[0], (W - 1000) / 2, 660, 1000) : phone(imgs[0], 40, 680, 690, -3) + phone(imgs[1], 710, 800, 690, 3);
    g = '<div class="glow g1" style="width:900px;height:900px;left:-360px;top:900px"></div><div class="glow g2" style="width:1000px;height:1000px;right:-420px;top:1500px"></div>';
  } else {
    cap = `<div class="cap" style="top:64px;left:70px;right:70px"><h1 style="font-size:54px;line-height:1.12">${h1}</h1><div style="margin:16px 0 12px">${dots(8)}</div><h2 style="font-size:27px;line-height:1.35">${h2}</h2></div>`;
    ph = phone(imgs[0], (W - 620) / 2, 365, 620);
    g = '<div class="glow g1" style="width:700px;height:700px;left:-300px;top:500px"></div><div class="glow g2" style="width:760px;height:760px;right:-320px;top:700px"></div>';
  }
  return `<html><head><meta charset="utf-8"><style>${CSS} body{width:${W}px;height:${H}px}</style></head><body><div class="bg"></div>${g}${cap}${ph}</body></html>`;
}
function ham(L, n) {
  const d = path.join(HAM, L), f = fs.existsSync(d) && fs.readdirSync(d).find(x => x.startsWith(`ps_${L}_${String(n).padStart(2, '0')}_`));
  if (!f) { console.log(`\n  ! eksik ham ekran: ${L} ${n} (önce npm run ekranlar)`); process.exit(1); }
  return `/magaza/ham-ekranlar/${L}/${f}`;
}
const fr = s => s.replace(/ ([;:?!])/g, ' $1');   // Fransızcada ; : ? ! öncesi bölünmez boşluk

// ---------- proje klasörünü yerelde sun; üretilen sayfa /__sayfa ----------
let SAYFA = '';
const TIP = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const sunucu = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/__sayfa') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(SAYFA); }
  const dosya = u.startsWith('/__poppins/') ? path.join(process.env.POPPINS_DIR || '', path.basename(u)) : path.join(KOK, u);
  if (!dosya.startsWith(KOK) && !u.startsWith('/__poppins/') || !fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TIP[path.extname(dosya)] || 'application/octet-stream' }); fs.createReadStream(dosya).pipe(r);
});
await new Promise(ok => sunucu.listen(0, '127.0.0.1', ok));
const ADRES = `http://127.0.0.1:${sunucu.address().port}`;

const b = await tarayici({ gorunur: false });   // görsel çizimi: pencere gerekmez (ekran görüntüleri ekranlar.mjs'de görünür çekilir)
async function cek(html, W, H, out, q = 92) {
  SAYFA = html;
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  await pg.goto(ADRES + '/__sayfa'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(250);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await pg.screenshot({ path: out, type: 'jpeg', quality: q }); await pg.close();
}
// sitedeki görüntü: ham ekran → 600×1167 WebP (tarayıcının kendi kodlayıcısıyla)
async function webp(src, out) {
  const pg = await b.newPage();
  await pg.goto(ADRES + '/__sayfa');
  const veri = await pg.evaluate(async (src) => {
    const im = new Image(); im.src = src; await im.decode();
    const c = document.createElement('canvas'); c.width = 600; c.height = 1167;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, 600, 1167);
    return c.toDataURL('image/webp', 0.82).split(',')[1];
  }, ADRES + src);
  fs.writeFileSync(out, Buffer.from(veri, 'base64')); await pg.close();
}

console.log(`\n🖼  Görseller hazırlanıyor · diller: ${DILLER.join(', ')}`);
for (const L of DILLER) {
  process.stdout.write(`• ${L}: `);
  for (const [i, [nums, h1, h2]] of SL[L].entries()) {
    const [a, c] = L === 'fr' ? [fr(h1), fr(h2)] : [h1, h2];
    await cek(sayfa(1440, 2560, a, c, nums.map(n => ham(L, n))), 1440, 2560, path.join(OUT, L, `telefon-${String(i + 1).padStart(2, '0')}.jpg`));
    process.stdout.write('.');
  }
  // öne çıkan görsel, o dilde (kaynak: magaza/kaynak/one-cikan.html, İngilizce)
  const [t1, t2, alt, cips, selam] = FG[L] || FG_EN, [e1, e2, ealt, ecips, eselam] = FG_EN;
  let h = fs.readFileSync(path.join(KOK, 'magaza', 'kaynak', 'one-cikan.html'), 'utf8')
    .replace(/@font-face\{[^}]*\}/g, '').replace('<style>', '<style>' + poppinsCss())
    .replace(/src="(map|logo)\.png/g, 'src="/magaza/kaynak/$1.png').replace(/\.\.\/\.\.\/www\/img\/mavis\//g, '/www/img/mavis/');
  h = h.replace(`>${e1}<span>${e2}</span><`, `>${t1}<span>${t2}</span><`).replace(`>${ealt}<`, `>${alt}<`).replace(`>${eselam}<`, `>${selam}<`);
  ecips.forEach((x, i) => { h = h.replace(`>${x}<`, `>${cips[i]}<`); });
  await cek(L === 'fr' ? h.replace(/>Salut ! /, '>Salut\u00a0! ') : h, 1024, 500, path.join(OUT, L, 'one-cikan.jpg'), 94); process.stdout.write('★');
  // site
  const sd = path.join(KOK, 'site', 'img', 'shots'); fs.mkdirSync(sd, { recursive: true });
  for (const [ad, n] of Object.entries(SITE)) await webp(ham(L, n), path.join(sd, `${ad}-${L}.webp`));
  process.stdout.write(' site');
  if (L === 'en') {
    for (const [i, [n, h1, h2]] of IG.entries()) await cek(sayfa(1080, 1350, h1, h2, [ham('en', n)], true), 1080, 1350, path.join(KOK, 'magaza', 'instagram', `ig_en_${String(i + 1).padStart(2, '0')}.jpg`));
    process.stdout.write(' instagram');
  }
  console.log(' ✓');
}
await b.close(); sunucu.closeAllConnections(); sunucu.close();
console.log('\n✅ Hazır: magaza/gorseller/ · magaza/instagram/ · site/img/shots/');
console.log('   GitHub Desktop → Commit → Push (site 1-2 dakikada güncellenir). Mağazaya yüklemek için KOMUTLAR 6.\n');
