# Kuş Atlası v1.11: Güncelleme (2. paket, telefon testinden sonra)

## 1. Dosyaları yerleştir
Zip'i önceki sürümlerdeki gibi dış klasöre aç (`Downloads\kus-atlasi\`) ve **Tümüne evet** de.
Yeni dosya: `www\data\ornek-veri.csv` (örnek veri, ~950 satır, kurgusal).

## 2. Komutlar
Yeni kütüphane yok.
```
npm run sync
npm run open
```
`npm run sync` sürümü 1.11'e (versionCode **111**) ayarlar. Aynı adımda telefonun yazı boyutu sınırı (%115) da eklenir. Ekranda "yazı sınırı %115 eklendi" yazmalı.

## 3. Play'e yükle
Önceki gibi: Android Studio → Build → Generate Signed App Bundle → kapalı teste yükle.

Sürüm notu (her dil 500 karakter sınırının altında):
```
<tr-TR>
• 🧪 Örnek veriyle dene: verin olmadan uygulamayı keşfet
• 📊 Takvim ve Kertikler'de yıllık grafik, yılları karşılaştırma
• Konum, gün ve tür listeleri gruplu; birey (adet) sayıları
• Yeni paylaşım kartları: gezi, ay takvimi, grafik, her kertik
• 📷 Türlerde Wikipedia yerine kendi fotoğrafını kullan
• Dil menüsü, büyük yazı ve Gemini düzeltmeleri
</tr-TR>
<en-US>
• 🧪 Try with sample data: explore the app without your own data
• 📊 Year charts in Calendar and Lifers, compare years
• Grouped place, day and species lists; bird counts
• New share cards: trip, month, chart and any lifer
• 📷 Use your own photos instead of Wikipedia's
• Language menu, large font and Gemini fixes
</en-US>
```

## 4. Gizlilik politikası
Değişiklik yok (örnek veri telefonda, Instagram yalnızca bir bağlantı). v1.10 metni geçerli.

## 2. pakette değişenler (telefon testi sonrası)
- Açılış ekranında **🧪 Örnek veriyle dene** artık her zaman görünüyor. Kendi verin varsa önce onay soruyor. Elle eklediğin kayıtlar saklanıyor, kendi eBird dosyanı yeniden yükleyince geri geliyor.
- Açılış ekranı veri hazır olduktan sonra da yarım saniye görünüyor (toplam en az 1,5 sn).
- **Kuş Türleri:** fotoğraflar varsayılan olarak açık. Birey sayısı varsayılan olarak kapalı, açmak için **"Birey sayısı"** kutusu var (Konumlar panelinde de). 🔢 işareti kalktı, yerine "birey" yazıyor.
- **📷 Kendi fotoğrafın:** türün fotoğrafına dokununca büyüyor. "✏️ Kendi fotoğrafını koy" ile galeriden seçtiğin fotoğraf listelerde, haritada ve kartlarda kullanılıyor. "↩️ Wikipedia fotoğrafına dön" ile geri alınabiliyor. Fotoğraf yalnızca telefonda kalıyor, GPS bilgisi siliniyor.
- **Paylaşım:**
  - Grafik ve Ay kartında isteğe bağlı **konum** ve **tür** seçimi var.
  - Tür kartında görünüm seçilebiliyor: 🗺️ Harita / 📊 Aylara göre / 📈 Yıllara göre.
  - Haftalık grafikte "Hafta 40 · 29 Eyl – 5 Eki 2025" gibi tarih aralığı görünüyor.
  - Grafikteki "⭐ en iyi ay" yazısı başlığın altına taşındı.
  - Grafik, Ay ve tür-grafik kartlarında "Konum bilgisi" seçeneği kalktı.
  - Kart altındaki imza artık küçük Instagram logosu + @birdatlas.app. Kutu varsayılan olarak işaretli.
  - Gözlem kartında yakınlaştırma çubuğu kalktı: bir parmakla kaydır, iki parmakla yakınlaştır.
- **Tüm gözlemlerim** ve konum listeleri artık ekrana sığıyor, yana kaymıyor.
- **Panelleri Göster**'e basınca açık konum penceresi kapanıyor.
- **Kılavuz (?)** baştan yazıldı:
  - En başta "Kuş Atlası nedir?" bölümü var.
  - Bölümler uygulamadaki sırayla diziliyor.
  - Yeni özellikler, kendi fotoğrafların ve API anahtarlarının nasıl alınacağı eklendi (eBird'e yazılacak "ticari olmayan kullanım" açıklaması dahil).

## Bu sürümde (v1.11)
- **Örnek veri:** Açılış ekranında "🧪 Örnek veriyle dene". 8 ülke, 34 ünlü kuş alanı, 254 tür. Haritada mor "Örnek veri · Kendi verini yükle" etiketi var. Kendi verini yükleyince örnek veri silinir. Örnek veride kertik kutlaması ve "değerlendir" isteği çıkmaz.
- **Gruplu listeler:**
  - Konum penceresi: her türde "📅 Burada: tarihler" ve tek bir "🌍📅 Tüm gözlemlerim" düğmesi var. Liste konum → tarih sırasında, bulunduğun konum ★ ile en üstte. "Tarihe göre" ile tarih sırasına geçilebilir.
  - Takvimde seçili gün: konum → o konumdaki türler, ayrıca "📤 Bu günü paylaş".
  - Kuş Türleri ve Konumlar panellerinde tek açılır liste (tür → konum → tarih, konum → gün → türler) var. Üstte toplamlar gösteriliyor.
- **Yıllık grafik** (Takvim ve Kertikler panelinde):
  - Ölçü: tür / gözlem / gün / birey.
  - Aylık ya da haftalık görünüm, ayrıca "Yılları karşılaştır".
  - Çubuğa dokununca o ayın özeti açılıyor.
- **Birey (adet):** Rozetlerde "gözlem · birey" görünüyor. Kuş Türlerinde "Birey ↓" sıralaması var. Elle kayıtta "Adet" alanı var (boş bırakılırsa X). Maviş artık "en büyük sürüm", "kaç flamingo saydım" gibi soruları cevaplıyor.
- **Paylaşım:**
  - Yeni kartlar: 🧳 Gezi (tarih aralığı, il, başlık), 🗓️ Ay takvimi, 📊 Grafik.
  - Herhangi bir kertik paylaşılabiliyor (ör. 101.); kertik penceresinde 📤 düğmesi var.
  - Gün ve gezi kartında türler seçilebiliyor.
  - Kartın altına isteğe bağlı "@birdatlas.app" yazılabiliyor.
- **Dil düğmesi** artık şu anki dili gösteriyor (🇹🇷 TR ▾) ve bir menü açıyor. ES, RU ve AR "yakında" olarak listeleniyor.
- **Düzeltmeler:**
  - Gemini: yeni model adı kullanılıyor. Google modeli kapatırsa uygulama kendiliğinden en yeni modele geçiyor, o da olmazsa cevabı yerel Maviş veriyor.
  - Yazı en fazla %115 büyüyor. Takvim okları ‹ › oldu, sıralama düğmeleri tek satırda.
  - Pencereler açıkken logo ve TR · ? düğmeleri arkada kalıyor.
  - Açılır küçük listeler harita kayınca pencereyle birlikte kayıyor.
- **Instagram:** Geri Bildirim panelinde ve kılavuzun altında @birdatlas.app bağlantısı var.

## Telefonda dene (kısa liste)
1. Uygulamayı sil-yükle değil, üstüne kur. Verin duruyor mu?
2. Ayarlar → Yazı boyutu en büyük: takvim, sıralama düğmeleri ve paneller taşıyor mu?
3. Bir konum penceresi aç → "Tüm gözlemlerim" → haritayı kaydır, liste pencereyle birlikte kayıyor mu?
4. Takvimde bir güne dokun → konum/tür listesi + "Bu günü paylaş".
5. Grafik: ölçü, haftalık, "Yılları karşılaştır", çubuğa dokun.
6. Paylaş → Gezi / Ay / Grafik / Kertik kartları (Hikâye + Kare + PDF).
7. Maviş'e "en büyük sürüm", "kaç leylek saydım" sor; Gemini anahtarınla normal bir soru sor.
8. Dil menüsü: TR ↔ EN.
9. Örnek veri: uygulama verisini temizleyip (veya yeni telefonda) "Örnek veriyle dene" → sonra kendi verini yükle → örnek etiket kayboluyor mu?

## 🔒 İş bitince kapatılacak ayarlar (unutma)
Telefon: USB üzerinden yükle · USB hata ayıklama (Güvenlik ayarları) · USB hata ayıklama · Geliştirici seçenekleri · Bilinmeyen uygulama izni
Bilgisayar: güvenlik duvarındaki adb izni · Defender dışlamaları
