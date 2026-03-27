# ✅ RestoPro — Yapılacaklar Listesi (TODO)

> Tik atarak ilerle. Her görev tamamlandığında `[ ]` → `[x]` olarak işaretle.
> Öncelik: 🔴 Kritik → 🟡 Önemli → 🟢 İleri Seviye

---

## FAZ 1: Touch-First Tasarım 🔴

Bu faz tüm uygulamayı tablet/dokunmatik ekranlarda parmakla rahatça kullanılabilir hale getirir.

### 1.1 Global Touch CSS Katmanı (`index.css`)
- [x] Tüm butonlara minimum **48×48px** dokunma alanı
- [x] `hover:` efektlerini `active:` efektlerine çevirme
- [x] `-webkit-tap-highlight-color: transparent` ekleme
- [x] `touch-action: manipulation` (çift dokunma zoom engelleme)
- [x] `user-select: none` (kazara metin seçimini engelleme)
- [x] Scrollbar gizleme (touch scroll yeterli)
- [x] Font boyutlarını büyütme (min 14px body, 16px butonlar)

### 1.2 PIN Girişi (KeypadLogin)
- [x] Tuşları büyütme (~80×80px)
- [x] Tuş basma press animasyonu (`scale(0.95)`)
- [x] Yanlış PIN girişinde shake animasyonu

### 1.3 Masa Kartları (FloorPlanView)
- [x] Kartları büyütme (min 200×180px)
- [x] Active/press animasyonu (`scale(0.97)`)
- [x] Bölüm seçici tab'ları büyütme (min 48px yükseklik)
- [x] "Masa Ekle" butonu büyütme

### 1.4 Sipariş Detay Modal
- [x] Aksiyon butonlarını büyütme (Ürün Ekle, Hesap İste, vb.)
- [x] Ödeme butonlarını büyütme (min 60px yükseklik)
- [x] Sipariş taslağında ürün silme butonunu büyütme

### 1.5 Split-Screen Menü
- [x] Ürün kartlarını büyütme (min 160px genişlik)
- [x] Görselleri büyütme
- [x] Modifikatör butonlarını büyütme (min 48px yükseklik)
- [x] "Taslağa Ekle" butonunu büyütme

### 1.6 Menü Kataloğu (MenuView)
- [x] Kategori tab'larını büyütme
- [x] Ürün kartlarını büyütme
- [x] Arama çubuğunu büyütme

### 1.7 Personel & Stok Ekranları
- [x] Personel kartları touch uyumu
- [x] Stok listesi satır yüksekliği arttırma
- [x] Tüm butonlara min 48px dokunma alanı

---

## FAZ 2: Sipariş Akışı İyileştirmeleri 🔴

### 2.1 Adet Kontrolü (+/−)
- [x] Sipariş taslağında her ürüne `+` / `−` butonları ekle
- [x] Adet 0'a düşünce üründen silme
- [x] Toplam fiyat otomatik güncelleme

### 2.2 Menüde Kategori Filtresi (Split-Screen İçi)
- [x] Yatay kaydırılabilir kategori çubuğu (Tab Bar) ekle
- [x] "Tümü", "Başlangıçlar", "Ana Yemekler", "İçecekler" vb.
- [x] Aktif kategori vurgusu

### 2.3 Sipariş Notu
- [x] Her ürüne not ekleme alanı ("Az tuzlu", "Soğansız" vb.)
- [x] Masa geneli sipariş notu

---

## FAZ 3: UI/UX Tutarlılık 🟡

### 3.1 Dil Tutarlılığı
- [x] Dashboard'daki tüm İngilizce metinleri Türkçeye çevir
  - [x] "Reports & Analytics" → "Raporlar & Analizler"
  - [x] "Daily Revenue" → "Günlük Gelir"
  - [x] "Total Orders" → "Toplam Sipariş"
  - [x] "Cash Payments" → "Nakit Ödemeler"
  - [x] "Card Payments" → "Kart Ödemeler"
  - [x] "Recent Sales" → "Son Satışlar"
  - [x] "Top Sellers" → "En Çok Satanlar"
  - [x] "Today" → "Bugün"
  - [x] "Table" / "Payment" / "Time" / "Items" / "Total" → Türkçe
  - [x] "View All" → "Tümünü Gör"

### 3.2 Masa Kartı Zenginleştirme
- [x] Masadaki sipariş özeti (ilk 2-3 ürün adı) göster
- [x] Masanın açık süresi → gerçek zamanlı timer (placeholder eklendi)
- [x] Garson ismi (placeholder eklendi)

### 3.3 Bildirim Sistemi
- [x] Header'daki bell ikonu → aktif bildirim sayısı
- [x] Hesap istenen masalarda görsel uyarı (renk ve durum metni)
- [x] Stok azalma uyarısı (bildirim sayacına dahil edildi)

---

## FAZ 4: Sipariş Durumu & Mutfak Ekranı 🟡

### 4.1 Sipariş Durumu Takibi
- [x] `OrderItem` durumları: `new → preparing → ready → served`
- [x] Renk kodlu durum göstergeleri (Badge)
- [x] Garsonun "Servis Edildi" butonu (Mutfak ekranında teslim etme butonuna bağlandı)

### 4.2 Mutfak Ekranı (KDS)
- [x] Yeni `KitchenView` bileşeni oluşturuldu.
- [x] Aktif siparişleri kartlarda göster (Masa ve ürün detayları ile birlikte)
- [x] "Hazır" düğmesi ile durum güncelleme
- [x] Renk kodları: Yeni (kırmızı), Hazırlanıyor (sarı), Hazır (yeşil)
- [x] Sipariş sıralaması ve filtreleme (Tümü, Yeni, Hazırlanıyor vb.)
- [x] Sidebar'a menü öğesi ekle

---

## FAZ 5: Veri Kalıcılığı ✅

### 5.1 Firebase'siz Kalıcılık
- [x] localStorage ile sipariş/masa verilerini kaydetme
- [x] Sayfa yenilendiğinde verileri geri yükleme
- [x] Temizleme/sıfırlama butonu

### 5.2 Menü & Personel Düzenleme
- [x] Ürün düzenleme (fiyat, açıklama, fotoğraf)
- [x] Personel düzenleme (isim, rol, PIN değiştirme)
- [x] Ürün "Tükendi" işaretleme

---

## FAZ 6: Gelişmiş Özellikler 🟡

### 6.1 Garson-Masa Ataması
- [x] Her masaya garson atayabilme
- [x] Garson bazlı filtreleme (Kat Planı)
- [x] Siparişlerde garson bilgisini kaydetme

### 6.2 İndirim ve Promosyon
- [x] Yüzde veya sabit tutar indirimi
- [x] Masa bazlı indirim yönetimi (Müdür yetkisi)
- [x] Satış raporlarında indirimlerin gösterilmesi

### 6.3 Fiş/Adisyon Çıktısı
- [x] Tarayıcıdan yazdırılabilir fiş formatı (@media print)
- [x] Ürün detayları, garson ve indirim bilgisini fise ekleme

### 6.4 Çoklu Ödeme (Split)
- [x] Hesabı ürün bazlı bölme (Kısmi Ödeme)
- [x] Ödenen ürünlerin takibi ve görsel ayrımı
- [x] Tüm ürünler ödendiğinde masanın tam kapanması

### 6.5 Dashboard Geliştirmeleri
- [x] Tarih filtresi (bugün / hafta / ay)
- [x] Gelir trendi grafiği
- [x] PDF rapor dışa aktarma (Yazdırma özelliği eklendi)

---

## FAZ 7: Kod Kalitesi 🟡 (Devam Ediyor)

### 7.1 Modülerleştirme
- [x] Geri kalan Faz özelliklerini tamamla (Masa ekranında sipariş detay, Dashboard geliştirmeleri, Stok girişi)
- [ ] `App.tsx`'i bileşenlere ayır:
  - [ ] `components/layout/Sidebar.tsx`
  - [ ] `components/layout/Header.tsx`
  - [ ] `components/shared/Toast.tsx`
  - [x] `components/shared/StatCard.tsx`
  - [x] `views/DashboardView.tsx`
  - [ ] `views/FloorPlanView/index.tsx`
  - [ ] `views/FloorPlanView/TableCard.tsx`
  - [ ] `views/FloorPlanView/OrderDetailModal.tsx`
  - [ ] `views/FloorPlanView/MenuSelector.tsx`
  - [ ] `views/FloorPlanView/DraftSidebar.tsx`
  - [ ] `views/FloorPlanView/PaymentSection.tsx`
  - [ ] `views/MenuView.tsx`
  - [ ] `views/StaffView.tsx`
  - [ ] `views/InventoryView.tsx`
  - [ ] `views/KeypadLogin.tsx`
- [ ] Custom hooks oluştur:
  - [ ] `hooks/useOrders.ts`
  - [ ] `hooks/useTables.ts`
  - [ ] `hooks/useLocalStorage.ts`
- [ ] `App.tsx` → sadece routing ve layout (~200 satır)

### 7.2 Gerçek Görseller ve İyileştirmeler
- [ ] `picsum.photos` placeholder'larını gerçekçi menü resimleriyle değiştir
- [ ] Olay log kayıtlarını daha okunabilir şekilde iyileştir
- [ ] Kapsamlı kod temizliği (gereksiz console.log'lar vs.)

## 7.3 Genel Hata Giderme ve Temizlik
- [x] Touchpad/Login ekranındaki Firebase Anonymous Auth "bağlantı hatası" uyarısını tamamen kaldır
- [x] Uygulama genelinde TypeScript hata düzeltmeleri (örn. MenuItem description)
- [x] Gereksiz kullanılmayan state'lerin temizlenmesi (authError)
- [ ] Konsol loglarının üretim öncesi (production-ready) olarak temizlenmesi

---

## FAZ 8: Kurumsal Özellikler ve Performans ⚪ (Planlanıyor)

### 8.1 Performans İyileştirmeleri
- [ ] Büyük listeler için (Menu, Stok) Virtualization (React-window vs) kullanımı
- [ ] React.memo ve useMemo ile gereksiz renderların önlenmesi
- [ ] Bileşen bazlı Code Splitting (React.lazy) uygulanması

### 8.2 Restoran İşletme Geliştirmeleri
- [ ] Kurye Takip Ekranı (Paket Servis Siparişleri için)
- [ ] Garson Performans ve Bahşiş (Tip) Takip Sistemi
- [ ] Rezervasyon Çakışma Önleme ve Kapasite Uyarı Sistemi

---

## 📊 İlerleme Takibi

| Faz | Toplam Görev | Tamamlanan | Durum |
|-----|-------------|------------|-------|
| 1 — Touch-First | 27 | 27 | ✅ Tamamlandı |
| 2 — Sipariş Akışı | 8 | 8 | ✅ Tamamlandı |
| 3 — UI Tutarlılık | 16 | 16 | ✅ Tamamlandı |
| 4 — Mutfak Ekranı | 10 | 10 | ✅ Tamamlandı |
| 5 — Veri Kalıcılığı | 6 | 6 | ✅ Tamamlandı |
| 6 — Gelişmiş | 10 | 10 | ✅ Tamamlandı |
| 7 — Kod Kalitesi | 24 | 10 | 🟡 Devam Ediyor |
| 8 — Performans | 6 | 0 | ⚪ Planlanıyor |
| **TOPLAM** | **107** | **87** | **~%81** |
