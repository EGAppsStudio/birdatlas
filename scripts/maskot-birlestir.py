# Maviş: temiz parçaları (magaza/maskot/temiz, scripts/maskot.py) yerleştirip uygulamaya gömülecek JS'i yazar.
# Çıktı: www/img/mavis/<ad>.webp + yerleşim (www/img/mavis/yerlesim.json; index.html'deki MAVIS_P'ye elle kopyalanır)
# Yerleşim 1254×1254 tuvalde (Copilot görselinin boyutu); gövde kendi yerinde durur, diğerleri ona göre.
import os, io, base64, json
from PIL import Image, ImageOps, ImageFilter

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(KOK, 'magaza', 'maskot', 'temiz')
OLCEK = 560 / 1254          # gömülen resimlerin çözünürlüğü: tuval 560 px (paylaşım kartında Maviş ≤ 400 px)

# ad: (kaynak, x, y, genişlik, aynala)  — x, y sol üst köşe (1254 tuvalde)
def goz(kaynak, sol):        # göz çiftinden tek gözü kes
    im = Image.open(os.path.join(T, kaynak)); w = im.width
    return im.crop((0, 0, w // 2, im.height)) if sol else im.crop((w // 2, 0, w, im.height))

OUT = os.path.join(KOK, 'www', 'img', 'mavis'); os.makedirs(OUT, exist_ok=True)
P = {}
def koy(ad, im, cx, cy, gen, aynala=False, ust=None):
    im = im.crop(im.getbbox())
    if aynala: im = ImageOps.mirror(im)
    h = gen * im.height / im.width
    if ust is not None: cy = ust + h / 2         # üst kenarı sabit yerleştir
    px = max(1, round(gen * OLCEK * 1.5)), max(1, round(h * OLCEK * 1.5))   # 1.5x keskinlik
    im = im.resize(px, Image.LANCZOS)
    im.save(os.path.join(OUT, ad + '.webp'), 'WEBP', quality=88, method=6)
    P[ad] = [round(cx - gen / 2), round(cy - h / 2), round(gen), round(h)]

govde = Image.open(os.path.join(T, 'govde.png'))
koy('govde', govde, (253 + 998) / 2, (37 + 1201) / 2, 998 - 253)
kanat = Image.open(os.path.join(T, 'kanat.png'))
koy('kanatL', kanat, 275, 885, 215, aynala=True)
koy('kanatR', kanat, 975, 885, 215)
koy('gozL', goz('goz-acik.png', True), 465, 448, 150)
koy('gozR', goz('goz-acik.png', False), 785, 448, 150)
koy('kapaliL', goz('goz-kapali.png', True), 465, 455, 165)
koy('kapaliR', goz('goz-kapali.png', False), 785, 455, 165)
koy('durbun', Image.open(os.path.join(T, 'durbun.png')), 627, 880, 390)

# --- 20 Kasım: yeni parçalar (konuşma/ötme, mutlu/şaşkın/uykulu gözler, uçuş kanatları, kabaran tepe) ---
def ac(ad): return Image.open(os.path.join(T, ad + '.png'))
def cerceve(im, px):                 # mutlu göz yayları koyu göz bandında kaybolmasın: beyaz kontur
    im = im.crop(im.getbbox()); pad = px + 2
    big = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0)); big.alpha_composite(im, (pad, pad))
    a = big.split()[3].filter(ImageFilter.MaxFilter(px * 2 + 1))
    out = Image.new('RGBA', big.size, (0, 0, 0, 0)); out.paste(Image.new('RGBA', big.size, (250, 250, 250, 255)), (0, 0), a)
    out.alpha_composite(big); return out
def yari(im, sol):
    w = im.width; im = im.crop((0, 0, w // 2, im.height)) if sol else im.crop((w // 2, 0, w, im.height)); return im.crop(im.getbbox())
koy('gaga', ac('gaga-acik'), 622, 0, 112, ust=447)
m = cerceve(ac('goz-mutlu'), 10)
koy('mutluL', yari(m, True), 465, 452, 150); koy('mutluR', yari(m, False), 785, 452, 150)
s_ = ac('goz-saskin'); koy('saskinL', yari(s_, True), 465, 446, 178); koy('saskinR', yari(s_, False), 785, 446, 178)
u = ac('goz-uykulu'); koy('uykuL', yari(u, True), 465, 438, 168); koy('uykuR', yari(u, False), 785, 438, 168)
koy('acikL', ac('kanat-acik'), 250, 0, 320, ust=490); koy('acikR', ac('kanat-acik'), 1004, 0, 320, True, ust=490)
koy('tepe', ac('tepe'), 624, 0, 690, ust=10)

# yerleşim: aşağıdaki satır index.html'deki MAVIS_P'ye kopyalanır
print(json.dumps(P, separators=(',', ':')))
print('KB', {f: os.path.getsize(os.path.join(OUT, f)) // 1024 for f in os.listdir(OUT)})
