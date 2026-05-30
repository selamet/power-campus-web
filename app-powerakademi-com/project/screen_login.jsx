/* screen_login.jsx */
const { useState: useStateL } = React;

function LoginScreen({ onLogin, theme, setTheme }) {
  const [email, setEmail] = useStateL('elif.demir@powerakademi.com');
  const [pw, setPw] = useStateL('••••••••');
  const [loading, setLoading] = useStateL(false);
  const [remember, setRemember] = useStateL(true);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => onLogin(), 950);
  };

  return (
    <div style={{ minHeight: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', position: 'relative' }} className="login-grid">
      {/* theme toggle */}
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 5, width: 42, height: 42, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
      </button>

      {/* Brand panel */}
      <div className="login-brand" style={{
        background: 'linear-gradient(150deg, hsl(4 78% 44%), hsl(4 74% 52%) 55%, hsl(8 72% 56%))',
        color: '#fff', padding: '56px 52px', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        {/* decorative shapes */}
        <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', border: '60px solid hsl(0 0% 100% / .06)', top: -180, right: -160 }} />
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'hsl(0 0% 100% / .05)', bottom: -90, left: -70 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, hsl(0 0% 100% / .12), transparent 45%)' }} />

        <div className="row gap-3 anim-fade-up" style={{ position: 'relative' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '10px 12px', display: 'flex', boxShadow: '0 8px 24px hsl(4 60% 20% / .3)' }}>
            <Mark size={30} />
          </div>
          <div className="col">
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.01em' }}>Power Akademi</span>
            <span className="mono" style={{ fontSize: 11, opacity: .8, letterSpacing: '.08em' }}>OKUL YÖNETİM SİSTEMİ</span>
          </div>
        </div>

        <div style={{ position: 'relative' }} className="anim-fade-up" >
          <div className="mono" style={{ fontSize: 12, letterSpacing: '.14em', opacity: .85, marginBottom: 18 }}>POWER LANGUAGE SCHOOLS</div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1.08, margin: 0, fontWeight: 700, letterSpacing: '-.02em', textWrap: 'balance' }}>
            Tek panelden<br />tüm okulunu<br />yönet.
          </h1>
          <p style={{ fontSize: 16, opacity: .9, marginTop: 18, maxWidth: 380, lineHeight: 1.5 }}>
            Öğrenci kayıtları, onaylar ve finans tek yerde. Yakında yoklama, sınıflar ve ders programı da burada.
          </p>
        </div>

        <div className="row gap-4 anim-fade-up" style={{ position: 'relative', flexWrap: 'wrap' }}>
          {[['1.2K+', 'Öğrenci'], ['7', 'Dil'], ['4', 'Şube']].map(([n, l]) => (
            <div className="col" key={l} style={{ gap: 2 }}>
              <span className="mono" style={{ fontSize: 26, fontWeight: 700 }}>{n}</span>
              <span style={{ fontSize: 13, opacity: .8 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="login-form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 28px', background: 'var(--bg)' }}>
        <form onSubmit={submit} className="anim-fade-up" style={{ width: '100%', maxWidth: 380 }}>
          <div className="login-form-logo" style={{ marginBottom: 30 }}><Logo height={34} /></div>

          <h2 style={{ fontSize: 28, margin: '0 0 6px', letterSpacing: '-.02em', fontWeight: 700 }}>Tekrar hoş geldin 👋</h2>
          <p style={{ color: 'var(--ink-2)', margin: '0 0 30px', fontSize: 15 }}>Devam etmek için hesabına giriş yap.</p>

          <div className="col gap-4">
            <Field label="E-posta adresi" icon="mail">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@powerakademi.com" autoComplete="username" />
            </Field>
            <Field label="Şifre" icon="lock">
              <PasswordInput value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </Field>

            <div className="row" style={{ justifyContent: 'space-between' }}>
              <label className="row gap-2" style={{ cursor: 'pointer', fontSize: 13.5, color: 'var(--ink-2)' }}>
                <span onClick={() => setRemember(r => !r)} style={{ display: 'flex' }}><Toggle checked={remember} onChange={setRemember} /></span>
                Beni hatırla
              </label>
              <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 13.5, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Şifremi unuttum</a>
            </div>

            <button className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" />Giriş yapılıyor…</> : <>Giriş yap<Icon name="arrowR" size={18} /></>}
            </button>
          </div>

          <div className="row gap-3" style={{ margin: '26px 0' }}>
            <div className="divider grow" />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>VEYA</span>
            <div className="divider grow" />
          </div>

          <button type="button" onClick={() => onLogin()} className="btn btn-ghost btn-block" style={{ padding: '12px' }}>
            <Icon name="id" size={18} />Öğrenci girişi (TCKN ile)
          </button>

          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 28, lineHeight: 1.5 }}>
            Sistem rolünü otomatik tanır · <span className="mono">Öğrenci · Öğretmen · Personel · Admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
