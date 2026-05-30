import type { ActivityItem, Staff, Student } from '@/types/domain';

/**
 * Bundled mock data used while VITE_USE_MOCKS is enabled.
 * Mirrors the API response shapes so services can swap to real endpoints
 * without touching the rest of the app.
 */

export const MOCK_STAFF: Staff = {
  name: 'Elif Demir',
  role: 'Personel',
  email: 'elif.demir@powerakademi.com',
  branch: 'Kadıköy Şube',
};

export const MOCK_STUDENTS: Student[] = [
  { id: 'PA-1042', name: 'Zeynep Kaya', lang: 'İngilizce', level: 'B1 — Orta', course: 'Hafta İçi Akşam', status: 'active', phone: '0532 114 22 87', start: '2026-02-03', fee: 18500, paid: 18500, plan: '3 Taksit', next: null, joined: '2026-01-28', email: 'zeynep.kaya@gmail.com' },
  { id: 'PA-1043', name: 'Mert Yıldız', lang: 'Almanca', level: 'A2 — Temel', course: 'Hafta Sonu Yoğun', status: 'active', phone: '0541 308 91 04', start: '2026-02-10', fee: 21000, paid: 14000, plan: '4 Taksit', next: '2026-06-10', joined: '2026-02-01', email: 'mert.yildiz@outlook.com' },
  { id: 'PA-1051', name: 'Aylin Şahin', lang: 'İngilizce', level: 'C1 — İleri', course: 'Online Canlı', status: 'pending', phone: '0505 762 33 18', start: '2026-06-15', fee: 24500, paid: 0, plan: 'Peşin', next: '2026-06-15', joined: '2026-05-28', email: 'aylin.sahin@gmail.com', source: 'davet' },
  { id: 'PA-1052', name: 'Can Öztürk', lang: 'İngilizce', level: 'A1 — Başlangıç', course: 'Hafta İçi Sabah', status: 'pending', phone: '0533 901 45 76', start: '2026-06-09', fee: 16500, paid: 0, plan: '2 Taksit', next: '2026-06-09', joined: '2026-05-29', email: 'can.ozturk@gmail.com', source: 'davet' },
  { id: 'PA-1038', name: 'Selin Arslan', lang: 'Fransızca', level: 'B2 — Orta-Üstü', course: 'Birebir Özel', status: 'active', phone: '0542 667 12 90', start: '2026-01-20', fee: 32000, paid: 24000, plan: '4 Taksit', next: '2026-06-20', joined: '2026-01-15', email: 'selin.arslan@gmail.com' },
  { id: 'PA-1029', name: 'Burak Çelik', lang: 'İngilizce', level: 'B1 — Orta', course: 'Hafta İçi Akşam', status: 'active', phone: '0536 220 88 41', start: '2025-12-08', fee: 18500, paid: 18500, plan: 'Peşin', next: null, joined: '2025-12-01', email: 'burak.celik@gmail.com' },
  { id: 'PA-1055', name: 'Deniz Aydın', lang: 'İspanyolca', level: 'A1 — Başlangıç', course: 'Hafta Sonu Yoğun', status: 'pending', phone: '0507 145 39 22', start: '2026-06-22', fee: 19500, paid: 0, plan: '3 Taksit', next: '2026-06-22', joined: '2026-05-30', email: 'deniz.aydin@gmail.com', source: 'manuel' },
  { id: 'PA-1011', name: 'Ece Koç', lang: 'İngilizce', level: 'C2 — Üst Düzey', course: 'Online Canlı', status: 'active', phone: '0538 472 60 15', start: '2025-11-12', fee: 26000, paid: 19500, plan: '4 Taksit', next: '2026-06-12', joined: '2025-11-05', email: 'ece.koc@gmail.com' },
  { id: 'PA-1009', name: 'Kaan Demirtaş', lang: 'Almanca', level: 'B1 — Orta', course: 'Hafta İçi Akşam', status: 'inactive', phone: '0535 119 47 83', start: '2025-09-01', fee: 17500, paid: 17500, plan: 'Peşin', next: null, joined: '2025-08-25', email: 'kaan.d@gmail.com' },
  { id: 'PA-1058', name: 'Naz Yılmaz', lang: 'İngilizce', level: 'A2 — Temel', course: 'Hafta İçi Sabah', status: 'active', phone: '0543 882 11 09', start: '2026-03-15', fee: 16500, paid: 11000, plan: '3 Taksit', next: '2026-06-15', joined: '2026-03-10', email: 'naz.yilmaz@gmail.com' },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  { who: 'Aylin Şahin', what: 'hoşgeldin formunu doldurdu, onay bekliyor', icon: 'clipboard', kind: 'accent', time: '12 dk önce' },
  { who: 'Elif Demir', what: 'Deniz Aydın kaydını manuel oluşturdu', icon: 'plus', kind: 'neutral', time: '1 saat önce' },
  { who: 'Mert Yıldız', what: '2. taksit ödemesini tamamladı · ₺7.000', icon: 'wallet', kind: 'ok', time: '3 saat önce' },
  { who: 'Can Öztürk', what: 'davet linkini açtı', icon: 'link', kind: 'neutral', time: '5 saat önce' },
  { who: 'Zeynep Kaya', what: 'B1 kuruna kayıt onaylandı', icon: 'checkCircle', kind: 'ok', time: 'Dün' },
];

/** Simulates network latency for the mock data layer. */
export const mockDelay = <T>(value: T, ms = 400): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
