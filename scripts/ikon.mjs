// Uygulamanın logosundan tüm Android ikonlarını, açılış ekranını ve Play Store ikonunu üretir.
// Kullanım:  npm run ikon                      (uygulamadaki mevcut logoyu kullanır)
//            npm run ikon -- C:\yol\logo.png   (başka bir resim kullanmak istersen)
import sharp from 'sharp';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Logo artık pakete gömülü (internetten indirilmez)
const src = process.argv[2] || (existsSync('assets/logo-kaynak.png') ? 'assets/logo-kaynak.png' : 'www/img/logo.png');

console.log('Logo alınıyor: ' + src);
const input = readFileSync(src);

mkdirSync('assets', { recursive: true });
mkdirSync('www/img', { recursive: true });

// Kare 1024x1024 (uygulama içinde olduğu gibi ortadan kırpılmış)
const square = await sharp(input).resize(1024, 1024, { fit: 'cover' }).flatten({ background: '#FFFFFF' }).png().toBuffer();
// Yuvarlak kesilmiş hâli (uygulamadaki daire görünümü)
const circleMask = Buffer.from('<svg width="1024" height="1024"><circle cx="512" cy="512" r="512" fill="#fff"/></svg>');
const round = await sharp(square).composite([{ input: circleMask, blend: 'dest-in' }]).png().toBuffer();

const white = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: '#FFFFFF' } });
const clear = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });

// Uygulama içindeki logo artık internetten değil buradan
await sharp(square).toFile('www/img/logo.png');
// Eski Android sürümleri için düz ikon: beyaz zemin üzerinde yuvarlak logo
await white(1024, 1024).composite([{ input: await sharp(round).resize(900, 900).toBuffer(), gravity: 'center' }]).png().toFile('assets/icon-only.png');
// Yeni Android "uyarlanabilir" ikon: logo güvenli bölgede (%66), arka plan beyaz
await clear(1024, 1024).composite([{ input: await sharp(round).resize(660, 660).toBuffer(), gravity: 'center' }]).png().toFile('assets/icon-foreground.png');
await white(1024, 1024).png().toFile('assets/icon-background.png');
// Açılış ekranı
await white(2732, 2732).composite([{ input: await sharp(round).resize(700, 700).toBuffer(), gravity: 'center' }]).png().toFile('assets/splash.png');
// Play Console'a yükleyeceğin 512x512 ikon (Google köşeleri kendisi yuvarlar)
await white(512, 512).composite([{ input: await sharp(round).resize(450, 450).toBuffer(), gravity: 'center' }]).png().toFile('play-store-ikon-512.png');

console.log('✓ Kaynak resimler hazır, Android ikonları üretiliyor...');
execSync('npx capacitor-assets generate --android', { stdio: 'inherit' });
console.log('\n✓ Bitti. Şimdi:  npm run sync   ve Android Studio\'da ▶');
console.log('  Play Console ikonu: play-store-ikon-512.png');
