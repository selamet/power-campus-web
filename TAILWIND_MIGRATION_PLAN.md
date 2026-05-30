# Tailwind Yeniden Tasarım Planı — Power Campus Web

> Bu dosya `/clear` sonrası context kaybolsa da diskte kalır.
> Yeni oturumda: **"TAILWIND_MIGRATION_PLAN.md'deki adımları uygula"** de.

## Hedef

Mevcut UI'ı **tamamen Tailwind utility / component yaklaşımıyla yeniden oluştur**
ve **görsel tasarımı da yenile** (frontend-design skill yaklaşımıyla, jenerik AI
görünümünden kaçınan, distinctive ve production-grade bir arayüz).

Kullanıcı onayı: kapsam = "Görsel tasarımı da yenile".

## Mevcut Durum (özet)

- **Stack:** React 18 + Vite 6 + Redux Toolkit + react-router-dom 6 + Tailwind CSS v4 (`@tailwindcss/vite`).
- **Tema:** `[data-theme="dark"]` ile dark mode; design token'lar `src/styles/global.css` içinde
  CSS değişkenleri olarak tanımlı ve `@theme inline` ile Tailwind renklerine map'lenmiş
  (`bg`, `surface`, `ink`, `accent`, `ok`, `warn`, `info` vb.). **Bu token sistemi korunmalı** —
  redesign bu token'lar üzerinden yapılmalı, runtime tema değişimi bozulmamalı.
- **Sorun:** Feature sayfaları inline style + özel CSS sınıfları karışımı kullanıyor:
  `.strow`, `.shead`, `.sbody`, `.sidebar`, `.topbar-*`, `.choice-card`, `.approve-row`,
  `.students-table`, responsive `@media` blokları. Bunlar Tailwind utility'lerine taşınacak.
- **Korunacak yardımcılar:** `.card`, `.kicker`, `.logo-img`, `.mark-img`, `.select-chevron`,
  `.field-focus`, animasyon keyframe'leri (`anim-*`, `stagger`, `spinner`) — component layer.
  Bunların bir kısmı Tailwind'e taşınabilir, keyframe'ler `@theme` veya `@utility` ile kalabilir.

## Dosya Envanteri

UI kütüphanesi (Tailwind ile yazılmış, küçük — gözden geçir/genişlet):
- `src/components/ui/`: Avatar, Badge, Button, Icon, Logo, Modal, Steps, Toggle, inputs, toast/*, icons.ts, index.ts

Taşınacak/yeniden tasarlanacak ekranlar:
- `src/layout/`: AppShell, Sidebar, Topbar, shellContext
- `src/features/auth/LoginPage.tsx`
- `src/features/dashboard/DashboardPage.tsx` + components/MetricCard
- `src/features/students/StudentsPage.tsx`, RegistrationFormPage, components/(AddStudentModal, InviteFlowModal, StudentDrawer), useStudentActions
- `src/app/ThemeManager.tsx`
- `src/routes/`: ProtectedRoute, paths
- `src/styles/global.css` (özel sınıfları temizle, token + base + keyframe kalsın)

Dokunulmayacak (mantık/veri): api/, app/store+hooks, config/, constants/, mocks/,
types/, utils/, *Slice.ts, *Api.ts (sadece gerekirse import düzeltmesi).

## Uygulama Sırası (commit commit, Claude atfı YOK)

1. **frontend-design skill'i çağır** — yeni görsel dil / design direction belirle
   (token paleti zaten var; tipografi, boşluk, radius, gölge, mikro-etkileşim dilini netleştir).
2. **UI component kütüphanesini güçlendir** — Button/Badge/Avatar/Modal/Input/Steps/Toggle
   varyantlarını Tailwind ile tutarlı API'ye getir; eksikse Card, Table, Drawer, Tabs ekle.
3. **Layout** — AppShell + Sidebar + Topbar'ı Tailwind utility'lerle yeniden kur;
   responsive davranışı `@media` yerine Tailwind breakpoint'leriyle (`md:`, `lg:`).
4. **Auth** — LoginPage redesign.
5. **Dashboard** — DashboardPage + MetricCard redesign.
6. **Students** — StudentsPage tablo (grid `.strow` yerine UI Table component),
   RegistrationFormPage (Steps akışı), modallar, drawer.
7. **global.css temizliği** — taşınan özel sınıfları kaldır; token/base/keyframe koru.
8. **Doğrulama** — `npm run build` + `npm run lint` (varsa) yeşil; dark/light tema ve
   responsive elle kontrol.

## Kurallar

- Her mantıklı adım ayrı commit; conventional commit mesajı; **Claude atfı ekleme** (Co-Authored-By yok).
- Design token sistemini ve runtime tema değişimini bozma.
- Inline style ve özel CSS sınıflarını Tailwind utility'lerine taşı; tekrar eden desenleri
  UI component'lere çıkar.
- Mevcut Redux/router/veri akışını değiştirme.
