import { Table, MenuItem, Staff, InventoryItem, SaleRecord, Reservation } from './types';

// === SAMPLE DATA FOR DEVELOPMENT ===
// These are seed/mock data used during development and for /api/seed endpoint.
// In production, all data comes from the SQLite database via Express API.

// Sample reservations
export const RESERVATIONS: Reservation[] = [
  { id: 'r1', customerName: 'Ali Yılmaz', phone: '0532 123 45 67', date: new Date().toISOString().split('T')[0], time: '19:30', guestCount: 4, tableId: '1', status: 'confirmed', notes: 'Pencere kenarı', createdAt: Date.now() },
  { id: 'r2', customerName: 'Ayşe Kaya', phone: '0555 987 65 43', date: new Date().toISOString().split('T')[0], time: '20:00', guestCount: 2, tableId: null, status: 'pending', createdAt: Date.now() },
];

// Sample tables for floor plan
export const TABLES: Table[] = [
  { id: '1', name: 'Masa 1', status: 'occupied', capacity: 4, currentOrderTotal: 450, occupiedTime: '45 dk', section: 'Ana Salon', x: 100, y: 100 },
  { id: '2', name: 'Masa 2', status: 'free', capacity: 2, section: 'Ana Salon', x: 250, y: 100 },
  { id: '3', name: 'Masa 3', status: 'bill-requested', capacity: 6, currentOrderTotal: 1250, occupiedTime: '1 sa 20 dk', section: 'Ana Salon', x: 400, y: 100 },
  { id: '4', name: 'Masa 4', status: 'occupied', capacity: 4, currentOrderTotal: 320, occupiedTime: '20 dk', section: 'Ana Salon', x: 100, y: 250 },
  { id: '5', name: 'Masa 5', status: 'free', capacity: 4, section: 'Ana Salon', x: 250, y: 250 },
  { id: '6', name: 'Teras 1', status: 'occupied', capacity: 4, currentOrderTotal: 580, occupiedTime: '35 dk', section: 'Teras', x: 100, y: 100 },
  { id: '7', name: 'Teras 2', status: 'free', capacity: 4, section: 'Teras', x: 250, y: 100 },
  { id: '8', name: 'Loca 1', status: 'occupied', capacity: 8, currentOrderTotal: 2100, occupiedTime: '2 sa', section: 'VIP', x: 100, y: 100 },
];

// Sample menu items with pricing and modifiers
export const MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Mercimek Çorbası', category: 'Başlangıçlar', price: 85, description: 'Geleneksel süzme mercimek çorbası, kıtır ekmek ile.', image: 'https://picsum.photos/seed/soup/400/300', isAvailable: true },
  { id: 'm2', name: 'Adana Kebap', category: 'Ana Yemekler', price: 320, description: 'Zırh kıyması, közlenmiş biber ve domates ile.', image: 'https://picsum.photos/seed/kebab/400/300', isAvailable: true },
  { id: 'm3', name: 'Beyti Sarma', category: 'Ana Yemekler', price: 350, description: 'Lavaş içerisinde özel soslu kebap, yoğurt ile.', image: 'https://picsum.photos/seed/beyti/400/300', isAvailable: true },
  { id: 'm4', name: 'Gavurdağı Salatası', category: 'Salatalar', price: 120, description: 'İnce kıyılmış sebzeler, ceviz ve nar ekşisi ile.', image: 'https://picsum.photos/seed/salad/400/300', isAvailable: true },
  { id: 'm5', name: 'Künefe', category: 'Tatlılar', price: 150, description: 'Sıcak servis edilen peynirli kadayıf tatlısı.', image: 'https://picsum.photos/seed/kunefe/400/300', isAvailable: true },
  { id: 'm6', name: 'Ayran', category: 'İçecekler', price: 35, description: 'Ev yapımı bol köpüklü ayran.', image: 'https://picsum.photos/seed/ayran/400/300', isAvailable: true },
  { id: 'm7', name: 'Türk Kahvesi', category: 'İçecekler', price: 65, description: 'Geleneksel Türk kahvesi, lokum ile.', image: 'https://picsum.photos/seed/coffee/400/300', isAvailable: true },
  {
    id: 'm8',
    name: 'Latte',
    category: 'Sıcak İçecekler',
    price: 90,
    description: 'Taze çekilmiş espresso ve sıcak süt.',
    image: 'https://picsum.photos/seed/latte/400/300',
    isAvailable: true,
    modifierGroups: [
      {
        name: 'Süt Seçimi',
        required: true,
        multiSelect: false,
        options: [
          { name: 'Normal Süt', price: 0 },
          { name: 'Badem Sütü', price: 15 },
          { name: 'Yulaf Sütü', price: 15 },
          { name: 'Soya Sütü', price: 10 }
        ]
      },
      {
        name: 'Şurup Seçimi',
        required: false,
        multiSelect: true,
        options: [
          { name: 'Karamel Şurubu', price: 10 },
          { name: 'Vanilya Şurubu', price: 10 },
          { name: 'Fındık Şurubu', price: 10 }
        ]
      }
    ]
  },
];

// Sample staff members with roles
export const STAFF: Staff[] = [
  { id: 's1', name: 'Ahmet Yılmaz', role: 'manager', status: 'active', lastActive: 'Şimdi', avatar: 'https://i.pravatar.cc/150?u=ahmet', pin: '1234' },
  { id: 's2', name: 'Mehmet Demir', role: 'waiter', status: 'active', lastActive: 'Şimdi', avatar: 'https://i.pravatar.cc/150?u=mehmet', pin: '0000' },
  { id: 's3', name: 'Ayşe Kaya', role: 'chef', status: 'active', lastActive: 'Şimdi', avatar: 'https://i.pravatar.cc/150?u=ayse', pin: '1111' },
  { id: 's4', name: 'Caner Öz', role: 'waiter', status: 'on-break', lastActive: '15 dk önce', avatar: 'https://i.pravatar.cc/150?u=caner', pin: '2222' },
];

// Sample inventory items (for kitchen and supplies)
export const INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Dana Kıyma', category: 'Et', stock: 15.5, unit: 'kg', minStock: 5, price: 450, supplier: 'Özkan Et A.Ş.', isExternal: false },
  { id: 'i2', name: 'Domates', category: 'Sebze', stock: 42, unit: 'kg', minStock: 10, price: 35, supplier: 'Pazar Taze', isExternal: false },
  { id: 'i3', name: 'Yoğurt', category: 'Süt Ürünleri', stock: 8, unit: 'kg', minStock: 5, price: 60, supplier: 'Sütaş', isExternal: false, expiresAt: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]; })() },
  { id: 'i4', name: 'Mercimek', category: 'Bakliyat', stock: 25, unit: 'kg', minStock: 5, price: 45 },
  { id: 'i5', name: 'Antep Fıstığı', category: 'Kuruyemiş', stock: 2, unit: 'kg', minStock: 3, price: 850, supplier: 'Gaziantep Fıstıkçı', isExternal: true },
  { id: 'i6', name: 'Cheesecake', category: 'Tatlı', stock: 6, unit: 'adet', minStock: 3, price: 180, supplier: 'Şef Pasta A.Ş.', isExternal: true, expiresAt: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })(), batchNote: 'Lot #241 – 22 Mar teslimat' },
  { id: 'i7', name: 'Künefe Peyniri', category: 'Süt Ürünleri', stock: 4, unit: 'kg', minStock: 2, price: 220, supplier: 'Urfa Peynircilik', isExternal: true, expiresAt: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() },
  { id: 'i8', name: 'Brownie', category: 'Tatlı', stock: 12, unit: 'adet', minStock: 5, price: 120, supplier: 'Şef Pasta A.Ş.', isExternal: true, expiresAt: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })() },
];

// Sample sales records for reporting
export const SALES: SaleRecord[] = [
  { id: 'sl1', tableId: '3', tableName: 'Masa 3', subtotal: 1250, discountTotal: 0, total: 1250, paymentMethod: 'card', timestamp: '18:45', itemsCount: 8, createdAt: new Date(Date.now() - 3600000).getTime() },
  { id: 'sl2', tableId: '12', tableName: 'Masa 12', subtotal: 450, discountTotal: 0, total: 450, paymentMethod: 'cash', timestamp: '18:30', itemsCount: 4, createdAt: new Date(Date.now() - 7200000).getTime() },
  { id: 'sl3', tableId: '5', tableName: 'Masa 5', subtotal: 820, discountTotal: 0, total: 820, paymentMethod: 'card', timestamp: '18:15', itemsCount: 6, createdAt: new Date(Date.now() - 10800000).getTime() },
];
