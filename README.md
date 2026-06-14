# 🇹🇷 Türkiye Plaka - Şehir Eşleştirme Oyunu

Türkiye'nin 81 ilini, plaka kodlarını ve coğrafi konumlarını eğlenceli ve interaktif bir şekilde öğrenmenizi sağlayan modern bir web oyunudur. JetPunk tarzı oyun mekaniklerini, premium tasarım trendleri, dinamik ses efektleri ve coğrafi istatistik kartlarıyla harmanlayarak öğretici ve keyifli bir deneyim sunar.

Uygulama tamamen sunucusuz (serverless) ve statik bir yapıya sahiptir, tüm veriler ve oyun durumu doğrudan tarayıcı üzerinde yerel olarak yönetilir.

---

## 🎮 Oyun Modları

Oyun, farklı zorluk seviyelerine ve oynanış tercihlerine göre **4 farklı mod** sunar:

1. **Sıralı Mod (01 - 81):** 
   - `01` plaka kodundan (Adana) başlayıp sırayla `81` plakaya (Düzce) doğru tahmin edersiniz. 
   - İstediğiniz zaman tablodan veya haritadan boş bir plakaya tıklayarak aktif hedefinizi değiştirebilirsiniz.
   - 5 dakikalık (300 saniye) geri sayım süresi vardır.

2. **Rastgele Mod:**
   - 81 plaka arasından karışık olarak gelen kodları tahmin etmeye çalışırsınız. 
   - Zorlandığınız şehirleri **Pas Geç** butonuyla atlayabilir, daha sonra yanıtlayabilirsiniz.
   - 5 dakikalık (300 saniye) geri sayım süresi vardır.

3. **Harita Eşleştirme Modu:**
   - Ekranda gösterilen plaka kodunun hangi ile ait olduğunu **harita üzerinde doğrudan tıklayarak** bulmaya çalışırsınız.
   - Hatalı tıklamalarda ekran kırmızı renkte yanıp söner ve sesli hata uyarısı verilir.
   - 5 dakikalık (300 saniye) geri sayım süresi vardır.

4. **Eğitim Modu (Süresiz & Sayaçsız):**
   - Sıralı mod kurallarıyla çalışır, ancak herhangi bir zaman sınırı veya stres unsuru barındırmaz.
   - Kronometre sıfırdan yukarı doğru sayarak oyunu ne kadar sürede tamamladığınızı ölçer.
   - Şehirlerin yerlerini ezberlemek ve antrenman yapmak için tasarlanmıştır.

---

## ✨ Öne Çıkan Özellikler

* **📊 Coğrafi Bölge İstatistikleri:** Şehirleri bildikçe Türkiye'nin 7 coğrafi bölgesi için özel hazırlanmış ilerleme çubukları (`Marmara: 3/11`, `Ege: 5/8` vb.) anlık güncellenir. Bir bölgedeki tüm şehirler bulunduğunda ilerleme çubuğu otomatik olarak **yeşile** döner.
* **🏆 Yerel Rekor Tablosu (Leaderboard):** Her mod için en yüksek skorunuz ve en iyi tamamlama süreniz tarayıcı hafızasında (`localStorage`) saklanır. En iyi derecelerinizi dilediğiniz an inceleyebilir veya sıfırlayabilirsiniz.
* **🎵 Dinamik Ses Efektleri (Web Audio SFX):** Oyun sırasında harici hiçbir ses dosyası yüklenmeden, tarayıcının yerleşik ses sentezleme motoruyla ses üretilir. Doğru tahminde ince bir melodi, yanlış tıklamalarda buzzer ve oyunu bitirmede zafer tınısı çalar. İstenirse ses kapatılabilir.
* **💡 Akıllı İpucu Sistemi:** Zorlandığınız plakalarda ipucu butonunu kullanarak ilin bulunduğu **coğrafi bölgeyi** veya **isminin ilk harfini** öğrenebilirsiniz.
* **📱 Akıllı Ekran Hizalama (Auto-Scroll):** Mobil ve küçük ekranlarda dikeyde rahat bir oynanış sunması adına, ilk harfi yazmaya başladığınız andan itibaren ekran otomatik olarak haritayı ve tahmin kutusunu en iyi göreceğiniz pozisyona ortalar.
* **🔍 Metin Standardizasyonu (Normalization):** Türkçe karakter duyarlılığı ve esnek alternatif eşleşmeler (Örn: `Afyonkarahisar` yerine `Afyon`, `Şanlıurfa` yerine `Urfa`) desteklenerek yazım kolaylığı sağlanır.
* **🎨 Premium Tasarım:** Slate ve Blue renk paletiyle göz yormayan karanlık tema, Glassmorphic yarı saydam kart tasarımları, pop-in ve parlama efektli mikro-animasyonlar ve dikeyde cihaz yüksekliğine tam sığan duyarlı modallar.

---

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React, Vite, Axios
* **Tasarım:** Vanilla CSS3 (Custom Variables, CSS Flexbox & Grid, CSS Keyframes)
* **Harita:** İnteraktif SVG (Özel JavaScript Mouse Event entegrasyonuyla)
* **Ses Sentezleyici:** HTML5 Web Audio API (`AudioContext`)
* **Depolama:** HTML5 LocalStorage API

---

## 📝 Lisans

Bu proje açık kaynak kodlu olarak geliştirilmiştir. Dilediğiniz gibi geliştirebilir ve üzerine yeni özellikler ekleyebilirsiniz! 🌟