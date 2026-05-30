/* screen_form.jsx — Manual multi-section registration form */
const { useState: useStateF } = React;

const FORM_STEPS = ['Kişisel', 'Eğitim', 'İletişim', 'Finans'];

function RegistrationForm({ onClose, onSave }) {
  const [step, setStep] = useStateF(0);
  const [f, setF] = useStateF({
    name: '', tckn: '', birth: '', gender: '', city: 'İstanbul', addr: '',
    email: '', phone: '',
    lang: 'İngilizce', level: LEVELS[0], goal: GOALS[0], course: COURSES[0], start: '',
    cName: '', cRelation: 'Anne', cPhone: '',
    fee: '', plan: 'Peşin', payMethod: PAY_METHODS[0], firstDate: '', discount: '0',
  });
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  const toast = useToast();

  const next = () => setStep(s => Math.min(s + 1, FORM_STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const isLast = step === FORM_STEPS.length - 1;

  const save = () => {
    onSave({
      id: 'PA-' + (1060 + Math.floor(Math.random() * 39)),
      name: f.name || 'Yeni Öğrenci', lang: f.lang, level: f.level, course: f.course,
      status: 'active', phone: f.phone || '0500 000 00 00', start: f.start || '2026-06-15',
      fee: +f.fee || 18500, paid: f.plan === 'Peşin' ? (+f.fee || 18500) : 0, plan: f.plan,
      next: f.plan === 'Peşin' ? null : f.firstDate || '2026-07-01', joined: '2026-05-30',
      email: f.email || 'ogrenci@gmail.com', source: 'manuel',
    });
    toast('Öğrenci kaydı oluşturuldu', 'checkCircle');
    onClose();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'hsl(30 24% 97% / .85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)', padding: '14px 24px' }} className="row">
        <button className="btn btn-quiet" onClick={onClose}><Icon name="arrowL" size={18} />Dashboard</button>
        <div className="grow" />
        <Logo height={26} />
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
        <div className="col" style={{ gap: 6, marginBottom: 26, textAlign: 'center' }}>
          <span className="kicker">MANUEL KAYIT</span>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 700, letterSpacing: '-.02em' }}>Yeni Öğrenci Kaydı</h1>
        </div>

        <div style={{ marginBottom: 30 }}><Steps steps={FORM_STEPS} current={step} /></div>

        <div className="card" style={{ padding: 28 }}>
          {step === 0 && <SectionPersonal f={f} set={set} setF={setF} key="p" />}
          {step === 1 && <SectionEducation f={f} set={set} key="e" />}
          {step === 2 && <SectionContact f={f} set={set} key="c" />}
          {step === 3 && <SectionFinance f={f} set={set} setF={setF} key="f" />}
        </div>

        <div className="row gap-3" style={{ marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={step === 0 ? onClose : back}>
            <Icon name="arrowL" size={17} />{step === 0 ? 'Vazgeç' : 'Geri'}
          </button>
          <div className="grow" />
          <span className="mono" style={{ alignSelf: 'center', fontSize: 12, color: 'var(--ink-3)' }}>{step + 1} / {FORM_STEPS.length}</span>
          {!isLast
            ? <button className="btn btn-primary" onClick={next}>Devam et<Icon name="arrowR" size={17} /></button>
            : <button className="btn btn-primary" onClick={save}><Icon name="check" size={18} />Kaydı Tamamla</button>}
        </div>
      </div>
    </div>
  );
}

function SecHead({ icon, title, desc }) {
  return (
    <div className="row gap-3 anim-fade-in" style={{ marginBottom: 22 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={22} />
      </div>
      <div className="col" style={{ gap: 2 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-.01em' }}>{title}</h3>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{desc}</span>
      </div>
    </div>
  );
}

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

function SectionPersonal({ f, set, setF }) {
  return (
    <div className="anim-fade-in">
      <SecHead icon="user" title="Kişisel Bilgiler" desc="Öğrencinin kimlik ve temel bilgileri" />
      <div className="form-grid" style={grid2}>
        <Field label="Ad Soyad" required full><Input value={f.name} onChange={set('name')} placeholder="Ad Soyad" /></Field>
        <Field label="T.C. Kimlik No" required><Input value={f.tckn} onChange={e => setF(p => ({ ...p, tckn: e.target.value.replace(/\D/g, '').slice(0, 11) }))} placeholder="11 haneli" className="input mono" inputMode="numeric" /></Field>
        <Field label="Doğum Tarihi"><Input type="date" value={f.birth} onChange={set('birth')} /></Field>
        <Field label="Cinsiyet">
          <Select value={f.gender} onChange={set('gender')}><option value="">Seçiniz</option><option>Kadın</option><option>Erkek</option><option>Belirtmek istemiyor</option></Select>
        </Field>
        <Field label="Şehir"><Select value={f.city} onChange={set('city')}>{CITIES.map(c => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Adres" full><textarea className="input" rows={2} value={f.addr} onChange={set('addr')} placeholder="Açık adres" /></Field>
      </div>
    </div>
  );
}

function SectionEducation({ f, set }) {
  return (
    <div className="anim-fade-in">
      <SecHead icon="graduation" title="Eğitim Bilgileri" desc="Hangi dil, hangi seviye ve hedef" />
      <div className="form-grid" style={grid2}>
        <Field label="Dil" icon="globe" required><Select value={f.lang} onChange={set('lang')}>{LANGUAGES.map(l => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Seviye" icon="trend" required><Select value={f.level} onChange={set('level')}>{LEVELS.map(l => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Hedef" icon="target"><Select value={f.goal} onChange={set('goal')}>{GOALS.map(g => <option key={g}>{g}</option>)}</Select></Field>
        <Field label="Kur / Program" icon="book" required><Select value={f.course} onChange={set('course')}>{COURSES.map(c => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Başlangıç Tarihi" icon="calendar" full><Input type="date" value={f.start} onChange={set('start')} /></Field>
      </div>
    </div>
  );
}

function SectionContact({ f, set }) {
  return (
    <div className="anim-fade-in">
      <SecHead icon="phone" title="İletişim & Acil Durum Kişisi" desc="Öğrenci ve birincil iletişim kişisi" />
      <div className="form-grid" style={grid2}>
        <Field label="E-posta" icon="mail" required><Input type="email" value={f.email} onChange={set('email')} placeholder="ornek@mail.com" /></Field>
        <Field label="Cep Telefonu" icon="phone" required><Input value={f.phone} onChange={set('phone')} placeholder="0 (5__) ___ __ __" inputMode="tel" /></Field>
      </div>
      <div className="divider" style={{ margin: '22px 0 20px' }} />
      <span className="kicker" style={{ display: 'block', marginBottom: 14 }}>BİRİNCİL İLETİŞİM KİŞİSİ</span>
      <div className="form-grid" style={grid2}>
        <Field label="Ad Soyad"><Input value={f.cName} onChange={set('cName')} placeholder="Veli / yakını" /></Field>
        <Field label="Yakınlık"><Select value={f.cRelation} onChange={set('cRelation')}>{RELATIONS.map(r => <option key={r}>{r}</option>)}</Select></Field>
        <Field label="Telefon" icon="phone" full><Input value={f.cPhone} onChange={set('cPhone')} placeholder="0 (5__) ___ __ __" inputMode="tel" /></Field>
      </div>
    </div>
  );
}

function SectionFinance({ f, set, setF }) {
  const fee = +f.fee || 0;
  const disc = +f.discount || 0;
  const net = Math.max(0, fee - fee * disc / 100);
  const plans = ['Peşin', '2 Taksit', '3 Taksit', '4 Taksit', '6 Taksit'];
  return (
    <div className="anim-fade-in">
      <SecHead icon="wallet" title="Finans & Ödeme Planı" desc="Kayıt ücreti, indirim, taksit ve ödeme yöntemi" />
      <div className="form-grid" style={grid2}>
        <Field label="Kayıt Ücreti (₺)" required><Input value={f.fee} onChange={e => setF(p => ({ ...p, fee: e.target.value.replace(/\D/g, '') }))} placeholder="18500" className="input mono" inputMode="numeric" /></Field>
        <Field label="İndirim (%)" hint="Erken kayıt, kardeş vb."><Input value={f.discount} onChange={e => setF(p => ({ ...p, discount: e.target.value.replace(/\D/g, '').slice(0, 3) }))} className="input mono" inputMode="numeric" /></Field>
        <Field label="Ödeme Planı"><Select value={f.plan} onChange={set('plan')}>{plans.map(p => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Ödeme Yöntemi"><Select value={f.payMethod} onChange={set('payMethod')}>{PAY_METHODS.map(m => <option key={m}>{m}</option>)}</Select></Field>
        <Field label="İlk Ödeme Tarihi" icon="calendar" full><Input type="date" value={f.firstDate} onChange={set('firstDate')} /></Field>
      </div>

      {/* summary */}
      <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>Kayıt Ücreti</span>
          <span className="mono tnum" style={{ fontSize: 14 }}>{fmtMoney(fee)}</span>
        </div>
        {disc > 0 && (
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>İndirim (%{disc})</span>
            <span className="mono tnum" style={{ fontSize: 14, color: 'var(--ok)' }}>−{fmtMoney(Math.round(fee * disc / 100))}</span>
          </div>
        )}
        <div className="divider" style={{ margin: '10px 0', background: 'var(--accent-soft-border)' }} />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-strong)' }}>Net Tutar</span>
          <span className="mono tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-strong)' }}>{fmtMoney(Math.round(net))}</span>
        </div>
        {f.plan !== 'Peşin' && net > 0 && (
          <p className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '8px 0 0', textAlign: 'right' }}>
            {f.plan} · ayda {fmtMoney(Math.round(net / parseInt(f.plan)))}
          </p>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { RegistrationForm });
