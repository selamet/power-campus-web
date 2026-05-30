import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Field, Icon, Input, Logo, Mark, PasswordInput, Toggle } from '@/components/ui';
import { selectAuthError, selectAuthStatus, login } from '@/features/auth/authSlice';
import { selectTheme, toggleTheme } from '@/features/ui/uiSlice';
import { paths } from '@/routes/paths';

const STATS: Array<[string, string]> = [
  ['1.2K+', 'Öğrenci'],
  ['7', 'Dil'],
  ['4', 'Şube'],
];

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector(selectTheme);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const [email, setEmail] = useState('elif.demir@powerakademi.com');
  const [password, setPassword] = useState('demo1234');
  const [remember, setRemember] = useState(true);
  const loading = status === 'loading';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate(paths.overview, { replace: true });
    }
  };

  return (
    <div className="relative grid min-h-screen grid-cols-1 min-[900px]:grid-cols-[1.05fr_1fr]">
      <button
        onClick={() => dispatch(toggleTheme())}
        className="fixed top-5 right-5 z-[5] flex size-[42px] items-center justify-center rounded-xl border border-line bg-surface text-ink-2 shadow-card"
        aria-label="Tema"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
      </button>

      {/* Brand panel */}
      <div
        className="grain relative hidden flex-col justify-between overflow-hidden px-[52px] py-14 text-white min-[900px]:flex"
        style={{
          background:
            'linear-gradient(155deg, hsl(240 9% 12%), hsl(240 10% 8%) 60%, hsl(240 11% 6%))',
        }}
      >
        <div
          className="absolute -top-[180px] -right-[160px] size-[520px] rounded-full"
          style={{ border: '60px solid hsl(0 0% 100% / .06)' }}
        />
        <div className="absolute -bottom-[90px] -left-[70px] size-[280px] rounded-full bg-[hsl(0_0%_100%/0.05)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,hsl(var(--accent-h)_72%_52%/0.16),transparent_48%)]" />

        <div className="anim-fade-up relative flex items-center gap-3">
          <div className="flex rounded-[14px] bg-white px-3 py-2.5 shadow-[0_8px_24px_hsl(240_40%_4%/0.5)]">
            <Mark size={30} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-[-0.01em]">Power Akademi</span>
            <span className="font-mono text-[11px] tracking-[0.08em] opacity-80">
              OKUL YÖNETİM SİSTEMİ
            </span>
          </div>
        </div>

        <div className="anim-fade-up relative">
          <div className="mb-[18px] font-mono text-xs tracking-[0.14em] opacity-85">
            POWER LANGUAGE SCHOOLS
          </div>
          <h1 className="m-0 text-[clamp(30px,4vw,44px)] leading-[1.08] font-bold tracking-[-0.02em] text-balance">
            Tek panelden
            <br />
            tüm okulunu
            <br />
            yönet.
          </h1>
          <p className="mt-[18px] max-w-[380px] text-base leading-[1.5] opacity-90">
            Öğrenci kayıtları, onaylar ve finans tek yerde. Yakında yoklama, sınıflar ve ders
            programı da burada.
          </p>
        </div>

        <div className="anim-fade-up relative flex flex-wrap items-center gap-4">
          {STATS.map(([value, label]) => (
            <div className="flex flex-col gap-0.5" key={label}>
              <span className="font-mono text-[26px] font-bold">{value}</span>
              <span className="text-[13px] opacity-80">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-bg px-7 py-12">
        <form onSubmit={submit} className="anim-fade-up w-full max-w-[380px]">
          <div className="mb-[30px] block min-[900px]:hidden">
            <Logo height={34} />
          </div>

          <h2 className="mb-1.5 text-[28px] font-bold tracking-[-0.02em]">Tekrar hoş geldin 👋</h2>
          <p className="mb-[30px] text-[15px] text-ink-2">Devam etmek için hesabına giriş yap.</p>

          <div className="flex flex-col gap-4">
            <Field label="E-posta adresi" icon="mail">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@powerakademi.com"
                autoComplete="username"
              />
            </Field>
            <Field label="Şifre" icon="lock">
              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink-2">
                <Toggle checked={remember} onChange={setRemember} />
                Beni hatırla
              </label>
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="text-[13.5px] font-semibold text-accent no-underline"
              >
                Şifremi unuttum
              </a>
            </div>

            {error && <p className="m-0 text-[13px] text-accent">{error}</p>}

            <Button type="submit" variant="primary" size="lg" block disabled={loading} className="mt-1">
              {loading ? (
                <>
                  <span className="spinner" />
                  Giriş yapılıyor…
                </>
              ) : (
                <>
                  Giriş yap
                  <Icon name="arrowR" size={18} />
                </>
              )}
            </Button>
          </div>

          <div className="my-[26px] flex items-center gap-3">
            <div className="divider flex-1" />
            <span className="font-mono text-[11px] text-ink-3">VEYA</span>
            <div className="divider flex-1" />
          </div>

          <Button
            variant="ghost"
            block
            className="py-3"
            onClick={() => dispatch(login({ email, password })).then(() => navigate(paths.overview))}
          >
            <Icon name="id" size={18} />
            Öğrenci girişi (TCKN ile)
          </Button>

          <p className="mt-7 text-center text-[12.5px] leading-[1.5] text-ink-3">
            Sistem rolünü otomatik tanır ·{' '}
            <span className="font-mono">Öğrenci · Öğretmen · Personel · Admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}
