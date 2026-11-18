# Maviş: temiz parçaları (magaza/maskot/temiz, scripts/maskot.py) yerleştirip uygulamaya gömülecek JS'i yazar.
# Çıktı: www/img/mavis/<ad>.webp + yerleşim (www/img/mavis/yerlesim.json; index.html'deki MAVIS_P'ye elle kopyalanır)
# Yerleşim 1254×1254 tuvalde (Copilot görselinin boyutu); gövde kendi yerinde durur, diğerleri ona göre.
import os, io, base64, json
from PIL import Image, ImageOps

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(KOK, 'magaza', 'maskot', 'temiz')
OLCEK = 560 / 1254          # gömülen resimlerin çözünürlüğü: tuval 560 px (paylaşım kartında Maviş ≤ 400 px)

# ad: (kaynak, x, y, genişlik, aynala)  — x, y sol üst köşe (1254 tuvalde)
def goz(kaynak, sol):        # göz çiftinden tek gözü kes
    im = Image.open(os.path.join(T, kaynak)); w = im.width
    return im.crop((0, 0, w // 2, im.height)) if sol else im.crop((w // 2, 0, w, im.height))

OUT = os.path.join(KOK, 'www', 'img', 'mavis'); os.makedirs(OUT, exist_ok=True)
P = {}
def koy(ad, im, cx, cy, gen, aynala=False):
    im = im.crop(im.getbbox())
    if aynala: im = ImageOps.mirror(im)
    h = gen * im.height / im.width
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

# yerleşim: aşağıdaki satır index.html'deki MAVIS_P'ye kopyalanır
print(json.dumps(P, separators=(',', ':')))
print('KB', {f: os.path.getsize(os.path.join(OUT, f)) // 1024 for f in os.listdir(OUT)})
