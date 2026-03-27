# 🚀 RestoPro — Kurulum, Tanıtım ve Pazarlama Kılavuzu

RestoPro, modern restoranların ihtiyaç duyduğu hızı, estetiği ve güvenilirliği tek bir web tabanlı platformda sunan yeni nesil bir POS (Satış Noktası) sistemidir.

---

## 🌟 RestoPro Nedir? (Pazarlama Özeti)

RestoPro, sadece bir sipariş alma uygulaması değil, restoranınızın tüm operasyonunu (Masa Düzeni, Mutfak, Envanter, Rezervasyon ve Personel) senkronize eden bir ekosistemdir.

### Neden RestoPro?
*   **Sıfır Donanım Maliyeti:** Pahalı sunuculara veya özel terminallere ihtiyacınız yok. Herhangi bir tablet, telefon veya bilgisayarda çalışır.
*   **Gerçek Zamanlı Senkronizasyon:** Garson siparişi aldığı an, aşçı mutfak ekranında görür. Kasa masanın durumunu anında takip eder.
*   **Premium Tasarım:** Müşterilerinizin ve personelinizin göreceği arayüz, en modern tasarım standartları (Glassmorphism, Dark Mode) ile hazırlanmıştır.
*   **Bulut Güvencesi:** Verileriniz fiziksel bir cihazda değil, Google'ın güvenli bulut altyapısında saklanır. Cihazınız bozulsa bile işiniz aksamaz.

---

## 🛠️ Teknik Kurulum Kılavuzu (Step-by-Step)

RestoPro'nun kalbi **Google Firebase** üzerine kuruludur. Kendi sisteminizi kurmak için aşağıdaki adımları izleyin:

### 1. Firebase Projesi Oluşturma
1.  [Firebase Console](https://console.firebase.google.com/) adresine gidin.
2.  "Add Project" diyerek **RestoPro** adında bir proje oluşturun.
3.  Proje ayarlarından bir **Web App** ekleyin ve verilen konfigürasyon bilgilerini (apiKey, authDomain vb.) kopyalayın.

### 2. Veritabanı (Firestore) Hazırlığı
1.  Soldaki menüden **Firestore Database**'e gidin.
2.  "Create Database" butonuna basın.
3.  Lokasyon olarak size en yakın bölgeyi seçin (örn: `eur3` - Europe).
4.  Başlangıçta "Test Mode" seçerek kuralları aktif hale getirin.

### 3. Kimlik Doğrulama (Authentication)
1.  **Authentication** sekmesine gidin.
2.  "Sign-in method" kısmından **Anonymous** (Anonim) ve **Google** girişlerini aktif edin. Bu personelin hızlı giriş yapabilmesi için gereklidir.

### 4. Uygulama Yapılandırması
1.  Proje ana dizinindeki `src/firebase-applet-config.json` dosyasını açın.
2.  Firebase'den aldığınız bilgileri bu dosyaya yapıştırın.

### 5. İlk Verilerin Yüklenmesi
Uygulamayı ilk açtığınızda veritabanınız boş olacaktır.
*   Giriş ekranındaki **"Demo Verilerini Yükle"** butonuna basarak; örnek masaları, menü öğelerini ve personel listesini saniyeler içinde oluşturabilirsiniz.

---

## 📋 Modül Tanıtımları

### 🪑 Masalar ve Yerleşim (Floor Plan)
Canlı masa takibi. Hangi masa ne kadar süredir oturuyor, toplam ciro ne kadar, hesap istendi mi gibi bilgileri renk kodlarıyla (Yeşil/Sarı/Mor) anında görün.

### 👨‍🍳 Mutfak Ekranı (KDS)
Garsonların girdiği siparişler anında mutfak paneline düşer. Aşçılar hazırlanan ürünleri tek tıkla "Hazır" olarak işaretleyebilir.

### 📦 Envanter Yönetimi
Stokta azalan ürünler için otomatik uyarılar. Maliyet takibi ve tedarikçi yönetimi.

### 👥 Personel ve Vardiya
Hangi personel ne zaman çalışıyor? Haftalık vardiya çizelgesi ve personel bazlı performans takibi.

### 📅 Rezervasyon Sistemi
Gelecek rezervasyonları yönetin, masaları önceden atayın ve müşteri notlarını kaydedin.

---

## 📈 Satış Noktaları (Marketing Highlights)

1.  **Hız:** Gereksiz tıklamalardan arındırılmış, dokunmatik dostu hızlı sipariş akışı.
2.  **Esneklik:** İster tek restoran, ister çok şubeli yapıya uygun mimari.
3.  **Görsellik:** Modern bir işletmeye yakışan, premium ve şık görünüm.
4.  **Güven:** Firebase altyapısı ile %99.9 erişilebilirlik garantisi.

---
*Hazırlayan: RestoPro Destek Ekibi*
