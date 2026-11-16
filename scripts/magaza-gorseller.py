# Mağaza görsellerini ham ekran görüntülerinden üretir (Claude çalıştırır; Enes'in çalıştırması gerekmez).
#   girdi : magaza/ham-ekranlar/<dil>/ps_<dil>_NN_<ad>.jpg   (KOMUTLAR 9)
#   çıktı : magaza/gorseller/<dil>/telefon-01…08.jpg (1440×2560) + one-cikan.jpg (1024×500)
#           magaza/instagram/ig_en_01…10.jpg (1080×1350, yalnız İngilizce)
# Tasarım tarifi: proje dokümanı magaza-instagram-gorsel-tarifi.md
# Kullanım: python3 scripts/magaza-gorseller.py [dil ...]
import os, sys, glob
from playwright.sync_api import sync_playwright

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HAM, OUT, KAYNAK = f'{KOK}/magaza/ham-ekranlar', f'{KOK}/magaza/gorseller', f'{KOK}/magaza/kaynak'
F = '/usr/share/fonts/truetype/google-fonts'
DILLER = sys.argv[1:] or ['tr', 'en', 'es', 'pt', 'de', 'fr']

# 8 Play görseli: (ham ekran numaraları, başlık, alt başlık) – dil başına
SL = {
 'tr': [
  ([1], "Tüm eBird gözlemlerin tek haritada", "Daire büyüdükçe tür sayısı artar; her şey üstteki sekmelerde, bir dokunuş uzakta"),
  ([2, 3], "Takvim ve grafiklerle kuş yılın", "Bir güne dokun, o günü yeniden yaşa; aylık, haftalık grafikler ve yıl karşılaştırma"),
  ([4, 5], "Nerede, ne zaman gördüğünü hatırla", "Konum konum, tür tür listeler; gün gün neler gördüğün tek dokunuşta"),
  ([6], "Her yeni tür bir hatıra", "Kertik haritasında her türü ilk gördüğün yerde, fotoğrafıyla gör"),
  ([7], "Kendi fotoğraflarınla senin atlasın", "eBird'e yüklediğin ya da cihazından seçtiğin fotoğraflar; paylaşım kartlarında da onlar görünür"),
  ([8], "Kartla ya da bağlantıyla paylaş", "Yıl, ay, gün, gezi, tür ve kertik kartları; bağlantıyı arkadaşın uygulamasız açar"),
  ([9], "Maviş'e sor, verilerin konuşsun", "Dürbünlü asistanın gezilerini, kertiklerini ve en iyi günlerini anlatır"),
  ([10], "Çevrende şu an neler var?", "Haritaya dokun; seçtiğin çaptaki son 30 günün eBird kayıtlarını gör"),
 ],
 'en': [
  ([1], "All your eBird sightings on one map", "Bigger circles mean more species; everything is one tap away in the tabs"),
  ([2, 3], "Your bird year in calendars and charts", "Tap a day to relive it; monthly and weekly charts, compare years"),
  ([4, 5], "Remember where and when", "Lists by place and by species; every day in the field one tap away"),
  ([6], "Every lifer, a memory", "The lifer map shows each species where you first saw it, with its photo"),
  ([7], "Your atlas, your own photos", "Your eBird photos or shots from your device — they show on your share cards too"),
  ([8], "Share as a card or a link", "Year, month, day, trip, species and lifer cards; friends open links without the app"),
  ([9], "Ask Maviş and let your data talk", "Your binocular-toting assistant recalls your trips, lifers and best days"),
  ([10], "What's around you right now?", "Tap the map to see the last 30 days of eBird sightings nearby"),
 ],
 'es': [
  ([1], "Todos tus avistamientos de eBird en un mapa", "Círculos más grandes, más especies; todo a un toque en las pestañas"),
  ([2, 3], "Tu año pajarero en calendarios y gráficos", "Toca un día para revivirlo; gráficos mensuales y semanales, compara años"),
  ([4, 5], "Recuerda dónde y cuándo", "Listas por lugar y por especie; cada día de campo a un toque"),
  ([6], "Cada lifer, un recuerdo", "El mapa de lifers muestra cada especie donde la viste por primera vez, con su foto"),
  ([7], "Tu atlas, con tus propias fotos", "Tus fotos de eBird o de tu dispositivo; también aparecen en tus tarjetas"),
  ([8], "Comparte como tarjeta o enlace", "Tarjetas de año, mes, día, salida, especie y lifer; tus amigos abren el enlace sin la app"),
  ([9], "Pregunta a Maviş y deja hablar a tus datos", "Tu asistente con prismáticos recuerda tus salidas, lifers y mejores días"),
  ([10], "¿Qué hay a tu alrededor ahora?", "Toca el mapa y mira los avistamientos de eBird de los últimos 30 días cerca de ti"),
 ],
 'pt': [
  ([1], "Todas as suas observações do eBird em um mapa", "Círculos maiores, mais espécies; tudo a um toque nas abas"),
  ([2, 3], "Seu ano de passarinhada em calendários e gráficos", "Toque em um dia para revivê-lo; gráficos mensais e semanais, compare anos"),
  ([4, 5], "Lembre onde e quando", "Listas por local e por espécie; cada dia de campo a um toque"),
  ([6], "Cada lifer, uma lembrança", "O mapa de lifers mostra cada espécie onde você a viu pela primeira vez, com foto"),
  ([7], "Seu atlas, com suas próprias fotos", "Suas fotos do eBird ou do seu aparelho; elas aparecem também nos seus cartões"),
  ([8], "Compartilhe como cartão ou link", "Cartões de ano, mês, dia, saída, espécie e lifer; amigos abrem o link sem o app"),
  ([9], "Pergunte ao Maviş e deixe seus dados falarem", "Seu assistente de binóculos lembra suas saídas, lifers e melhores dias"),
  ([10], "O que há perto de você agora?", "Toque no mapa e veja as observações do eBird dos últimos 30 dias por perto"),
 ],
 'de': [
  ([1], "Alle deine eBird-Beobachtungen auf einer Karte", "Größere Kreise, mehr Arten; alles ist in den Tabs nur einen Tipp entfernt"),
  ([2, 3], "Dein Vogeljahr in Kalendern und Diagrammen", "Tippe auf einen Tag und erlebe ihn neu; Monats- und Wochendiagramme, Jahresvergleich"),
  ([4, 5], "Erinnere dich: wo und wann", "Listen nach Ort und nach Art; jeder Tag im Feld nur einen Tipp entfernt"),
  ([6], "Jeder Lifer eine Erinnerung", "Die Lifer-Karte zeigt jede Art dort, wo du sie zuerst gesehen hast – mit Foto"),
  ([7], "Dein Atlas mit deinen eigenen Fotos", "Deine eBird-Fotos oder Bilder vom Gerät – auch auf deinen Teilen-Karten"),
  ([8], "Als Karte oder Link teilen", "Jahres-, Monats-, Tages-, Exkursions-, Art- und Lifer-Karten; Freunde öffnen Links ohne App"),
  ([9], "Frag Maviş und lass deine Daten sprechen", "Dein Assistent mit Fernglas erinnert sich an Touren, Lifer und beste Tage"),
  ([10], "Was ist gerade in deiner Nähe?", "Tippe auf die Karte und sieh die eBird-Beobachtungen der letzten 30 Tage in der Umgebung"),
 ],
 'fr': [
  ([1], "Toutes vos observations eBird sur une carte", "Plus le cercle est grand, plus il y a d'espèces ; tout est à un toucher dans les onglets"),
  ([2, 3], "Votre année ornitho en calendriers et graphiques", "Touchez un jour pour le revivre ; graphiques mensuels et hebdomadaires, comparez les années"),
  ([4, 5], "Où et quand, en un coup d'œil", "Listes par site et par espèce ; chaque sortie à un toucher"),
  ([6], "Chaque lifer, un souvenir", "La carte des lifers montre chaque espèce là où vous l'avez vue la première fois, avec sa photo"),
  ([7], "Votre atlas, avec vos propres photos", "Vos photos eBird ou celles de votre appareil ; elles apparaissent aussi sur vos cartes"),
  ([8], "Partagez en carte ou en lien", "Cartes année, mois, jour, sortie, espèce et lifer ; vos amis ouvrent le lien sans l'appli"),
  ([9], "Demandez à Maviş, laissez parler vos données", "Votre assistant à jumelles se souvient de vos sorties, lifers et meilleurs jours"),
  ([10], "Qu'y a-t-il autour de vous ?", "Touchez la carte pour voir les observations eBird des 30 derniers jours à proximité"),
 ],
}
# Instagram (yalnız İngilizce): her ekran ayrı
IG = [
 (1, "All your eBird sightings on one map", "Bigger circles mean more species; everything is one tap away in the tabs"),
 (2, "Tap a day, relive it", "Which places, which species — your day in the field at a glance"),
 (3, "Your bird year in one chart", "Species, sightings, days or birds — monthly, weekly or year vs year"),
 (4, "Every place, day by day", "Sort your spots by species or rarity and see what you saw there, day by day"),
 (5, "Every species you've seen", "Photos, first sightings, places and dates — search in any language"),
 (6, "Every lifer, a memory", "The lifer map shows each species where you first saw it, with its photo"),
 (7, "Your atlas, your own photos", "Your eBird photos or shots from your device — they show on your share cards too"),
 (8, "Share as a card or a link", "Year, month, day, trip, species and lifer cards; friends open links without the app"),
 (9, "Ask Maviş and let your data talk", "Your binocular-toting assistant recalls your trips, lifers and best days"),
 (10, "What's around you right now?", "Tap the map to see the last 30 days of eBird sightings nearby"),
]
# Öne çıkan görsel (1024×500) metinleri
FG = {
 'es': ("Bird ", "Atlas", "Tu mapa personal de aves", ["🗺️ Mapa", "🏆 Lifers", "📊 Gráficos", "🐦 Maviş", "📤 Tarjetas", "📷 Tus fotos"], "¡Hola! Soy Maviş 👋"),
 'pt': ("Bird ", "Atlas", "Seu mapa pessoal de aves", ["🗺️ Mapa", "🏆 Lifers", "📊 Gráficos", "🐦 Maviş", "📤 Cartões", "📷 Suas fotos"], "Olá! Eu sou o Maviş 👋"),
 'de': ("Bird ", "Atlas", "Deine persönliche Vogelkarte", ["🗺️ Karte", "🏆 Lifer", "📊 Diagramme", "🐦 Maviş", "📤 Teilen-Karten", "📷 Eigene Fotos"], "Hallo! Ich bin Maviş 👋"),
 'fr': ("Bird ", "Atlas", "Votre carte ornitho personnelle", ["🗺️ Carte", "🏆 Lifers", "📊 Graphiques", "🐦 Maviş", "📤 Cartes à partager", "📷 Vos photos"], "Salut ! Moi, c'est Maviş 👋"),
}
FG_EN = ("Bird ", "Atlas", "Your personal birding map", ["🗺️ Map", "🏆 Lifers", "📊 Charts", "🐦 Maviş", "📤 Share cards", "📷 Your own photos"], "Hi! I'm Maviş 👋")

CSS = f"""@font-face{{font-family:P;src:url('file://{F}/Poppins-Bold.ttf');font-weight:700}}
@font-face{{font-family:P;src:url('file://{F}/Poppins-Regular.ttf');font-weight:400}}
body{{margin:0;overflow:hidden;position:relative;font-family:P;background:#F4F7FB}}
.bg{{position:absolute;inset:0;background:linear-gradient(180deg,#F8FAFD 0%,#EEF3FA 45%,#E3ECF8 100%)}}
.glow{{position:absolute;border-radius:50%}}
.g1{{background:radial-gradient(circle,rgba(233,196,64,.20) 0%,rgba(233,196,64,0) 70%)}}
.g2{{background:radial-gradient(circle,rgba(46,98,181,.14) 0%,rgba(46,98,181,0) 70%)}}
.cap{{position:absolute;text-align:center}}
h1{{margin:0;text-wrap:balance;font-weight:700;color:#1C3A6B;letter-spacing:-1px}}
h2{{margin:0;text-wrap:balance;font-weight:400;color:#4A5B70}}
.phone{{position:absolute;background:#1B1E24;box-sizing:border-box;box-shadow:0 40px 80px rgba(10,40,80,.28),0 0 0 3px #3a3f48 inset}}
.scr{{width:100%;height:100%;overflow:hidden;background:#fff}}
.scr img{{width:100%;height:100%;object-fit:cover;object-position:top}}"""

def dots(sz):
    r = sz / 2.3
    return f'<svg width="{sz*6}" height="{sz*1.2}"><circle cx="{sz*.85}" cy="{sz*.6}" r="{r}" fill="#2E62B5"/><circle cx="{sz*3}" cy="{sz*.6}" r="{r}" fill="#E9C440"/><circle cx="{sz*5.15}" cy="{sz*.6}" r="{r}" fill="#1C3A6B"/></svg>'
def phone(img, x, y, w, rot=0):
    h = w * 1.92; pad = w * .022; rad = w * .078
    return f'<div class="phone" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:{rad}px;padding:{pad}px;transform:rotate({rot}deg)"><div class="scr" style="border-radius:{rad-pad}px"><img src="file://{img}"></div></div>'
def page(W, H, h1, h2, imgs, ig=False):
    if not ig:
        fs = 82 if len(h1) <= 38 else 74   # uzun başlıklar (ES/PT/DE/FR) biraz küçük
        cap = f'<div class="cap" style="top:120px;left:100px;right:100px"><h1 style="font-size:{fs}px;line-height:1.12">{h1}</h1><div style="margin:30px 0 22px">{dots(12)}</div><h2 style="font-size:42px;line-height:1.35">{h2}</h2></div>'
        if len(imgs) == 1: ph = phone(imgs[0], (W - 1000) / 2, 660, 1000)
        else: ph = phone(imgs[0], 40, 680, 690, -3) + phone(imgs[1], 710, 800, 690, 3)
        g = '<div class="glow g1" style="width:900px;height:900px;left:-360px;top:900px"></div><div class="glow g2" style="width:1000px;height:1000px;right:-420px;top:1500px"></div>'
    else:
        cap = f'<div class="cap" style="top:64px;left:70px;right:70px"><h1 style="font-size:54px;line-height:1.12">{h1}</h1><div style="margin:16px 0 12px">{dots(8)}</div><h2 style="font-size:27px;line-height:1.35">{h2}</h2></div>'
        ph = phone(imgs[0], (W - 620) / 2, 365, 620)
        g = '<div class="glow g1" style="width:700px;height:700px;left:-300px;top:500px"></div><div class="glow g2" style="width:760px;height:760px;right:-320px;top:700px"></div>'
    return f'<html><head><meta charset="utf-8"><style>{CSS} body{{width:{W}px;height:{H}px}}</style></head><body><div class="bg"></div>{g}{cap}{ph}</body></html>'

def ham(L, n):
    f = glob.glob(f'{HAM}/{L}/ps_{L}_{n:02d}_*.jpg')
    if not f: raise SystemExit(f'eksik ham ekran: {L} {n}')
    return f[0]

TMP = '/tmp/magaza-gorseller'; os.makedirs(TMP, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    def shot(html, W, H, out, q=92):
        hp = f'{TMP}/sayfa.html'; open(hp, 'w', encoding='utf-8').write(html)
        pg = b.new_page(viewport={'width': W, 'height': H}); pg.goto('file://' + hp); pg.wait_for_timeout(400)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        pg.screenshot(path=out, type='jpeg', quality=q); pg.close()
    for L in DILLER:
        for i, (nums, h1, h2) in enumerate(SL[L], 1):
            if L == 'fr':   # Fransızcada ; : ? ! öncesi bölünmez boşluk (satır başına düşmesin)
                h1, h2 = [x.replace(' ;', '\u00a0;').replace(' :', '\u00a0:').replace(' ?', '\u00a0?').replace(' !', '\u00a0!') for x in (h1, h2)]
            shot(page(1440, 2560, h1, h2, [ham(L, n) for n in nums]), 1440, 2560, f'{OUT}/{L}/telefon-{i:02d}.jpg')
        if L in FG:   # öne çıkan görsel, o dilde
            t1, t2, alt, chips, selam = FG[L]; e1, e2, ealt, echips, eselam = FG_EN
            h = open(f'{KAYNAK}/one-cikan.html', encoding='utf-8').read().replace('src="map.png', f'src="file://{KAYNAK}/map.png').replace('src="logo.png', f'src="file://{KAYNAK}/logo.png')
            h = h.replace(f'>{ealt}<', f'>{alt}<').replace(f'>{eselam}<', f'>{selam}<')
            for a, c in zip(echips, chips): h = h.replace(f'>{a}<', f'>{c}<')
            shot(h, 1024, 500, f'{OUT}/{L}/one-cikan.jpg', 94)
        print(L, 'ok')
    if 'en' in DILLER:
        for i, (n, h1, h2) in enumerate(IG, 1):
            shot(page(1080, 1350, h1, h2, [ham('en', n)], ig=True), 1080, 1350, f'{KOK}/magaza/instagram/ig_en_{i:02d}.jpg')
        print('instagram ok')
    b.close()
