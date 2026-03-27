
# 🚀 Restopro POS: Profesyonel Restoran Otomasyon Sistemi

![Restopro Hero](https://github.com/birkanbalaban/restopro/blob/main/assets/images/restopro_hero.png?raw=true)

Restopro, modern restoranlar, kafeler ve bistrolar için tasarlanmış; gerçek zamanlı senkronizasyon özelliklerine sahip, bulut tabanlı bir POS (Satış Noktası) ve operasyon yönetim sistemidir.

---

## 🌟 Temel Yetenekler (Capabilities)

### 1. Dinamik Kat Planı (Floor Plan)
- **Gerçek Zamanlı Durum:** Masaların doluluk oranını (Boş, Dolu, Hesap İstendi, Rezerve) anlık renk değişimleriyle izleyin.
- **Hızlı Masa Yönetimi:** Kapasite kontrolü ve otomatik masa isimlendirme (Masa 1, Masa 2...) ile kolay kat planı oluşturma.
- **Garson Takibi:** Hangi masayla hangi personelin ilgilendiğini anlık görün.

### 2. Akıllı Sipariş Yönetimi (POS)
- **Modifiye Edilebilir Ürünler:** Ürünlerde alt seçenekler (Süt Tipi, Şurup, Pişme Derecesi vb.) ile tam özelleştirilebilir siparişler.
- **Sipariş Taslağı:** Onaylanmadan önce siparişleri düzenleme ve özel mutfak notları ekleme.
- **Parçalı Ödeme & İptal:** Kalem bazlı işlem yapabilme, tek tıkla masadan çıkış ve login ekranına dönüş.

### 3. Mutfak Ekranı (KDS)
- **Hazırlık Takibi:** "Beklemede -> Hazırlanıyor -> Hazır -> Servis Edildi" aşamalarıyla mutfak iş akışını yönetin.
- **Akıllı Filtreleme:** Sadece mutfağa gitmesi gereken ürünlerin (yemekler) mutfakta görünmesini sağlayan yazıcı/bölüm bazlı filtreleme.
- **Zaman Takibi:** Siparişlerin ne kadar süredir beklediğini görerek servis kalitesini artırın.

### 4. Gelişmiş Rezervasyon Sistemi
- **Takvim & Saat Entegrasyonu:** Günlük ve saatlik rezervasyon takibi.
- **Düzenleme Paneli:** Mevcut rezervasyonları anlık olarak güncelleme veya iptal etme.
- **Doğrudan Yerleştirme:** Gelen müşteriyi tek tıkla masaya oturtma.

### 5. Personel & Vardiya Yönetimi (Yeni!)
- **Giriş Güvenliği:** Her personel için özel **PIN** kodlu kilit sistemi.
- **Yatay Vardiya Çizelgesi:** Her personel için farklı renklerde, günlük 24 saatlik kapsama alanını gösteren modern timeline görünümü.
- **Renk Atama Sistemi:** Personelleri görsel olarak ayırt etmek için özelleştirilebilir renk paleti.

### 6. Envanter & Raporlama
- **Satış Dashboard:** Günlük satış hacmi, popüler ürünler ve kategori bazlı performans analizi.
- **Stok Takibi:** Kritik stok seviyeleri için uyarılar ve tedarikçi yönetimi.

---

## ⚙️ Kurulum ve Firebase Yapılandırması

Restopro, verilerini güvenli bir şekilde saklamak ve cihazlar arası senkronizasyon sağlamak için **Firebase Cloud Firestore** kullanır.

### 1. Firebase Projesini Hazırlama
1. [Firebase Console](https://console.firebase.google.com/) üzerinden bir proje oluşturun.
2. Bir **Web App** kaydedin ve size verilen anahtarları kopyalayın.
3. **Firestore Database** sekmesine giderek veritabanını oluşturun.

### 2. Ortam Değişkenleri (`.env`)
Proje ana dizininde bir **`.env`** dosyası oluşturun:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Uygulamayı Çalıştırma
```bash
# Bağımlılıkları kurun
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

---

## 🔒 Güvenlik
Sistem, Role-Based Access Control (RBAC) yapısına uygundur. Yönetici (Manager/Admin) yetkisi olmayan personeller finansal raporlara ve personel ayarlarına erişemez.

---

*Hazırlayan: RestoPro Geliştirme Ekibi*
