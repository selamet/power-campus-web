/** Static option lists used across registration and invite forms. */

export const LANGUAGES = [
  'İngilizce',
  'Almanca',
  'Fransızca',
  'İspanyolca',
  'İtalyanca',
  'Rusça',
  'Arapça',
] as const;

export const LEVELS = [
  'A1 — Başlangıç',
  'A2 — Temel',
  'B1 — Orta',
  'B2 — Orta-Üstü',
  'C1 — İleri',
  'C2 — Üst Düzey',
] as const;

export const GOALS = [
  'Genel İngilizce',
  'Sınav Hazırlık (IELTS/TOEFL)',
  'İş İngilizcesi',
  'Akademik',
  'Konuşma Kulübü',
  'YDS / YÖKDİL',
] as const;

export const COURSES = [
  'Hafta İçi Sabah',
  'Hafta İçi Akşam',
  'Hafta Sonu Yoğun',
  'Birebir Özel',
  'Online Canlı',
] as const;

export const PAY_METHODS = [
  'Kredi Kartı',
  'Banka Havalesi / EFT',
  'Nakit',
  'Kapıda Ödeme',
] as const;

/** All 81 Turkish provinces, in Turkish alphabetical order. */
export const CITIES = [
  'Adana',
  'Adıyaman',
  'Afyonkarahisar',
  'Ağrı',
  'Aksaray',
  'Amasya',
  'Ankara',
  'Antalya',
  'Ardahan',
  'Artvin',
  'Aydın',
  'Balıkesir',
  'Bartın',
  'Batman',
  'Bayburt',
  'Bilecik',
  'Bingöl',
  'Bitlis',
  'Bolu',
  'Burdur',
  'Bursa',
  'Çanakkale',
  'Çankırı',
  'Çorum',
  'Denizli',
  'Diyarbakır',
  'Düzce',
  'Edirne',
  'Elazığ',
  'Erzincan',
  'Erzurum',
  'Eskişehir',
  'Gaziantep',
  'Giresun',
  'Gümüşhane',
  'Hakkari',
  'Hatay',
  'Iğdır',
  'Isparta',
  'İstanbul',
  'İzmir',
  'Kahramanmaraş',
  'Karabük',
  'Karaman',
  'Kars',
  'Kastamonu',
  'Kayseri',
  'Kırıkkale',
  'Kırklareli',
  'Kırşehir',
  'Kilis',
  'Kocaeli',
  'Konya',
  'Kütahya',
  'Malatya',
  'Manisa',
  'Mardin',
  'Mersin',
  'Muğla',
  'Muş',
  'Nevşehir',
  'Niğde',
  'Ordu',
  'Osmaniye',
  'Rize',
  'Sakarya',
  'Samsun',
  'Siirt',
  'Sinop',
  'Sivas',
  'Şanlıurfa',
  'Şırnak',
  'Tekirdağ',
  'Tokat',
  'Trabzon',
  'Tunceli',
  'Uşak',
  'Van',
  'Yalova',
  'Yozgat',
  'Zonguldak',
] as const;

export const RELATIONS = ['Anne', 'Baba', 'Eş', 'Kardeş', 'Vasi', 'Kendisi', 'Diğer'] as const;

export const GENDERS = ['Kadın', 'Erkek', 'Belirtmek istemiyor'] as const;

/** Free-schedule plan — the student pays whenever they want. */
export const CUSTOM_PLAN = 'Özel';

export const PAYMENT_PLANS = [
  'Peşin',
  ...Array.from({ length: 11 }, (_, i) => `${i + 2} Taksit`),
  CUSTOM_PLAN,
];

/** How many course terms ("kur") a registration can cover. */
export const TERM_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
