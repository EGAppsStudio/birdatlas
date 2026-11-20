# Maviş parçaları: magaza/maskot/<n>-<ad>.png (Copilot, magenta zemin) → arka planı temizle, kırp.
# Çıktı: magaza/maskot/temiz/<ad>.png (şeffaf). Birleştirme: scripts/maskot-birlestir.py
# Kullanım: python3 scripts/maskot.py
import os, numpy as np
from PIL import Image

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(KOK, 'magaza', 'maskot'); OUT = os.path.join(D, 'temiz')
os.makedirs(OUT, exist_ok=True)

def temizle(ad, kaynak):
    a = np.asarray(Image.open(os.path.join(D, kaynak)).convert('RGB')).astype(np.float32)
    h, w, _ = a.shape
    # zemin rengi: kenarlardaki piksellerin ortancası
    kenar = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(kenar, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(-1))
    al = np.clip((d - 60) / 80, 0, 1)                      # zemine yakın → şeffaf (zemin gürültüsü < 55)
    al[:6] = al[-6:] = 0; al[:, :6] = al[:, -6:] = 0       # kenardaki sıkıştırma çerçevesi (jpg) parça sayılmasın
    # yarı saydam kenarlarda magenta sızıntısını çıkar
    m = al[..., None]
    rgb = np.where(m > 0.02, (a - (1 - m) * bg) / np.maximum(m, 0.02), 0)
    rgb = np.clip(rgb, 0, 255)
    img = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
    img = img.crop(Image.fromarray(((al > .25) * 255).astype(np.uint8)).getbbox())
    img.save(os.path.join(OUT, ad + '.png'))
    print(ad, img.size, 'zemin', bg.astype(int))

for kaynak in sorted(os.listdir(D)):
    if kaynak.endswith('.png') and kaynak[0].isdigit() and not kaynak.startswith('1-'):
        temizle(kaynak.split('-', 1)[1][:-4], kaynak)
