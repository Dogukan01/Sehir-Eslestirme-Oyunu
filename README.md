# 🇹🇷 Türkiye Plaka - Şehir Eşleştirme Oyunu

Türkiye'nin 81 ilini, plaka kodlarını ve coğrafi konumlarını eğlenceli ve interaktif bir şekilde öğrenmenizi sağlayan modern bir web oyunudur. JetPunk tarzı oyun mekaniklerini, premium tasarım trendleri ve dinamik ses efektleriyle harmanlayarak yüksek oynanabilirlik sunar.

Proje, yapılan son güncellemeyle birlikte **%100 Sunucusuz (Serverless/Static)** hale getirilmiştir. Bu sayede harici bir veritabanı veya backend sunucusu çalıştırmaya gerek kalmadan tamamen tarayıcı üzerinde çalışır ve kolayca canlıya alınabilir.

---

## 🎮 Oyun Modları

Oyun, farklı kullanıcı tercihlerine göre **4 farklı mod** sunar:

1. **Sıralı Mod (01 - 81):** 
   - `01` plakadan başlayıp sırayla `81` plakaya doğru tahmin edersiniz. 
   - İstediğiniz zaman tablodan veya haritadan boş bir plakaya tıklayarak aktif hedefi değiştirebilirsiniz.
   - 300 saniye (5 dakika) geri sayım süresi vardır.

2. **Rastgele Mod:**
   - 81 plaka arasından rastgele gelen kodları tahmin edersiniz. 
   - Zorlandığınız şehirleri **Pas Geç** butonuyla atlayabilir, daha sonra yanıtlayabilirsiniz.
   - 300 saniye (5 dakika) geri sayım süresi vardır.

3. **Harita Eşleştirme Modu:**
   - Ekranda gösterilen plaka koduna sahip şehri **harita üzerinde tıklayarak** bulmaya çalışırsınız.
   - Hatalı tıklamalarda ekran kırmızı renkte yanıp söner ve sesli uyarı verilir.
   - 300 saniye (5 dakika) geri sayım süresi vardır.

4. **Eğitim Modu (Sayaçsız & Süresiz):**
   - Sıralı mod mekanikleriyle çalışır, ancak herhangi bir zaman limiti veya stres unsuru barındırmaz.
   - Kronometre sıfırdan yukarı doğru sayarak oyunu ne kadar sürede tamamladığınızı ölçer.
   - Kendi kendinizi eğitmeniz ve şehirlerin yerlerini rahatça ezberlemeniz için idealdir.

---

## ✨ Öne Çıkan Özellikler

* **📊 Coğrafi Bölge İstatistikleri:** Şehirleri bildikçe Türkiye'nin 7 coğrafi bölgesi için özel hazırlanmış ilerleme çubukları (`Marmara: 3/11`, `Ege: 5/8` vb.) anlık güncellenir. Bir bölgedeki tüm şehirler bulunduğunda çubuk rengi otomatik olarak **yeşile** döner.
* **🏆 Yerel Rekorlar (Local Leaderboard):** Her mod için en yüksek skorunuz ve en iyi tamamlama süreniz tarayıcı hafızasında (`localStorage`) saklanır. Header'daki rekorlar butonuna basarak geçmiş başarılarınızı inceleyebilirsiniz.
* **🎵 Dinamik Ses Efektleri (Web Audio SFX):** Oyun sırasında harici hiçbir ses dosyası indirilmeden tarayıcının yerleşik ses sentezleme motoruyla ses üretilir. Doğru tahminde ince bir melodi, yanlış tıklamalarda buzzer ve oyunu bitirmede zafer tınısı çalar. İstenirse sağ üstteki butondan ses tamamen kapatılabilir.
* **💡 Akıllı İpucu Sistemi:** Zorlandığınız plakalarda ipucu butonunu kullanarak ilin bulunduğu **coğrafi bölgeyi** veya **isminin ilk harfini** öğrenebilirsiniz. (Normal modlarda limit 3, Eğitim modunda sınırsızdır).
* **📱 Akıllı Ekran Hizalama (Auto-Scroll):** Telefon veya küçük ekranlarda dikeyde rahat bir oynanış sunması adına, ilk harfi yazmaya başladığınız andan itibaren ekran yumuşak bir kaydırma animasyonuyla haritayı ve giriş kutusunu en iyi göreceğiniz pozisyona ortalar.
* **🔍 Metin Standardizasyonu (Normalization):** Türkçe karakter desteği sayesinde kullanıcı girdileri otomatik normalize edilir (Örn: `İZMİR`, `izmir`, `ızmır`, `İzmİR` hepsi doğru kabul edilir). Ayrıca esnek alternatif eşleşmeler (Örn: `Afyonkarahisar` yerine `Afyon`, `Şanlıurfa` yerine `Urfa`) de desteklenir.
* **🎨 Premium Tasarım:** Slate ve Blue renk paletiyle göz yormayan karanlık tema, Glassmorphic yarı saydam kart tasarımları, pop-in ve parlama efektli mikro-animasyonlar.

---

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React 19, Vite, Axios, ES6+
* **Tasarım:** Vanilla CSS3 (Custom Variables, CSS Flexbox & Grid, CSS Keyframes)
* **Harita:** Interaktif Inline SVG (Özel JavaScript Mouse Event entegrasyonuyla)
* **Ses Sentezleyici:** HTML5 Web Audio API (`AudioContext`)
* **Depolama:** HTML5 LocalStorage API

---

## 🚀 Yerel Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak oldukça basittir. Sadece frontend paketlerini kurup çalıştırmanız yeterlidir:

1. **Bağımlılıkları Yükleyin:**
   Terminalde `frontend` dizinine gidin ve paketleri kurun:
   ```bash
   cd frontend
   npm install
   ```

2. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```

3. **Oyunu Açın:**
   Terminalde gösterilen adresi (genellikle `http://localhost:5173`) tarayıcınızda açarak oyuna başlayabilirsiniz.

---

## 🌐 Canlıda Yayınlama (Deployment)

Uygulama sunucusuz çalıştığı için internet üzerinde ücretsiz olarak kolayca yayınlanabilir:

### GitHub Pages ile Yayınlama

1. `frontend` klasörü içindeyken yayınlama kütüphanesini kurun:
   ```bash
   npm install gh-pages --save-dev
   ```
2. **`package.json`** dosyanıza `"homepage"` alanını ve `"deploy"` scriptlerini ekleyin:
   ```json
   "homepage": "https://kullanici_adiniz.github.io/Sehir-Eslestirme-Oyunu",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. **`vite.config.js`** içerisine `base` yolunu ekleyin:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/Sehir-Eslestirme-Oyunu/'
   })
   ```
4. Yayına alın:
   ```bash
   npm run deploy
   ```

### Vercel ile Yayınlama
1. Vercel hesabınıza giriş yapın.
2. GitHub repository'nizi bağlayın.
3. Kök dizin olarak `frontend` seçin ve **Deploy** tuşuna basın.

---

## 📝 Lisans

Bu proje kişisel eğitim ve eğlence amaçlı açık kaynak kodlu olarak geliştirilmiştir. Dilediğiniz gibi geliştirebilir, üzerine yeni oyun modları ekleyebilirsiniz! 🌟