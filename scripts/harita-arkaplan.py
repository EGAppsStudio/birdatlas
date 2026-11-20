# Site ve uygulama açılış ekranının soluk arka plan haritasını üretir:
#   site/img/bg-map-wide.svg (1024×500) + bg-map-tall.svg (1440×2560), aynıları www/img/ içine.
# Kurgusal bir kıyı: girintili sahil, koy, yarımada, adacıklar, göller, kıvrılan nehirler, parklar,
# yumuşak kıvrımlı ana yollar (kasabaları birbirine bağlar), onlardan dallanan ara yollar ve kasaba sokakları, demiryolu.
# Kullanım:  python3 scripts/harita-arkaplan.py [tohum]      (gerekenler: numpy, scipy, scikit-image)
import sys, math, os, random
import numpy as np
from scipy.ndimage import gaussian_filter, zoom
from skimage import measure

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOHUM = int(sys.argv[1]) if len(sys.argv) > 1 else 11

DENIZ, KARA, PARK = '#C3C8CC', '#E8EAE5', '#DCE3D3'
KENAR, YOL, RAY = '#D6D8D2', '#FFFFFF', '#B9BDB6'


def gurultu(rng, h, w, olcekler):
    """Katmanlı yumuşak gürültü (0 ortalama, ~1 sapma)."""
    t = np.zeros((h, w))
    for hucre, agirlik in olcekler:
        gh, gw = max(2, h // hucre + 2), max(2, w // hucre + 2)
        k = rng.standard_normal((gh, gw))
        b = zoom(k, (h / gh * 1.0001, w / gw * 1.0001), order=3)[:h, :w]
        t += agirlik * b
    return (t - t.mean()) / (t.std() + 1e-9)


def egri(pts, kapali=False, k=1.0):
    """Noktalardan yumuşak Catmull-Rom → kübik Bézier yol verisi."""
    pts = [tuple(p) for p in pts]
    if len(pts) < 2: return ''
    n = len(pts)
    def P(i):
        if kapali: return pts[i % n]
        return pts[min(max(i, 0), n - 1)]
    d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    son = n if kapali else n - 1
    for i in range(son):
        p0, p1, p2, p3 = P(i - 1), P(i), P(i + 1), P(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d + (' Z' if kapali else '')


def seyrelt(pts, adim):
    out = [pts[0]]
    for p in pts[1:]:
        if math.dist(p, out[-1]) >= adim: out.append(p)
    if len(out) > 2 and math.dist(out[-1], out[0]) < adim: out.pop()
    return out


def uret(W, H, u, rng, prng):
    S = 4                       # ızgara inceliği (piksel / hücre)
    gh, gw = H // S + 1, W // S + 1
    yy, xx = np.mgrid[0:gh, 0:gw] * S

    # ---------- kara / deniz ----------
    # deniz: sol-üstten içeri sokulan geniş bir körfez + sağ altta açık deniz; kenarlar gürültüyle girintili
    gr = gurultu(rng, gh, gw, [(int(150 * u / S), 1.0), (int(60 * u / S), .45), (int(22 * u / S), .2), (int(9 * u / S), .08)])
    nx, ny = xx / W, yy / H
    if W > H:   # geniş: deniz solda ve sağ altta, ortada kara kütlesi ve yarımada
        temel = (np.minimum(1, (nx - .10) * 2.2) * .8
                 - np.clip(.62 - np.hypot((nx - .0) * 1.0, (ny - .0) * 1.5), 0, 1) * 2.2
                 - np.clip(.40 - np.hypot((nx - .30) * 2.2, (ny - 1.05) * 1.6), 0, 1) * 2.4
                 - np.clip(.34 - np.hypot((nx - .98) * 1.6, (ny - .02) * 2.0), 0, 1) * 3.4
                 + .45)
    else:       # uzun: üstte girintili kıyı, sağda içeri sokulan koy, sol altta deniz
        def elips(cx, cy, rx, ry): return np.clip(1 - np.hypot((nx - cx) / rx, (ny - cy) / ry), 0, 1)
        temel = (.9 - 3.2 * elips(.30, -.06, .95, .27) - 3.2 * elips(1.12, .55, .55, .13)
                 - 3.2 * elips(-.08, 1.06, .62, .17) - 2.4 * elips(1.05, .02, .3, .12))
    yuk = gaussian_filter(temel + gr * .5, 1.0)
    kara = yuk > 0

    def sekiller(maske_degeri, esik, en_az):
        """Konturları (piksel koordinatında) döndürür."""
        cs = measure.find_contours(np.pad(maske_degeri, 1, constant_values=-9), esik)
        out = []
        for c in cs:
            p = [((x - 1) * S, (y - 1) * S) for y, x in c]
            alan = abs(sum(p[i][0] * p[i - 1][1] - p[i - 1][0] * p[i][1] for i in range(len(p)))) / 2
            if alan >= en_az: out.append(seyrelt(p, 5 * u))
        return out

    kara_sekil = sekiller(yuk, 0, 60 * u * u)

    # ---------- göller ----------
    gol_alani = gurultu(rng, gh, gw, [(int(40 * u / S), 1.0), (int(14 * u / S), .35)])
    uzaklik = yuk  # kıyıdan içeri ne kadar "yüksek"
    gol = np.where(uzaklik > .55, gol_alani, -9)
    gol_sekil = sorted(sekiller(gaussian_filter(gol, .8), 1.95, 60 * u * u), key=len, reverse=True)[:4]

    def karada(x, y, pay=0.05):
        i, j = int(round(y / S)), int(round(x / S))
        if not (0 <= i < gh and 0 <= j < gw): return True     # çerçeve dışı: serbest
        return yuk[i, j] > pay and not (gol[i, j] > 1.8)

    # ---------- parklar ----------
    park_alani = gurultu(rng, gh, gw, [(int(30 * u / S), 1.0), (int(10 * u / S), .3)])
    park = np.where(uzaklik > .25, park_alani, -9)
    park_sekil = sorted(sekiller(gaussian_filter(park, .8), 1.9, 200 * u * u), key=len, reverse=True)[:5]

    # ---------- nehirler: iç kısımdan denize, yükseklik eğimini izler ----------
    yg = gaussian_filter(yuk, 6)
    gy, gx = np.gradient(yg)
    nehirler = []
    adaylar = [(i, j) for i in range(0, gh, 6) for j in range(0, gw, 6) if yg[i, j] > .9]
    prng.shuffle(adaylar)
    for (i, j) in adaylar[:40]:
        if len(nehirler) >= 1: break
        x, y = j * S + .0, i * S + .0
        yol = [(x, y)]
        for _ in range(2000):
            ii, jj = int(y / S), int(x / S)
            if not (0 <= ii < gh and 0 <= jj < gw): break
            if yuk[ii, jj] < -.05: break
            dx, dy = -gx[ii, jj], -gy[ii, jj]
            n = math.hypot(dx, dy) + 1e-9
            a = math.atan2(dy / n, dx / n) + math.sin(len(yol) / 9.0) * .35
            x += math.cos(a) * 3 * u; y += math.sin(a) * 3 * u
            yol.append((x, y))
        ii, jj = int(y / S), int(x / S)
        if len(yol) > 60 and 0 <= ii < gh and 0 <= jj < gw and yg[ii, jj] < -.05:
            nehirler.append(seyrelt(yol, 9 * u))

    # ---------- kasabalar ----------
    kasabalar = []
    for _ in range(4000):
        x, y = prng.uniform(-.05, 1.05) * W, prng.uniform(-.05, 1.05) * H
        if not karada(x, y, .25): continue
        if any(math.dist((x, y), k) < 160 * u for k in kasabalar): continue
        kasabalar.append((x, y))
        if len(kasabalar) >= 7: break

    def kivrimli(a, b, sapma, adim):
        """a→b arası doğal kıvrımlı yol: düşük frekanslı yanal sapma."""
        L = math.dist(a, b); n = max(3, int(L / adim))
        nxv, nyv = -(b[1] - a[1]) / L, (b[0] - a[0]) / L
        f1, f2 = prng.uniform(.6, 1.4), prng.uniform(1.6, 2.6)
        p1, p2 = prng.uniform(0, 6.28), prng.uniform(0, 6.28)
        g = sapma * min(1, L / (300 * u))
        pts = []
        for t in np.linspace(0, 1, n + 1):
            s = math.sin(math.pi * t)
            o = g * s * (math.sin(f1 * math.pi * t + p1) * .8 + math.sin(f2 * math.pi * t + p2) * .3)
            pts.append((a[0] + (b[0] - a[0]) * t + nxv * o, a[1] + (b[1] - a[1]) * t + nyv * o))
        return pts

    def suya_girer(pts):
        return sum(not karada(x, y, -.02) for x, y in pts) > 1

    # ana yollar: en kısa bağlantı ağacı + birkaç ek bağlantı
    ana = []
    kenarlar = sorted(((math.dist(a, b), i, j) for i, a in enumerate(kasabalar) for j, b in enumerate(kasabalar) if i < j))
    kume = list(range(len(kasabalar)))
    def bul(i):
        while kume[i] != i: i = kume[i]
        return i
    ekstra = 0
    acilar = {i: [] for i in range(len(kasabalar))}
    def aci_bos(i, a):
        return all(abs((a - b + math.pi) % (2 * math.pi) - math.pi) > .75 for b in acilar[i])
    def ekle(i, j, pts):
        acilar[i].append(math.atan2(pts[2][1] - pts[0][1], pts[2][0] - pts[0][0]))
        acilar[j].append(math.atan2(pts[-3][1] - pts[-1][1], pts[-3][0] - pts[-1][0]))
        ana.append(pts)
    for L, i, j in kenarlar:
        pts = kivrimli(kasabalar[i], kasabalar[j], 45 * u, 12 * u)
        if suya_girer(pts): continue
        ai = math.atan2(pts[2][1] - pts[0][1], pts[2][0] - pts[0][0]); aj = math.atan2(pts[-3][1] - pts[-1][1], pts[-3][0] - pts[-1][0])
        if bul(i) != bul(j):
            kume[bul(i)] = bul(j); ekle(i, j, pts)
        elif ekstra < 1 and L < 380 * u and len(acilar[i]) < 3 and len(acilar[j]) < 3 and aci_bos(i, ai) and aci_bos(j, aj) and prng.random() < .6:
            ekstra += 1; ekle(i, j, pts)

    # çerçeve dışına çıkan yollar (harita kesilmiş gibi dursun)
    for ki, k in enumerate(kasabalar):
        if prng.random() < .35 and len(acilar[ki]) < 3:
            for _ in range(20):
                a = prng.uniform(0, 6.28)
                if aci_bos(ki, a): break
            else: continue
            acilar[ki].append(a)
            hedef = (k[0] + math.cos(a) * 600 * u, k[1] + math.sin(a) * 600 * u)
            pts = kivrimli(k, hedef, 40 * u, 12 * u)
            kes = []
            for p in pts:
                if not karada(*p, -.02): break
                kes.append(p)
            if len(kes) > 6: ana.append(kes)

    # ara yollar: kasabadan ve ana yollardan dallanan, yavaşça yön değiştiren yollar
    def dal(x, y, a, uzun, adim):
        pts = [(x, y)]; don = prng.uniform(-.04, .04)
        for _ in range(int(uzun / adim)):
            don += prng.uniform(-.03, .03); don = max(-.09, min(.09, don)); a += don
            x += math.cos(a) * adim; y += math.sin(a) * adim
            if not karada(x, y, .02): break
            pts.append((x, y))
        return pts

    ara = []
    for yol in ana:
        for _ in range(prng.randint(0, 1)):
            i = prng.randint(2, max(3, len(yol) - 3))
            if i >= len(yol) - 1: continue
            (x0, y0), (x1, y1) = yol[i - 1], yol[i + 1]
            a = math.atan2(y1 - y0, x1 - x0) + prng.choice([-1, 1]) * prng.uniform(.9, 1.6)
            p = dal(*yol[i], a, prng.uniform(60, 170) * u, 8 * u)
            if len(p) > 5: ara.append(p)

    # kasaba sokakları: merkez çevresinde kısa, hafif kıvrık sokaklar
    sokak = []
    for k in kasabalar:
        r = prng.uniform(26, 40) * u; don = prng.uniform(0, math.pi)
        ara_ = prng.uniform(13, 17) * u
        for yon in (don, don + math.pi / 2 + prng.uniform(-.25, .25)):
            ux, uy = math.cos(yon), math.sin(yon); vx, vy = -uy, ux
            for m in range(-1, 2):
                uz = r * math.sqrt(max(.15, 1 - (m * ara_ / r) ** 2)) * prng.uniform(.75, 1.0)
                bukum = prng.uniform(-.12, .12)
                pts = []
                for t in np.linspace(-uz, uz, 7):
                    off = m * ara_ + bukum * (t * t) / r
                    x, y = k[0] + ux * t + vx * off, k[1] + uy * t + vy * off
                    if karada(x, y, .02): pts.append((x, y))
                    elif len(pts) > 2: break
                    else: pts = []
                if len(pts) > 2: sokak.append(pts)

    # demiryolu: haritayı boydan boya geçen tek yumuşak hat (karada kalan parçaları)
    if W > H: a, b = (-40 * u, H * prng.uniform(.55, .85)), (W + 40 * u, H * prng.uniform(.2, .6))
    else:     a, b = (W * prng.uniform(.2, .5), H * .2), (W * prng.uniform(.5, .9), H + 40 * u)
    ray_pts = kivrimli(a, b, 60 * u, 10 * u)
    raylar, cur = [], []
    for p in ray_pts:
        if karada(*p, -.02): cur.append(p)
        else:
            if len(cur) > 4: raylar.append(cur)
            cur = []
    if len(cur) > 4: raylar.append(cur)

    # ---------- SVG ----------
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">',
         f'<rect width="{W}" height="{H}" fill="{DENIZ}"/>']
    o.append(f'<path fill="{KARA}" fill-rule="evenodd" d="' + ' '.join(egri(s, True) for s in kara_sekil) + '"/>')
    if park_sekil: o.append(f'<path fill="{PARK}" d="' + ' '.join(egri(s, True) for s in park_sekil) + '"/>')
    if gol_sekil: o.append(f'<path fill="{DENIZ}" d="' + ' '.join(egri(s, True) for s in gol_sekil) + '"/>')
    for n in nehirler:
        # nehir ağzına doğru kalınlaşır: üç parça
        par = max(2, len(n) // 3)
        for i, w in enumerate((1.4, 2.2, 3.2)):
            seg = n[i * par: (i + 1) * par + 1] if i < 2 else n[2 * par:]
            if len(seg) > 1: o.append(f'<path d="{egri(seg)}" fill="none" stroke="{DENIZ}" stroke-width="{w * u:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
    for r in raylar:
        o.append(f'<path d="{egri(r)}" fill="none" stroke="{RAY}" stroke-width="{2 * u:.1f}" stroke-dasharray="{8 * u:.0f} {5 * u:.0f}"/>')
    def katman(yollar, dis, ic):
        if not yollar: return
        d = ' '.join(egri(seyrelt(y, 10 * u if dis > 4 else 5 * u)) for y in yollar)
        o.append(f'<path d="{d}" fill="none" stroke="{KENAR}" stroke-width="{dis * u:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
        o.append(f'<path d="{d}" fill="none" stroke="{YOL}" stroke-width="{ic * u:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
    katman(sokak, 3.0, 1.5)
    katman(ara, 5.2, 2.9)
    katman(ana, 8.3, 4.6)
    o.append(f'<rect width="{W}" height="{H}" fill="#FFFFFF" opacity="0.4"/></svg>')
    return '\n'.join(o)


for ad, W, H, u in (('wide', 1024, 500, 1.0), ('tall', 1440, 2560, 2.5)):
    rng = np.random.default_rng(TOHUM); prng = random.Random(TOHUM)
    svg = uret(W, H, u, rng, prng)
    for kl in ('site/img', 'www/img'):
        with open(os.path.join(KOK, kl, f'bg-map-{ad}.svg'), 'w', encoding='utf-8') as f: f.write(svg)
    print(f'bg-map-{ad}.svg  {len(svg) / 1024:.0f} KB')
