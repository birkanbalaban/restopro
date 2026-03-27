# 🍽️ RestoPro — Proje Walkthrough

> **Restoran POS & Yönetim Sistemi**
> Touchscreen uyumlu, React + Vite + TailwindCSS tabanlı web uygulaması.

---

## 📁 Proje Yapısı

```
restopro/
├── index.html                ← Giriş noktası, <title>RestoPro</title>
├── vite.config.ts            ← Vite config, allowedHosts, HMR
├── package.json              ← Bağımlılıklar
├── tsconfig.json             ← TypeScript config
├── docs/                     ← 📋 Proje dökümanları
│   ├── WALKTHROUGH.md        ← Bu dosya
│   └── TODO.md               ← Yapılacaklar listesi
└── src/
    ├── main.tsx              ← React DOM render
    ├── App.tsx               ← ⚠️ ~2260 satır, tüm uygulama burada
    ├── index.css             ← Tailwind tema, glass efektleri
    ├── types.ts              ← TypeScript arayüzleri
    ├── constants.ts          ← Demo veriler (masalar, menü, personel)
    ├── firebase.ts           ← Firebase bağlantı (opsiyonel)
    └── services/
        └── firebaseService.ts ← Firestore CRUD işlemleri
```

---

## 🔥 Firebase Zorunlu mu?

**Hayır.** Uygulama iki modda çalışır:

| Mod | Koşul | Veri Kaynağı |
|-----|-------|-------------|
| **Demo Mod** | PIN ile giriş (Auth yok) | `constants.ts` + yerel React state |
| **Firebase Mod** | Google Auth ile giriş | Firestore gerçek zamanlı DB |

Demo Mod'da sipariş açma, ürün ekleme, ödeme alma — her şey çalışır.  
Tek fark: sayfa yenilenince veriler sıfırlanır (localStorage ile çözülebilir).

---

## 🧩 Bileşen Haritası

Tüm bileşenler `src/App.tsx` içinde:

| Bileşen | Satır Aralığı | Açıklama |
|---------|--------------|----------|
| `cn()` | 58-60 | Tailwind sınıf birleştirme yardımcısı |
| `Toast` | 68-84 | Bildirim bileşeni |
| `SidebarItem` | 86-119 | Sol menü öğesi |
| `StatCard` | 121-141 | İstatistik kartı |
| `DashboardView` | 145-255 | Raporlar & Analizler |
| `FloorPlanView` | 257-1118 | Masa düzeni & sipariş yönetimi |
| `MenuView` | 1120-1533 | Menü kataloğu |
| `StaffView` | 1535-1736 | Personel yönetimi |
| `InventoryView` | 1738-1888 | Stok takibi |
| `KeypadLogin` | 1892-2028 | PIN giriş ekranı |
| `App` | 2030-2260 | Ana layout, routing, state |

---

## 🔐 Kimlik Doğrulama

### PIN Girişi (KeypadLogin)
- `constants.ts` → `STAFF` dizisindeki PIN'lerle eşleşir
- PIN `1234` → Yönetici yetkisi (`isManager = true`)
- Giriş sonrası `currentStaff` state'i set edilir

### Firebase Auth (Opsiyonel)
- "Yönetici Girişi (Kurtarma)" butonu → Google Auth
- Auth olmadan Demo Mod çalışır

---

## 🪑 Masa Yönetimi (FloorPlanView)

- **Grid layout:** `grid-cols-1 sm:2 lg:3 xl:4`
- **3 bölüm:** Ana Salon / Teras / VIP
- **3 durum:** `free` (Yeşil) / `occupied` (Sarı) / `bill-requested` (Mor)
- **Masa ekleme:** Modal pencere ile (yönetici)
- **Boş masaya tıklama:** Otomatik sipariş açar
- **İstatistik paneli:** Doluluk oranı, canlı ciro, servis hızı

---

## 📝 Sipariş Akışı

```
Masaya Tıkla → Sipariş Oluştur → Ürün Ekle Butonu
    ↓
Split-Screen Menü Açılır
    ├── Sol Panel: Menü ürünleri (grid)
    └── Sağ Panel: Sipariş taslağı (cart)
    ↓
Modifikatör Seç (varsa) → Taslağa Ekle → Tekrar Seç veya...
    ↓
SİPARİŞİ ONAYLA → Mutfağa Gider
    ↓
Ödeme Al (Kart/Nakit) → Masa Kapanır → Satışa Kaydedilir
```

### Sipariş Detay Modal
- **Dinamik genişlik:** Normal `max-w-2xl` / Menü açık `max-w-6xl`
- **Split-screen:** Sol `flex-[1.8]` (menü) + Sağ `flex-1 min-w-[340px]` (taslak)
- **Onay butonu:** Boşken disabled "ÜRÜN SEÇİNİZ" / Doluyken aktif "SİPARİŞİ ONAYLA"

---

## 📋 Menü Kataloğu (MenuView)

- Kategori filtreleme + metin arama
- Ürün kartları (fotoğraf, isim, fiyat)
- Ürün detay modal (modifikatörler)
- Yeni ürün ekleme, özel kategori, silme (yönetici)

---

## 👥 Personel (StaffView)

- Kart listesi (avatar, isim, rol, online/offline)
- Durum değiştirme (Aktif ↔ Molada)
- Ekleme / silme (yönetici)
- Aktivite günlüğü (timeline)

---

## 📦 Stok Takibi (InventoryView)

- Ürün listesi (ad, stok, birim, min stok)
- Stok güncelleme
- Düşük stok uyarısı, arama

---

## 📊 Dashboard (DashboardView)

- 4 stat kartı (günlük gelir, toplam sipariş, nakit, kart)
- Son satışlar tablosu
- En çok satanlar listesi
- ⚠️ Metinler İngilizce (Türkçeleştirilecek)

---

## 🎨 Tasarım Sistemi

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--color-bg` | `#161618` | Ana arka plan |
| `--color-surface` | `#202022` | Kartlar |
| `--color-accent` | `#9d7bfa` | Ana vurgu (mor) |
| `--color-text-primary` | `#f4f4f5` | Ana metin |
| `--color-text-secondary` | `#a1a1aa` | İkincil metin |

**Font:** Inter (sans-serif) + JetBrains Mono (mono)

---

## ⚡ Çalıştırma

```bash
npm run dev -- --port 3200 --host 0.0.0.0
```

Erişim: `http://localhost:3200` veya `https://restopro.bosver.site`
