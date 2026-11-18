// Mağaza ekran görüntüleri: uygulamanın web sürümünü telefon boyutunda açar, örnek veriyle
// 10 ekranı 6 dilde çeker → magaza/ham-ekranlar/<dil>/ps_<dil>_01_harita.jpg … (60 görüntü).
// Başlıklı, çerçeveli mağaza/site/Instagram görselleri: scripts/gorseller.mjs (KOMUTLAR 7 ikisini birlikte çalıştırır).
//
// Kullanım (KOMUTLAR.bat 9):   npm run ekranlar            → 6 dil
//                              npm run ekranlar -- de fr   → yalnız bu diller
// Başta Gemini ve eBird anahtarı sorulur (boş bırakılabilir); yalnız bu çekim için kullanılır, hiçbir yere yazılmaz.
// Tarayıcı indirilmez: bilgisayardaki Microsoft Edge (yoksa Chrome) kullanılır; pencere görünür (adım adım izlenebilir, Ctrl+C durdurur).
// Kişisel veri yok: uygulamanın kurgusal örnek verisi kullanılır.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { KOK, TUM_DILLER, EKRANLAR, tarayici, sayfaAc, sifirla, oturt, sunucu } from './ekran-ortak.mjs';

const CIKTI = path.join(KOK, 'magaza', 'ham-ekranlar');
const DILLER = process.argv.slice(2).filter(a => /^[a-z]{2}$/.test(a));
let LANGS = DILLER.length ? DILLER : TUM_DILLER;
// Hangi ekranlar: --ekran=9 ya da --ekran=8,9 (yoksa başta sorulur; Enter = hepsi)
let SECILI = ((process.argv.find(a => a.startsWith('--ekran=')) || '').split('=')[1] || '').split(',').map(Number).filter(Boolean);
if (process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (!SECILI.length) {
    console.log('\nEkranlar: 1 harita · 2 takvim · 3 grafik · 4 konumlar · 5 türler · 6 kertik · 7 foto · 8 paylaş · 9 Maviş · 10 Keşfet');
    SECILI = (await rl.question('  Hangileri çekilsin? (Enter = hepsi; ör. 9 ya da 8,9): ')).split(/[\s,]+/).map(Number).filter(Boolean);
    console.log(SECILI.length ? `    ✓ yalnız: ${SECILI.join(', ')}` : '    ✓ hepsi');
  }
  if (!DILLER.length) {
    let d = (await rl.question('  Hangi diller? (Enter = hepsi; ör. de ya da tr,en): ')).toLowerCase().split(/[\s,]+/).filter(x => TUM_DILLER.includes(x));
    if (d.length) LANGS = d;
    console.log(`    ✓ ${LANGS.join(', ')}  (aynı adlı eski görüntülerin üstüne yazılır, silmene gerek yok)`);
  }
  rl.close();
}

const b = await tarayici({ pencere: [460, 900] });
let toplam = 0;
console.log(`\n📸 Mağaza ekran görüntüleri · diller: ${LANGS.join(', ')}\n`);
for (const L of LANGS) {
  const klasor = path.join(CIKTI, L); fs.mkdirSync(klasor, { recursive: true });
  process.stdout.write(`• ${L}: açılıyor`);
  const { ctx, pg } = await sayfaAc(b, L, 3);
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
await b.close(); sunucu.closeAllConnections(); sunucu.close();
console.log(`\n✅ ${toplam} ekran görüntüsü: magaza/ham-ekranlar/`);
console.log('   Görseller için: npm run gorseller (KOMUTLAR 7 ikisini birlikte yapar).\n');
