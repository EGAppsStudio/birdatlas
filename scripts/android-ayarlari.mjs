// npm run sync sonunda otomatik çalışır:
//  1) Telefondaki uygulama adı: Türkçe telefonlarda "Kuş Atlası", diğer dillerde "Bird Atlas"
//  2) Sürüm numarası package.json'dan alınır (ör. 1.8.0 → versionName "1.8", versionCode 108)
//     Böylece build.gradle'ı elle değiştirmeye gerek kalmaz.
//  3) Telefonun yazı boyutu çok büyükse uygulama içi yazı en fazla %115 olur (taşmaları önler)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TR_NAME = 'Kuş Atlası';
const EN_NAME = 'Bird Atlas';
const root = process.cwd();
const app = join(root, 'android', 'app');
if (!existsSync(app)) { console.log('android klasörü yok (önce: npx cap add android). Bu adım atlandı.'); process.exit(0); }

// --- 1) Uygulama adı
const res = join(app, 'src', 'main', 'res');
const def = join(res, 'values', 'strings.xml');
if (existsSync(def)) {
  let xml = readFileSync(def, 'utf8');
  for (const key of ['app_name', 'title_activity_main']) {
    xml = xml.replace(new RegExp(`(<string name="${key}">)[^<]*(</string>)`), `$1${EN_NAME}$2`);
  }
  writeFileSync(def, xml);
  mkdirSync(join(res, 'values-tr'), { recursive: true });
  writeFileSync(join(res, 'values-tr', 'strings.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${TR_NAME}</string>
    <string name="title_activity_main">${TR_NAME}</string>
</resources>
`);
}

// --- 2) Sürüm
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const [maj, min, patch] = pkg.version.split('.').map(Number);
const versionName = patch ? `${maj}.${min}.${patch}` : `${maj}.${min}`;
const versionCode = maj * 100 + min;          // 1.8 → 108, 1.9 → 109, 2.0 → 200
const gradle = join(app, 'build.gradle');
if (existsSync(gradle)) {
  let g = readFileSync(gradle, 'utf8');
  g = g.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`).replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  writeFileSync(gradle, g);
}

// --- 3) Yazı büyütmesi sınırı (MainActivity.java; yalnızca Capacitor'ın varsayılan dosyasıysa değiştirilir)
function findFile(dir, name) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { const r = findFile(p, name); if (r) return r; }
    else if (f === name) return p;
  }
  return null;
}
const javaDir = join(app, 'src', 'main', 'java');
const ma = existsSync(javaDir) ? findFile(javaDir, 'MainActivity.java') : null;
let zoomMsg = 'yazı sınırı: MainActivity bulunamadı';
if (ma) {
  let j = readFileSync(ma, 'utf8');
  if (j.includes('setTextZoom')) zoomMsg = 'yazı sınırı %115 (zaten var)';
  else if (/public class MainActivity extends BridgeActivity\s*\{\s*\}/.test(j)) {
    j = j.replace('import com.getcapacitor.BridgeActivity;', 'import android.webkit.WebSettings;\nimport com.getcapacitor.BridgeActivity;')
         .replace(/public class MainActivity extends BridgeActivity\s*\{\s*\}/, `public class MainActivity extends BridgeActivity {
    // Kuş Atlası: telefonun yazı boyutu çok büyükse uygulama içinde en fazla %115'e sınırla
    @Override
    public void onResume() {
        super.onResume();
        try {
            WebSettings s = getBridge().getWebView().getSettings();
            if (s.getTextZoom() > 115) s.setTextZoom(115);
        } catch (Exception e) { }
    }
}`);
    writeFileSync(ma, j);
    zoomMsg = 'yazı sınırı %115 eklendi';
  } else zoomMsg = 'yazı sınırı: MainActivity elle değiştirilmiş, dokunulmadı';
}

console.log(`✓ Uygulama adı: "${TR_NAME}" (Türkçe) / "${EN_NAME}" (diğer diller) · Sürüm ${versionName} (kod ${versionCode}) · ${zoomMsg}`);
