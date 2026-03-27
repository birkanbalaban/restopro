<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 Restopro POS: Profesyonel Restoran Otomasyon Sistemi

Restopro, modern restoranlar ve kafeler için tasarlanmış; gerçek zamanlı senkronizasyon özelliklerine sahip, bulut tabanlı bir POS (Satış Noktası) ve operasyon yönetim sistemidir.

---

## 🌟 Temel Yetenekler (Capabilities)

### 1. Dinamik Kat Planı (Floor Plan)
- **Gerçek Zamanlı Durum:** Masaların doluluk oranını (Boş, Dolu, Hesap İstendi, Rezerve) anlık renk değişimleriyle izleyin.
- **Hızlı Masa Yönetimi:** Kapasite kontrolü ve masa isimlendirme ile kolay kat planı oluşturma.
- **Garson Takibi:** Hangi masayla hangi personelin ilgilendiğini anlık görün.

### 2. Akıllı Sipariş Yönetimi (POS)
- **Modifiye Edilebilir Ürünler:** Latte gibi ürünlerde "Süt Tipi" veya "Şurup" gibi alt seçeneklerle özelleştirilebilir siparişler.
- **Sipariş Taslağı:** Onaylanmadan önce siparişleri düzenleme ve not ekleme.
- **Parçalı Ödeme & İptal:** Kalem bazlı işlem yapabilme yeteneği.

### 3. Mutfak Ekranı (KDS)
- **Hazırlık Takibi:** "Beklemede -> Hazırlanıyor -> Hazır -> Servis Edildi" aşamalarıyla mutfak iş akışını yönetin.
- **Zaman Takibi:** Siparişlerin ne kadar süredir beklediğini görerek servis kalitesini artırın.

### 4. Rezervasyon Sistemi
- **Takvim Entegrasyonu:** Günlük rezervasyon takibi ve "Tüm Tarihler" görünümü ile geçmiş/gelecek kayıtları tek tuşla listeleme.
- **Doğrudan Yerleştirme:** Gelen müşteriyi tek tıkla masaya oturtma ve masayı "Dolu" moduna geçirme.

### 5. Personel & Vardiya Yönetimi
- **Giriş Güvenliği:** Her personel için özel **PIN** kodlu kilit sistemi.
- **Vardiya Planlama:** Haftalık çalışma programları hazırlama ve rol bazlı (Admin/Garson/Aşçı) yetki tanımlama.

### 6. Envanter & Raporlama
- **Stok Takibi:** Kritik stok seviyeleri için uyarılar ve tedarikçi yönetimi.
- **Satış Dashboard:** Günlük satış hacmi, popüler ürünler ve kategori bazlı performans analizi.

---

## ⚙️ Kurulum ve Firebase Yapılandırması

Restopro, verilerini güvenli bir şekilde saklamak ve cihazlar arası senkronizasyon sağlamak için **Firebase Cloud Firestore** kullanır.

### 1. Firebase Projesini Hazırlama
1. [Firebase Console](https://console.firebase.google.com/) üzerinden bir proje oluşturun.
2. Bir **Web App** kaydedin ve size verilen anahtarları kopyalayın.
3. **Firestore Database** sekmesine giderek veritabanını oluşturun (Varsayılan olarak "Test Mode" seçilebilir).

### 2. Ortam Değişkenleri (`.env`)
Proje ana dizininde bulunan **`.env.example`** dosyasını referans alarak bir **`.env`** dosyası oluşturun:

```env
VITE_FIREBASE_API_KEY=Kendi_Anahtarınız
VITE_FIREBASE_AUTH_DOMAIN=projeniz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projeniz-kimliği
VITE_FIREBASE_STORAGE_BUCKET=projeniz.appspot.com
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

## 🔒 Güvenlik Notu
Şu an sistem geliştirmeye uygun olması adına `Firestore Rules` üzerinden tam yetkiyle çalışmaktadır. Canlı sisteme geçişte kuralların sadece yetkili kullanıcıların (PIN doğrulaması yapılmış) yazabileceği şekilde güncellenmesi önerilir.

---

*Hazırlayan: RestoPro Geliştirme Ekibi*
