# Kurgusal örnek veriyi üretir: www/data/ornek-veri.csv (eBird "My eBird Data" biçiminde, ~1000 satır).
# Dünyaya yayılmış ~50 gözlem alanı, İngilizce ve temiz yer adları; aynı türler farklı yerlerde ve tarihlerde.
# Ekran görüntüsü / video / tur bu veriye dayanır (scripts/ekran-ortak.mjs, scripts/video.mjs):
#   - 2025-08-12 Camargue: zengin gün (takvim ekranı) · 2025 Eylül: göç ayı (grafik ekranı)
#   - "Central Park, The Ramble" (konumlar ekranı) · Merops apiaster birçok yerde (türler ekranı)
#   - Lake Nakuru'da Coracias caudatus (kertik ekranı) · Circus aeruginosus (fotoğraf ekranı)
#   - 2026'nın en zengin günü: 2026-04-11 Doñana (Maviş'in örnek cevabı)
# Kullanım: python3 scripts/ornek-veri.py      (aynı tohumla hep aynı dosya)
import csv, json, os, random

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = random.Random(2026)
TAX = json.load(open(os.path.join(KOK, 'www', 'data', 'ebird-taxonomy.json'), encoding='utf-8'))['rows']
SIRA = {r[0]: (i + 1, r[2]) for i, r in enumerate(TAX)}   # bilimsel ad → (sistematik sıra, İngilizce ad)

# Ortak tür grupları (sayı aralığıyla)
SULAK_AV = [('Ardea cinerea', 1, 8), ('Ardea alba', 1, 12), ('Egretta garzetta', 2, 20), ('Fulica atra', 10, 300), ('Anas platyrhynchos', 4, 60),
            ('Tachybaptus ruficollis', 1, 12), ('Podiceps cristatus', 2, 40), ('Circus aeruginosus', 1, 4), ('Phalacrocorax carbo', 2, 40),
            ('Alcedo atthis', 1, 2), ('Himantopus himantopus', 2, 30), ('Tringa totanus', 2, 25), ('Chroicocephalus ridibundus', 5, 150)]
ACIK_AV = [('Ciconia ciconia', 2, 60), ('Merops apiaster', 3, 40), ('Hirundo rustica', 5, 80), ('Galerida cristata', 1, 8), ('Falco tinnunculus', 1, 3),
           ('Buteo buteo', 1, 4), ('Passer domesticus', 5, 40), ('Pica pica', 1, 8), ('Upupa epops', 1, 3), ('Coracias garrulus', 1, 4)]
ORMAN_AV = [('Erithacus rubecula', 1, 6), ('Parus major', 1, 10), ('Cyanistes caeruleus', 1, 8), ('Fringilla coelebs', 2, 20), ('Turdus merula', 1, 8),
            ('Sylvia atricapilla', 1, 6), ('Dendrocopos major', 1, 3), ('Sitta europaea', 1, 4), ('Garrulus glandarius', 1, 4), ('Columba palumbus', 2, 30)]

# Yer: ad, bölge kodu, enlem, boylam, [ziyaret tarihleri], tür listesi
YERLER = [
    # ---- Türkiye ----
    ('Lake Eymir', 'TR-06', 39.830540, 32.833496, ['2023-03-11', '2024-05-04', '2025-11-15', '2026-10-17'],
     SULAK_AV[:9] + [('Oxyura leucocephala', 2, 30), ('Aythya ferina', 5, 80), ('Netta rufina', 2, 40), ('Phoenicopterus roseus', 2, 60),
                     ('Larus michahellis', 5, 60), ('Galerida cristata', 1, 6), ('Merops apiaster', 4, 30), ('Hirundo rustica', 5, 50)]),
    ('Lake Mogan', 'TR-06', 39.768150, 32.796650, ['2023-04-22', '2024-09-07', '2026-06-20'],
     SULAK_AV + [('Aythya nyroca', 2, 20), ('Panurus biarmicus', 2, 12), ('Acrocephalus scirpaceus', 1, 6), ('Circus pygargus', 1, 2), ('Ciconia ciconia', 2, 20)]),
    ('Sultan Marshes', 'TR-38', 38.335000, 35.260000, ['2024-05-18', '2025-06-07'],
     SULAK_AV[:8] + [('Grus grus', 4, 60), ('Platalea leucorodia', 2, 30), ('Plegadis falcinellus', 4, 80), ('Glareola pratincola', 4, 40),
                     ('Melanocorypha calandra', 4, 30), ('Ciconia ciconia', 4, 40), ('Merops apiaster', 6, 50), ('Coracias garrulus', 1, 4)]),
    ('Sariyer Bird Watching Tower', 'TR-34', 41.170000, 29.060000, ['2024-09-21', '2025-09-20', '2026-04-04'],
     [('Ciconia ciconia', 200, 2400), ('Ciconia nigra', 5, 120), ('Pernis apivorus', 20, 600), ('Buteo buteo', 10, 300), ('Clanga pomarina', 3, 60),
      ('Hieraaetus pennatus', 2, 30), ('Circaetus gallicus', 1, 12), ('Accipiter nisus', 2, 25), ('Milvus migrans', 2, 30), ('Merops apiaster', 10, 120),
      ('Psittacula krameri', 4, 30), ('Larus michahellis', 10, 80), ('Hirundo rustica', 10, 120), ('Tachymarptis melba', 4, 40)]),
    ('Gediz Delta', 'TR-35', 38.525000, 26.915000, ['2023-11-04', '2025-02-15'],
     SULAK_AV + [('Phoenicopterus roseus', 100, 2000), ('Pelecanus crispus', 4, 60), ('Tadorna tadorna', 10, 300), ('Recurvirostra avosetta', 10, 200),
                 ('Calidris alpina', 20, 400), ('Hydroprogne caspia', 1, 6)]),
    ('Birecik', 'TR-63', 37.030000, 37.985000, ['2024-04-13'],
     [('Geronticus eremita', 10, 60), ('Merops persicus', 2, 20), ('Ceryle rudis', 2, 8), ('Halcyon smyrnensis', 1, 4), ('Passer moabiticus', 2, 20),
      ('Pycnonotus xanthopygos', 2, 10), ('Upupa epops', 1, 3), ('Merops apiaster', 4, 40), ('Ciconia ciconia', 2, 12), ('Coracias garrulus', 1, 3)]),
    # ---- Avrupa ----
    ('Texel, De Petten', 'NL-NH', 53.073000, 4.763000, ['2023-05-20', '2025-10-11'],
     [('Recurvirostra avosetta', 10, 120), ('Haematopus ostralegus', 10, 200), ('Limosa limosa', 5, 80), ('Platalea leucorodia', 5, 60), ('Tadorna tadorna', 5, 80),
      ('Anser anser', 20, 300), ('Branta leucopsis', 50, 900), ('Vanellus vanellus', 5, 120), ('Circus aeruginosus', 1, 4), ('Mareca penelope', 20, 400),
      ('Calidris alpina', 20, 600), ('Sterna hirundo', 2, 30), ('Motacilla flava', 2, 12)]),
    ('Oostvaardersplassen', 'NL-FL', 52.450000, 5.360000, ['2024-03-16', '2025-05-10'],
     [('Haliaeetus albicilla', 1, 3), ('Circus aeruginosus', 1, 6), ('Botaurus stellaris', 1, 2), ('Panurus biarmicus', 4, 20), ('Ardea alba', 5, 60),
      ('Anser anser', 50, 800), ('Cygnus olor', 2, 20), ('Acrocephalus scirpaceus', 2, 12), ('Phalacrocorax carbo', 10, 200), ('Luscinia svecica', 1, 6), ('Cuculus canorus', 1, 3)]),
    ('RSPB Minsmere', 'GB-ENG', 52.247000, 1.620000, ['2023-06-10', '2024-10-19'],
     [('Botaurus stellaris', 1, 2), ('Circus aeruginosus', 1, 5), ('Recurvirostra avosetta', 10, 100), ('Panurus biarmicus', 2, 15), ('Erithacus rubecula', 2, 8),
      ('Turdus merula', 1, 6), ('Cyanistes caeruleus', 2, 10), ('Parus major', 2, 10), ('Alcedo atthis', 1, 2), ('Larus argentatus', 5, 80), ('Sterna hirundo', 2, 20)]),
    ('Bempton Cliffs', 'GB-ENG', 54.146000, -0.170000, ['2024-06-15'],
     [('Fratercula arctica', 20, 200), ('Morus bassanus', 200, 3000), ('Rissa tridactyla', 200, 2000), ('Uria aalge', 100, 1500), ('Alca torda', 50, 600),
      ('Fulmarus glacialis', 10, 200), ('Columba livia', 5, 40), ('Hirundo rustica', 2, 12)]),
    ('Doñana National Park', 'ES-AN', 37.130000, -6.450000, ['2023-10-14', '2024-03-30', '2026-04-11'],
     SULAK_AV[:10] + [('Porphyrio porphyrio', 2, 12), ('Platalea leucorodia', 4, 60), ('Plegadis falcinellus', 10, 200), ('Phoenicopterus roseus', 40, 800),
                      ('Aquila adalberti', 1, 2), ('Milvus migrans', 2, 20), ('Ciconia ciconia', 4, 60), ('Merops apiaster', 5, 40), ('Cyanopica cooki', 4, 20),
                      ('Ardea ibis', 10, 120), ('Himantopus himantopus', 10, 80), ('Marmaronetta angustirostris', 2, 20), ('Netta rufina', 4, 60)]),
    ('Monfragüe National Park', 'ES-EX', 39.850000, -6.060000, ['2025-04-26'],
     [('Gyps fulvus', 20, 120), ('Aegypius monachus', 2, 20), ('Neophron percnopterus', 1, 6), ('Ciconia nigra', 1, 4), ('Aquila adalberti', 1, 2),
      ('Bubo bubo', 1, 1), ('Merops apiaster', 4, 30), ('Coracias garrulus', 1, 3), ('Cyanopica cooki', 4, 20), ('Upupa epops', 1, 3), ('Cecropis rufula', 2, 12)]),
    ('Tagus Estuary', 'PT-11', 38.850000, -8.980000, ['2024-01-20'],
     [('Phoenicopterus roseus', 100, 1500), ('Limosa limosa', 200, 4000), ('Recurvirostra avosetta', 50, 900), ('Platalea leucorodia', 5, 60), ('Calidris alpina', 100, 2000),
      ('Pluvialis squatarola', 5, 80), ('Ardea alba', 2, 20), ('Circus aeruginosus', 1, 4), ('Ardea ibis', 10, 100), ('Ciconia ciconia', 5, 60)]),
    ('Camargue, Pont de Gau', 'FR-PAC', 43.483000, 4.410000, ['2024-05-25', '2025-08-12'],
     SULAK_AV + [('Phoenicopterus roseus', 100, 3000), ('Ardea ibis', 10, 150), ('Ardeola ralloides', 2, 20), ('Nycticorax nycticorax', 2, 20),
                 ('Merops apiaster', 5, 60), ('Coracias garrulus', 1, 4), ('Glareola pratincola', 2, 20), ('Ciconia ciconia', 2, 30), ('Recurvirostra avosetta', 5, 80),
                 ('Larus michahellis', 10, 120), ('Sterna hirundo', 2, 30)]),
    ('Biebrza Marshes', 'PL-20', 53.400000, 22.600000, ['2024-05-11'],
     [('Calidris pugnax', 20, 300), ('Gallinago media', 2, 12), ('Acrocephalus paludicola', 1, 6), ('Ciconia ciconia', 4, 40), ('Ciconia nigra', 1, 3),
      ('Grus grus', 4, 60), ('Clanga pomarina', 1, 2), ('Chlidonias leucopterus', 10, 120), ('Crex crex', 1, 6), ('Luscinia svecica', 1, 4), ('Cuculus canorus', 1, 4)]),
    ('Falsterbo', 'SE-M', 55.400000, 12.820000, ['2025-09-27'],
     [('Pernis apivorus', 10, 300), ('Buteo buteo', 50, 1200), ('Accipiter nisus', 20, 300), ('Milvus milvus', 5, 120), ('Circus aeruginosus', 2, 30),
      ('Fringilla coelebs', 200, 5000), ('Columba palumbus', 200, 4000), ('Hirundo rustica', 50, 800), ('Erithacus rubecula', 5, 60)]),
    ('Varanger Fjord', 'NO-56', 70.200000, 29.600000, ['2025-06-21'],
     [('Somateria spectabilis', 10, 200), ('Polysticta stelleri', 5, 120), ('Clangula hyemalis', 5, 80), ('Phalaropus lobatus', 5, 60), ('Stercorarius longicaudus', 1, 8),
      ('Calidris maritima', 5, 40), ('Plectrophenax nivalis', 2, 12), ('Rissa tridactyla', 50, 600), ('Fratercula arctica', 5, 60)]),
    ('Lake Myvatn', 'IS-6', 65.600000, -17.000000, ['2024-06-29'],
     [('Histrionicus histrionicus', 4, 40), ('Bucephala islandica', 4, 60), ('Aythya marila', 10, 200), ('Melanitta nigra', 4, 40), ('Phalaropus lobatus', 10, 120),
      ('Gavia stellata', 1, 6), ('Cygnus cygnus', 4, 40), ('Falco rusticolus', 1, 1), ('Podiceps auritus', 2, 20)]),
    ('Hortobagy National Park', 'HU-HB', 47.580000, 21.150000, ['2023-10-21'],
     [('Grus grus', 500, 12000), ('Otis tarda', 4, 40), ('Haliaeetus albicilla', 1, 4), ('Falco cherrug', 1, 2), ('Anser albifrons', 100, 3000),
      ('Circus aeruginosus', 1, 4), ('Ardea alba', 5, 60), ('Lanius excubitor', 1, 2), ('Pica pica', 2, 12)]),
    ('Batumi Raptor Count', 'GE-AJ', 41.705000, 41.730000, ['2024-09-14', '2025-09-13'],
     [('Pernis apivorus', 500, 9000), ('Milvus migrans', 100, 4000), ('Buteo buteo', 100, 3000), ('Circus aeruginosus', 20, 400), ('Circus macrourus', 2, 40),
      ('Aquila nipalensis', 2, 40), ('Hieraaetus pennatus', 5, 60), ('Ciconia nigra', 5, 80), ('Merops apiaster', 20, 400), ('Coracias garrulus', 2, 12), ('Hirundo rustica', 50, 600)]),
    ('Kazbegi', 'GE-MM', 42.662000, 44.620000, ['2025-05-31'],
     [('Tetraogallus caucasicus', 2, 12), ('Lyrurus mlokosiewiczi', 1, 6), ('Phoenicurus erythrogastrus', 1, 4), ('Carpodacus rubicilla', 1, 6),
      ('Gypaetus barbatus', 1, 2), ('Gyps fulvus', 2, 20), ('Montifringilla nivalis', 2, 20), ('Prunella collaris', 1, 4), ('Pyrrhocorax graculus', 10, 80)]),
    # ---- Orta Doğu, Afrika ----
    ('Hula Valley', 'IL-Z', 33.100000, 35.610000, ['2024-12-07'],
     [('Grus grus', 500, 20000), ('Ceryle rudis', 2, 12), ('Halcyon smyrnensis', 1, 4), ('Clanga clanga', 1, 6), ('Pelecanus onocrotalus', 20, 600),
      ('Pycnonotus xanthopygos', 2, 12), ('Phalacrocorax carbo', 20, 300), ('Ardea alba', 5, 80), ('Circus aeruginosus', 1, 6)]),
    ('Eilat Birding Park', 'IL-D', 29.550000, 34.955000, ['2025-03-22'],
     [('Merops persicus', 2, 30), ('Ciconia ciconia', 50, 2000), ('Aquila nipalensis', 5, 200), ('Buteo buteo', 20, 600), ('Oenanthe leucopyga', 1, 4),
      ('Onychognathus tristramii', 2, 20), ('Cinnyris osea', 1, 6), ('Passer moabiticus', 2, 10), ('Upupa epops', 1, 3), ('Merops apiaster', 5, 60)]),
    ('Merja Zerga', 'MA-04', 34.850000, -6.280000, ['2023-12-02'],
     [('Phoenicopterus roseus', 50, 1200), ('Platalea leucorodia', 5, 60), ('Limosa limosa', 50, 900), ('Ardea ibis', 10, 200), ('Ciconia ciconia', 5, 60),
      ('Calidris alpina', 50, 900), ('Pluvialis squatarola', 5, 60), ('Ichthyaetus audouinii', 2, 20), ('Circus aeruginosus', 1, 4), ('Ardea cinerea', 2, 20)]),
    ('Souss-Massa National Park', 'MA-09', 30.050000, -9.650000, ['2024-02-24'],
     [('Geronticus eremita', 10, 120), ('Upupa epops', 1, 4), ('Merops apiaster', 2, 20), ('Phoenicopterus roseus', 10, 120), ('Pycnonotus barbatus', 2, 12),
      ('Lanius meridionalis', 1, 3), ('Oenanthe leucura', 1, 4), ('Circus aeruginosus', 1, 3), ('Ardea ibis', 5, 60)]),
    ('Lake Nakuru National Park', 'KE-31', -0.369728, 36.084359, ['2024-08-03', '2024-08-04'],
     [('Phoeniconaias minor', 500, 20000), ('Phoenicopterus roseus', 50, 2000), ('Pelecanus onocrotalus', 20, 600), ('Coracias caudatus', 1, 4),
      ('Lamprotornis superbus', 4, 30), ('Icthyophaga vocifer', 1, 4), ('Leptoptilos crumenifer', 4, 60), ('Ephippiorhynchus senegalensis', 1, 2),
      ('Merops apiaster', 5, 40), ('Merops pusillus', 1, 6), ('Tockus deckeni', 1, 4), ('Crinifer leucogaster', 1, 3), ('Ardea melanocephala', 1, 6),
      ('Threskiornis aethiopicus', 5, 60), ('Ciconia ciconia', 2, 30), ('Struthio camelus', 2, 12)]),
    ('Masai Mara National Reserve', 'KE-33', -1.490000, 35.143000, ['2024-08-06', '2024-08-08'],
     [('Struthio camelus', 2, 20), ('Balearica regulorum', 2, 20), ('Sagittarius serpentarius', 1, 3), ('Terathopius ecaudatus', 1, 4), ('Coracias caudatus', 1, 6),
      ('Lamprotornis superbus', 4, 40), ('Buphagus erythroryncha', 4, 30), ('Gyps africanus', 10, 80), ('Bucorvus leadbeateri', 2, 6), ('Merops apiaster', 10, 60),
      ('Leptoptilos crumenifer', 4, 40), ('Numida meleagris', 10, 60), ('Ardeotis kori', 1, 4), ('Hirundo rustica', 10, 80)]),
    ('Serengeti National Park', 'TZ-13', -2.333000, 34.833000, ['2024-08-10'],
     [('Struthio camelus', 4, 30), ('Sagittarius serpentarius', 1, 2), ('Coracias caudatus', 1, 4), ('Agapornis fischeri', 4, 40), ('Lamprotornis superbus', 4, 30),
      ('Gyps rueppelli', 4, 40), ('Terathopius ecaudatus', 1, 3), ('Numida meleagris', 10, 80), ('Ciconia abdimii', 20, 300), ('Merops apiaster', 5, 40)]),
    ('Kruger National Park, Satara', 'ZA-MP', -24.393000, 31.778000, ['2025-02-08'],
     [('Coracias caudatus', 1, 6), ('Bucorvus leadbeateri', 2, 6), ('Tockus leucomelas', 2, 12), ('Lamprotornis nitens', 4, 30), ('Terathopius ecaudatus', 1, 4),
      ('Gyps africanus', 5, 60), ('Numida meleagris', 10, 60), ('Merops apiaster', 5, 40), ('Ardeotis kori', 1, 3), ('Hirundo rustica', 10, 100)]),
    ('Andasibe-Mantadia National Park', 'MG-A', -18.938000, 48.418000, ['2025-11-08'],
     [('Coua caerulea', 1, 3), ('Coua reynaudii', 1, 2), ('Vanga curvirostris', 1, 2), ('Leptopterus chabert', 2, 8), ('Cinnyris sovimanga', 2, 10),
      ('Corythornis vintsioides', 1, 2), ('Dicrurus forficatus', 1, 4), ('Hypsipetes madagascariensis', 2, 10)]),
    # ---- Asya, Okyanusya ----
    ('Keoladeo National Park', 'IN-RJ', 27.160000, 77.520000, ['2023-01-14'],
     [('Antigone antigone', 2, 8), ('Mycteria leucocephala', 10, 120), ('Anastomus oscitans', 10, 100), ('Halcyon smyrnensis', 1, 4), ('Ardea alba', 5, 40),
      ('Ardea ibis', 20, 200), ('Porphyrio poliocephalus', 2, 20), ('Pavo cristatus', 2, 12), ('Psittacula krameri', 5, 40), ('Coracias benghalensis', 1, 4),
      ('Merops orientalis', 2, 12), ('Clanga clanga', 1, 3)]),
    ('Sinharaja Forest Reserve', 'LK-3', 6.400000, 80.450000, ['2025-01-18'],
     [('Urocissa ornata', 2, 6), ('Galloperdix bicalcarata', 1, 2), ('Pomatorhinus melanurus', 2, 6), ('Argya rufescens', 6, 20),
      ('Dendrocitta leucogastra', 1, 4), ('Loriculus beryllinus', 2, 8), ('Ocyceros gingalensis', 2, 6), ('Merops orientalis', 1, 4)]),
    ('Doi Inthanon National Park', 'TH-50', 18.588000, 98.487000, ['2026-02-14'],
     [('Aethopyga nipalensis', 1, 4), ('Trochalopteron erythrocephalum', 2, 10), ('Niltava grandis', 1, 2), ('Actinodura strigula', 2, 8), ('Phoenicurus leucocephalus', 1, 2),
      ('Pericrocotus flammeus', 2, 8), ('Cyornis whitei', 1, 2), ('Zosterops japonicus', 4, 20), ('Psilopogon asiaticus', 1, 3)]),
    ('Tangkoko Nature Reserve', 'ID-SA', 1.550000, 125.170000, ['2025-07-19'],
     [('Rhabdotorrhinus exarhatus', 2, 8), ('Rhyticeros cassidix', 2, 8), ('Cittura cyanotis', 1, 2), ('Ceyx fallax', 1, 1), ('Loriculus stigmatus', 2, 8),
      ('Macrocephalon maleo', 1, 2), ('Coracias temminckii', 1, 2), ('Merops philippinus', 2, 10)]),
    ('Kushiro Marsh', 'JP-01', 43.100000, 144.400000, ['2026-01-24'],
     [('Grus japonensis', 10, 80), ('Haliaeetus pelagicus', 1, 6), ('Haliaeetus albicilla', 1, 6), ('Cygnus cygnus', 10, 120), ('Sitta europaea', 1, 4),
      ('Poecile montanus', 1, 6), ('Dendrocopos major', 1, 2), ('Corvus macrorhynchos', 4, 30)]),
    ('Lamington National Park', 'AU-QLD', -28.230000, 153.130000, ['2025-10-25'],
     [('Ptilonorhynchus violaceus', 2, 10), ('Sericulus chrysocephalus', 1, 4), ('Menura alberti', 1, 1), ('Alisterus scapularis', 2, 12), ('Platycercus elegans', 4, 30),
      ('Atrichornis rufescens', 1, 1), ('Dacelo novaeguineae', 1, 4), ('Alectura lathami', 2, 10), ('Malurus cyaneus', 2, 12)]),
    ('Kakadu National Park', 'AU-NT', -12.600000, 132.500000, ['2025-10-18'],
     [('Ephippiorhynchus asiaticus', 1, 4), ('Anseranas semipalmata', 50, 600), ('Irediparra gallinacea', 2, 12), ('Haliastur indus', 1, 6),
      ('Dacelo leachii', 1, 4), ('Merops ornatus', 4, 30), ('Cacatua galerita', 4, 40), ('Trichoglossus moluccanus', 4, 40), ('Antigone rubicunda', 2, 20)]),
    ('Tiritiri Matangi Island', 'NZ-AUK', -36.600000, 174.890000, ['2026-03-07'],
     [('Notiomystis cincta', 2, 12), ('Philesturnus rufusater', 1, 6), ('Porphyrio hochstetteri', 1, 4), ('Prosthemadera novaeseelandiae', 4, 30),
      ('Anthornis melanura', 4, 20), ('Callaeas wilsoni', 1, 4), ('Rhipidura fuliginosa', 2, 10), ('Hemiphaga novaeseelandiae', 1, 4)]),
    # ---- Amerika ----
    ('Central Park, The Ramble', 'US-NY', 40.778000, -73.969000, ['2023-05-13', '2024-05-11', '2025-10-04'],
     [('Cardinalis cardinalis', 2, 12), ('Cyanocitta cristata', 2, 10), ('Setophaga ruticilla', 1, 8), ('Setophaga petechia', 1, 6), ('Mniotilta varia', 1, 6),
      ('Setophaga magnolia', 1, 6), ('Piranga olivacea', 1, 3), ('Icterus galbula', 1, 4), ('Turdus migratorius', 4, 30), ('Dumetella carolinensis', 2, 12),
      ('Pheucticus ludovicianus', 1, 4), ('Melanerpes carolinus', 1, 3), ('Baeolophus bicolor', 1, 6), ('Zenaida macroura', 2, 12), ('Seiurus aurocapilla', 1, 4)]),
    ('High Island, Boy Scout Woods', 'US-TX', 29.564000, -94.391000, ['2024-04-20'],
     [('Passerina ciris', 1, 6), ('Passerina cyanea', 1, 8), ('Piranga rubra', 1, 4), ('Setophaga citrina', 1, 6), ('Protonotaria citrea', 1, 3),
      ('Archilochus colubris', 1, 6), ('Tyrannus forficatus', 1, 4), ('Platalea ajaja', 5, 60), ('Cardinalis cardinalis', 2, 8), ('Icterus spurius', 1, 6)]),
    ('Everglades, Anhinga Trail', 'US-FL', 25.383000, -80.609000, ['2024-01-27'],
     [('Anhinga anhinga', 4, 30), ('Ardea alba', 4, 40), ('Egretta tricolor', 2, 12), ('Porphyrio martinica', 1, 6), ('Rostrhamus sociabilis', 1, 3),
      ('Pandion haliaetus', 1, 4), ('Eudocimus albus', 10, 80), ('Mycteria americana', 2, 20), ('Platalea ajaja', 1, 12), ('Ardea herodias', 1, 6)]),
    ('Point Reyes', 'US-CA', 38.070000, -122.880000, ['2025-03-08'],
     [('Pelecanus occidentalis', 10, 120), ('Haematopus bachmani', 2, 8), ('Uria aalge', 50, 900), ('Aphelocoma californica', 2, 10), ('Pipilo maculatus', 1, 6),
      ('Haliaeetus leucocephalus', 1, 2), ('Pandion haliaetus', 1, 3), ('Zonotrichia leucophrys', 4, 30), ('Calypte anna', 1, 6), ('Larus occidentalis', 10, 200)]),
    ('Madera Canyon', 'US-AZ', 31.720000, -110.880000, ['2025-05-17'],
     [('Trogon elegans', 1, 3), ('Eugenes fulgens', 1, 4), ('Melanerpes formicivorus', 2, 12), ('Aphelocoma wollweberi', 4, 20), ('Cardellina rubrifrons', 1, 6),
      ('Setophaga nigrescens', 1, 4), ('Piranga flava', 1, 3), ('Myioborus pictus', 1, 6), ('Pheucticus melanocephalus', 1, 4)]),
    ('Point Pelee National Park', 'CA-ON', 41.930000, -82.510000, ['2023-05-17'],
     [('Setophaga fusca', 1, 6), ('Setophaga castanea', 1, 6), ('Setophaga ruticilla', 2, 20), ('Setophaga petechia', 4, 30), ('Icterus galbula', 2, 12),
      ('Piranga olivacea', 1, 6), ('Archilochus colubris', 1, 4), ('Mniotilta varia', 1, 8), ('Cardinalis cardinalis', 1, 6), ('Hirundo rustica', 10, 80)]),
    ('Monteverde Cloud Forest', 'CR-P', 10.302000, -84.795000, ['2025-12-13'],
     [('Pharomachrus mocinno', 1, 3), ('Procnias tricarunculatus', 1, 3), ('Aulacorhynchus prasinus', 1, 6), ('Lampornis calolaemus', 2, 8),
      ('Eupherusa eximia', 1, 4), ('Momotus lessonii', 1, 3), ('Chlorospingus flavopectus', 4, 20), ('Basileuterus tristriatus', 2, 10), ('Turdus grayi', 1, 6)]),
    ('Mindo, Paz de las Aves', 'EC-P', -0.020000, -78.730000, ['2023-08-19'],
     [('Rupicola peruvianus', 2, 12), ('Grallaria gigantea', 1, 1), ('Andigena laminirostris', 1, 4), ('Tangara arthus', 2, 10), ('Semnornis ramphastinus', 1, 4),
      ('Ocreatus underwoodii', 1, 4), ('Heliodoxa jacula', 1, 4), ('Chlorophonia pyrrhophrys', 1, 3)]),
    ('Galapagos, Puerto Ayora', 'EC-W', -0.743000, -90.313000, ['2023-08-26'],
     [('Sula nebouxii', 4, 40), ('Fregata magnificens', 4, 40), ('Pelecanus occidentalis', 4, 30), ('Geospiza fortis', 4, 30), ('Camarhynchus parvulus', 2, 10),
      ('Pyrocephalus nanus', 1, 4), ('Mimus parvulus', 2, 10), ('Butorides sundevalli', 1, 4), ('Spheniscus mendiculus', 1, 6), ('Creagrus furcatus', 2, 20)]),
    ('Manu National Park', 'PE-MDD', -12.900000, -71.400000, ['2024-07-13'],
     [('Ara macao', 10, 80), ('Ara chloropterus', 20, 200), ('Opisthocomus hoazin', 4, 30), ('Rupicola peruvianus', 1, 6), ('Pteroglossus beauharnaisii', 1, 6),
      ('Galbula cyanescens', 1, 4), ('Psarocolius angustifrons', 4, 30), ('Cacicus cela', 4, 30), ('Ramphastos tucanus', 1, 4)]),
    ('Pantanal, Transpantaneira', 'BR-MT', -16.500000, -56.640000, ['2024-07-20', '2024-07-22'],
     [('Jabiru mycteria', 2, 20), ('Anodorhynchus hyacinthinus', 2, 12), ('Ramphastos toco', 1, 6), ('Mycteria americana', 10, 100), ('Theristicus caudatus', 2, 12),
      ('Busarellus nigricollis', 1, 3), ('Megaceryle torquata', 1, 4), ('Aramus guarauna', 1, 6), ('Ardea cocoi', 1, 6), ('Chauna torquata', 2, 12), ('Rhea americana', 1, 8)]),
    ('Iguazu Falls', 'AR-N', -25.690000, -54.440000, ['2024-07-27'],
     [('Cypseloides senex', 50, 600), ('Ramphastos toco', 1, 4), ('Pteroglossus castanotis', 2, 8), ('Cyanocorax chrysops', 4, 20), ('Trogon surrucura', 1, 3),
      ('Tangara seledon', 2, 10), ('Coragyps atratus', 10, 60), ('Pitangus sulphuratus', 1, 6)]),
    ('Torres del Paine National Park', 'CL-MA', -51.000000, -73.000000, ['2025-12-27'],
     [('Vultur gryphus', 2, 12), ('Rhea pennata', 2, 20), ('Chloephaga picta', 4, 40), ('Phoenicopterus chilensis', 10, 120), ('Campephilus magellanicus', 1, 2),
      ('Caracara plancus', 1, 6), ('Geranoaetus melanoleucus', 1, 3), ('Theristicus melanopis', 2, 20), ('Cygnus melancoryphus', 4, 40)]),
]


# Ek ziyaretler (aynı türler farklı tarihlerde): ad → tarihler
EK = {
    'Sariyer Bird Watching Tower': ['2023-09-16'],
    'Lake Mogan': ['2025-03-29'], 'Texel, De Petten': ['2026-05-16'], 'Oostvaardersplassen': ['2023-11-25'], 'RSPB Minsmere': ['2025-04-12', '2026-07-04'],
    'Doñana National Park': ['2025-05-03'], 'Monfragüe National Park': ['2023-04-15'], 'Tagus Estuary': ['2025-12-06'],
    'Camargue, Pont de Gau': ['2023-07-08', '2026-09-12'], 'Biebrza Marshes': ['2026-05-23'], 'Falsterbo': ['2024-09-28'],
    'Hortobagy National Park': ['2025-10-18'], 'Batumi Raptor Count': ['2023-09-09'], 'Hula Valley': ['2026-01-03'],
    'Eilat Birding Park': ['2024-03-16'], 'Merja Zerga': ['2025-01-25'], 'Souss-Massa National Park': ['2026-02-28'],
    'Kruger National Park, Satara': ['2025-02-10'], 'Keoladeo National Park': ['2024-02-03', '2026-01-10'],
    'Central Park, The Ramble': ['2026-05-09', '2023-10-07'], 'High Island, Boy Scout Woods': ['2025-04-19'],
    'Everglades, Anhinga Trail': ['2026-02-21'], 'Point Reyes': ['2023-12-30'], 'Madera Canyon': ['2026-08-08'],
    'Point Pelee National Park': ['2026-05-14'], 'Monteverde Cloud Forest': ['2025-12-15'], 'Pantanal, Transpantaneira': ['2024-07-24'],
    'Lamington National Park': ['2025-10-27'], 'Kakadu National Park': ['2025-10-20'], 'Kushiro Marsh': ['2024-02-10'],
    'Lake Nakuru National Park': ['2024-08-05'], 'Masai Mara National Reserve': ['2024-08-07'], 'Galapagos, Puerto Ayora': ['2023-08-28'],
    'Manu National Park': ['2024-07-15'], 'Iguazu Falls': ['2024-07-28'], 'Torres del Paine National Park': ['2025-12-29'],
    'Mindo, Paz de las Aves': ['2023-08-21'], 'Sinharaja Forest Reserve': ['2025-01-20'], 'Doi Inthanon National Park': ['2026-02-16'],
}
YERLER = [(a, k, la, lo, sorted(set(t + EK.get(a, []))), tr) for a, k, la, lo, t, tr in YERLER]

# 2026'nın en zengin günü: Doñana 2026-04-11 – listenin tamamı
ZORUNLU = {('Doñana National Park', '2026-04-11'): 1.0, ('Camargue, Pont de Gau', '2025-08-12'): 1.0}

def say(lo, hi):
    if R.random() < 0.06: return 'X'
    v = round(lo + (hi - lo) * R.random() ** 2.2)
    if v > 50: v = int(round(v, -1 if v < 1000 else -2))
    return str(max(1, v))

satir, eksik, sid, lid = [], set(), 700100000, 30100000
for ad, kod, la, lo, tarihler, turler in YERLER:
    lid += R.randint(1000, 90000)
    tekil = list({x[0]: x for x in turler}.values())   # aynı tür iki kez yazıldıysa sonuncusu
    for t in tarihler:
        sid += R.randint(1000, 60000)
        oran = ZORUNLU.get((ad, t), R.uniform(0.62, 0.88))
        secim = [x for x in tekil if R.random() < oran] or tekil[:3]
        gez = R.random() < 0.65
        saat = f'{R.randint(6, 10):02d}:{R.choice(["05", "15", "20", "30", "40", "50"])} AM'
        sure = R.choice([60, 90, 120, 150, 180, 240])
        mesafe = round(R.uniform(0.8, 6), 1) if gez else ''
        kisi = R.choice([1, 1, 1, 2])
        for sci, a, b in secim:
            if sci not in SIRA: eksik.add(sci); continue
            sira, en = SIRA[sci]
            satir.append({'Submission ID': f'S{sid}', 'Common Name': en, 'Scientific Name': sci, 'Taxonomic Order': sira, 'Count': say(a, b),
                          'State/Province': kod, 'County': '', 'Location ID': f'L{lid}', 'Location': ad, 'Latitude': f'{la:.6f}', 'Longitude': f'{lo:.6f}',
                          'Date': t, 'Time': saat, 'Protocol': 'eBird - Traveling Count' if gez else 'eBird - Stationary Count', 'Duration (Min)': sure,
                          'All Obs Reported': 1, 'Distance Traveled (km)': mesafe, 'Area Covered (ha)': '',
                          'Number of Observers': kisi, 'Breeding Code': '', 'Observation Details': '', 'Checklist Comments': '', 'ML Catalog Numbers': ''})
satir.sort(key=lambda r: (r['Date'], r['Submission ID'], r['Taxonomic Order']))
alan = ['Submission ID', 'Common Name', 'Scientific Name', 'Taxonomic Order', 'Count', 'State/Province', 'County', 'Location ID', 'Location', 'Latitude', 'Longitude',
        'Date', 'Time', 'Protocol', 'Duration (Min)', 'All Obs Reported', 'Distance Traveled (km)', 'Area Covered (ha)', 'Number of Observers', 'Breeding Code',
        'Observation Details', 'Checklist Comments', 'ML Catalog Numbers']
with open(os.path.join(KOK, 'www', 'data', 'ornek-veri.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=alan); w.writeheader(); w.writerows(satir)
print(f'{len(satir)} satır · {len(YERLER)} yer · {len({r["Scientific Name"] for r in satir})} tür · {len({r["State/Province"][:2] for r in satir})} ülke')
if eksik: print('Taksonomide bulunamayan (atlandı):', ', '.join(sorted(eksik)))
