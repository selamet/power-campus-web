/* screen_welcome.jsx — Student mobile welcome form (from invite link) */
const { useState: useStateW } = React;

function PhoneFrame({ children, onClose }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', overflow: 'auto' }}>
      <div className="row" style={{ width: '100%', maxWidth: 760, marginBottom: 20, justifyContent: 'space-between' }}>
        <button className="btn btn-quiet" onClick={onClose}><Icon name="arrowL" size={18} />Geri dön</button>
        <span className="badge badge-accent"><Icon name="phone" size={12} />Öğrenci mobil görünümü</span>
      </div>

      <div className="phone-shell" style={{
        width: 390, maxWidth: '100%', background: '#0a0a0a', borderRadius: 46, padding: 12,
        boxShadow: 'var(--shadow-lg)', flexShrink: 0,
      }}>
        <div style={{ background: 'var(--surface)', borderRadius: 36, overflow: 'hidden', position: 'relative', height: 800, maxHeight: '78vh', display: 'flex', flexDirection: 'column' }}>
          {/* notch */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 130, height: 28, background: '#0a0a0a', borderRadius: '0 0 18px 18px', zIndex: 10 }} />
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function WelcomeMobile({ onClose, onSubmit }) {
  const [step, setStep] = useStateW(0);
  const [done, setDone] = useStateW(false);
  const [w, setW] = useStateW({
    name: 'Aylin Şahin', tckn: '54091••728', birth: '', email: '', phone: '0505 762 33 18',
    addr: '', goal: GOALS[0], cName: '', cRelation: 'Anne', cPhone: '',
    consent: false,
  });
  const set = (k) => (e) => setW(p => ({ ...p, [k]: e.target.value }));
  const toast = useToast();

  const sections = ['Bilgilerim', 'Tercihlerim', 'İletişim'];
  const submit = () => { setDone(true); if (onSubmit) onSubmit(); };

  if (done) {
    return (
      <PhoneFrame onClose={onClose}>
        <div className="anim-scale-in" style={{ padding: '60px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, height: '100%', justifyContent: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: 26, background: 'var(--ok-soft)', color: 'var(--ok)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 4.5 4.5L19 7" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawCheck .6s .2s ease forwards' }} />
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Teşekkürler! 🎉</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.5, margin: 0 }}>Bilgilerin başarıyla alındı. Power Akademi ekibi kaydını <strong>onayladığında</strong> sana SMS ile bilgi vereceğiz.</p>
          <div className="badge badge-warn" style={{ marginTop: 4 }}><Icon name="clock" size={12} />Onay bekleniyor</div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame onClose={onClose}>
      {/* red header */}
      <div style={{ background: 'linear-gradient(140deg, hsl(4 76% 47%), hsl(8 72% 55%))', color: '#fff', padding: '46px 22px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '34px solid hsl(0 0% 100% / .08)', top: -90, right: -50 }} />
        <div style={{ background: '#fff', width: 'fit-content', borderRadius: 12, padding: '8px 10px', marginBottom: 16 }}><Mark size={24} /></div>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-.01em' }}>Hoş geldin, {w.name.split(' ')[0]}! 👋</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, opacity: .92, lineHeight: 1.45 }}>Power Akademi ailesine katılmana çok az kaldı. Birkaç bilgini doğrula, gerisini biz hallederiz.</p>
        {/* mini steps */}
        <div className="row gap-2" style={{ marginTop: 18 }}>
          {sections.map((s, i) => (
            <div key={s} className="grow col" style={{ gap: 6 }}>
              <div style={{ height: 4, borderRadius: 3, background: i <= step ? '#fff' : 'hsl(0 0% 100% / .3)', transition: 'background .3s' }} />
              <span className="mono" style={{ fontSize: 9.5, opacity: i === step ? 1 : .7, letterSpacing: '.04em' }}>{s.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 22 }}>
        {step === 0 && (
          <div className="col gap-4 anim-fade-in">
            <Field label="Ad Soyad" required><Input value={w.name} onChange={set('name')} /></Field>
            <Field label="T.C. Kimlik No"><Input value={w.tckn} disabled className="input mono" /></Field>
            <Field label="Doğum Tarihi" required><Input type="date" value={w.birth} onChange={set('birth')} /></Field>
            <Field label="E-posta" icon="mail" required><Input type="email" value={w.email} onChange={set('email')} placeholder="ornek@mail.com" /></Field>
            <Field label="Telefon" icon="phone"><Input value={w.phone} onChange={set('phone')} /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="col gap-4 anim-fade-in">
            <div className="card" style={{ padding: 14, background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)' }}>
              <span className="kicker" style={{ color: 'var(--accent-strong)' }}>OKULUN SENİN İÇİN SEÇTİĞİ</span>
              <div className="row gap-3" style={{ marginTop: 10 }}>
                <div className="row gap-2"><Icon name="globe" size={16} style={{ color: 'var(--accent)' }} /><span style={{ fontSize: 14, fontWeight: 600 }}>İngilizce</span></div>
                <div className="row gap-2"><Icon name="book" size={16} style={{ color: 'var(--accent)' }} /><span style={{ fontSize: 14, fontWeight: 600 }}>Online Canlı</span></div>
              </div>
            </div>
            <Field label="Hedefin" icon="target" required><Select value={w.goal} onChange={set('goal')}>{GOALS.map(g => <option key={g}>{g}</option>)}</Select></Field>
            <Field label="Adres" icon="pin"><textarea className="input" rows={3} value={w.addr} onChange={set('addr')} placeholder="Açık adresin" /></Field>
          </div>
        )}
        {step === 2 && (
          <div className="col gap-4 anim-fade-in">
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0 }}>Acil durumda ulaşabileceğimiz bir yakının.</p>
            <Field label="Ad Soyad" required><Input value={w.cName} onChange={set('cName')} placeholder="Yakınının adı" /></Field>
            <Field label="Yakınlık"><Select value={w.cRelation} onChange={set('cRelation')}>{RELATIONS.map(r => <option key={r}>{r}</option>)}</Select></Field>
            <Field label="Telefon" icon="phone" required><Input value={w.cPhone} onChange={set('cPhone')} placeholder="0 (5__) ___ __ __" inputMode="tel" /></Field>
            <label className="row gap-3" style={{ cursor: 'pointer', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line-strong)', background: 'var(--surface-2)' }}>
              <input type="checkbox" checked={w.consent} onChange={e => setW(p => ({ ...p, consent: e.target.checked }))} style={{ width: 20, height: 20, accentColor: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>KVKK aydınlatma metnini okudum, kişisel verilerimin işlenmesini onaylıyorum.</span>
            </label>
          </div>
        )}
      </div>

      {/* sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, padding: '14px 22px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
        <div className="row gap-3">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} style={{ padding: '13px 16px' }}><Icon name="arrowL" size={17} /></button>}
          {step < 2
            ? <button className="btn btn-primary grow btn-lg" onClick={() => setStep(s => s + 1)}>Devam et<Icon name="arrowR" size={18} /></button>
            : <button className="btn btn-primary grow btn-lg" disabled={!w.consent} onClick={submit}><Icon name="send" size={17} />Gönder</button>}
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, { WelcomeMobile, PhoneFrame });
