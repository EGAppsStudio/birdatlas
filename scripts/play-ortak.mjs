// Google Play Developer API için ortak yardımcılar (anahtar bulma, oturum, istek).
// Anahtar (service account JSON) proje DIŞINDA durur: PLAY_ANAHTAR ya da Belgeler\kus-atlasi\*.json
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const API = process.env.PLAY_API_KOK || 'https://androidpublisher.googleapis.com';

export const hata = (m) => { console.error('\n❌ ' + m + '\n'); process.exit(1); };

// ---------- Anahtarı bul ----------
export function anahtarBul() {
  const adaylar = [];
  if (process.env.PLAY_ANAHTAR) adaylar.push(process.env.PLAY_ANAHTAR);
  const klasorler = [
    path.join(os.homedir(), 'Documents', 'kus-atlasi'),
    path.join(os.homedir(), 'Belgeler', 'kus-atlasi'),
    path.join(os.homedir(), 'OneDrive', 'Documents', 'kus-atlasi'),
    path.join(os.homedir(), 'OneDrive', 'Belgeler', 'kus-atlasi'),
  ];
  for (const k of klasorler) {
    try { for (const f of fs.readdirSync(k)) if (f.toLowerCase().endsWith('.json')) adaylar.push(path.join(k, f)); } catch (e) {}
  }
  for (const a of adaylar) {
    try {
      const j = JSON.parse(fs.readFileSync(a, 'utf8'));
      if (j.type === 'service_account' && j.private_key && j.client_email) {
        if (a.startsWith(KOK + path.sep)) hata('Anahtar dosyası proje klasörünün İÇİNDE: ' + a + '\n   Onu Belgeler\\kus-atlasi\\ klasörüne taşı (depoya girmesin).');
        return { j, yol: a };
      }
    } catch (e) {}
  }
  hata('Service account anahtarı (.json) bulunamadı.\n   Belgeler\\kus-atlasi\\ klasörüne koy ya da PLAY_ANAHTAR ortam değişkenine dosya yolunu yaz.');
}

// ---------- Erişim jetonu (JWT, RS256) ----------
const b64u = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
export async function jetonAl(k) {
  const simdi = Math.floor(Date.now() / 1000);
  const uri = k.token_uri || 'https://oauth2.googleapis.com/token';
  const govde = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64u(JSON.stringify({
    iss: k.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: uri, iat: simdi, exp: simdi + 3600,
  }));
  const imza = crypto.createSign('RSA-SHA256').update(govde).sign(k.private_key);
  const r = await fetch(uri, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: govde + '.' + b64u(imza) }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) hata('Google oturumu açılamadı (' + r.status + '): ' + (j.error_description || j.error || 'bilinmeyen hata'));
  return j.access_token;
}

// ---------- API yardımcıları ----------
let JETON = null;
export const jetonKoy = (j) => { JETON = j; };
export async function istek(yontem, yol, govde, tur) {
  const r = await fetch(API + yol, {
    method: yontem,
    headers: { Authorization: 'Bearer ' + JETON, ...(govde ? { 'Content-Type': tur || 'application/json' } : {}) },
    body: govde ? (tur ? govde : JSON.stringify(govde)) : undefined,
  });
  const metin = await r.text();
  let j = {}; try { j = metin ? JSON.parse(metin) : {}; } catch (e) {}
  if (!r.ok) {
    const m = (j.error && j.error.message) || metin || r.statusText;
    const e = new Error(yontem + ' ' + yol.replace(/\/edits\/[^/:]+/, '/edits/…') + ' → ' + r.status + ': ' + m); e.durum = r.status; throw e;
  }
  return j;
}

