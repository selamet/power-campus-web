/* screen_add.jsx — Add student choice + invite-link flow */
const { useState: useStateA } = React;

function AddChoiceModal({ open, onClose, onManual, onInvite }) {
  return (
    <Modal open={open} onClose={onClose} width={580}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="col">
          <span className="kicker">YENİ KAYIT</span>
          <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Öğrenciyi nasıl eklemek istersin?</h2>
        </div>
        <button className="btn btn-quiet" onClick={onClose} style={{ padding: 8 }}><Icon name="x" size={20} /></button>
      </div>
      <p style={{ color: 'var(--ink-2)', margin: '6px 0 22px', fontSize: 14.5 }}>İki yöntemden birini seç. Davet linkinde öğrenci bilgilerini kendi telefonundan doldurur.</p>

      <div className="add-choice" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ChoiceCard icon="edit" title="Manuel Kayıt" desc="Tüm bilgileri sen doldur. Kişisel, eğitim, iletişim ve finans." badge="Tam form" onClick={onManual} />
        <ChoiceCard icon="send" title="Davet Linki Gönder" desc="TCKN + telefon gir, kişiye özel link oluştur. Öğrenci doldursun." badge="Önerilen" accent onClick={onInvite} />
      </div>
    </Modal>
  );
}

function ChoiceCard({ icon, title, desc, badge, accent, onClick }) {
  return (
    <button onClick={onClick} className="choice-card" style={{
      textAlign: 'left', cursor: 'pointer', padding: 20, borderRadius: 16, background: 'var(--surface)',
      border: `1.5px solid ${accent ? 'var(--accent)' : 'var(--line-strong)'}`,
      display: 'flex', flexDirection: 'column', gap: 12, transition: 'all .2s', fontFamily: 'inherit',
      boxShadow: accent ? 'var(--shadow-accent)' : 'none',
    }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: accent ? 'var(--accent)' : 'var(--bg-2)', color: accent ? '#fff' : 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} />
        </div>
        <span className="badge" style={{ background: accent ? 'var(--accent-soft)' : 'var(--bg-2)', color: accent ? 'var(--accent-strong)' : 'var(--ink-3)' }}>{badge}</span>
      </div>
      <div className="col" style={{ gap: 5 }}>
        <span style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--ink)' }}>{title}</span>
        <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>{desc}</span>
      </div>
      <span className="row gap-2" style={{ marginTop: 'auto', color: accent ? 'var(--accent)' : 'var(--ink-2)', fontSize: 13.5, fontWeight: 600 }}>
        Devam et <Icon name="arrowR" size={16} />
      </span>
    </button>
  );
}

/* ---------------- Invite flow ---------------- */
function InviteFlow({ open, onClose, onPreview }) {
  const [step, setStep] = useStateA(0); // 0 form, 1 success
  const [tckn, setTckn] = useStateA('');
  const [phone, setPhone] = useStateA('');
  const [name, setName] = useStateA('');
  const [lang, setLang] = useStateA('İngilizce');
  const [course, setCourse] = useStateA('Hafta İçi Akşam');
  const [copied, setCopied] = useStateA(false);
  const toast = useToast();

  const token = tckn ? tckn.slice(0, 4) + 'X' + (tckn.slice(-3) || '728') : '54091X728';
  const link = `app.powerakademi.com/hosgeldin/${token}`;
  const valid = tckn.length === 11 && phone.replace(/\D/g, '').length >= 10;

  const reset = () => { setStep(0); setTckn(''); setPhone(''); setName(''); setCopied(false); };
  const close = () => { reset(); onClose(); };

  const copy = () => {
    navigator.clipboard?.writeText('https://' + link).catch(() => {});
    setCopied(true); toast('Link kopyalandı', 'copy');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={close} width={540}>
      {step === 0 && (
        <div className="anim-fade-in">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <div className="col">
              <span className="kicker">DAVET LİNKİ</span>
              <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Kişiye özel form oluştur</h2>
            </div>
            <button className="btn btn-quiet" onClick={close} style={{ padding: 8 }}><Icon name="x" size={20} /></button>
          </div>
          <p style={{ color: 'var(--ink-2)', margin: '6px 0 22px', fontSize: 14.5 }}>TCKN ve telefon ile öğrenciye özel bir hoşgeldin formu üretilir. Ön seçtiğin dil ve kur forma hazır gelir.</p>

          <div className="col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="invite-grid">
              <Field label="T.C. Kimlik No" icon="id" required>
                <Input value={tckn} onChange={e => setTckn(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="11 haneli" inputMode="numeric" className="input mono" />
              </Field>
              <Field label="Telefon" icon="phone" required>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0 (5__) ___ __ __" inputMode="tel" />
              </Field>
            </div>
            <Field label="Ad Soyad" icon="user" hint="Opsiyonel — bilinmiyorsa öğrenci formda girer">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Örn. Aylin Şahin" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="invite-grid">
              <Field label="Ön seçim — Dil" icon="globe">
                <Select value={lang} onChange={e => setLang(e.target.value)}>{LANGUAGES.map(l => <option key={l}>{l}</option>)}</Select>
              </Field>
              <Field label="Ön seçim — Kur" icon="book">
                <Select value={course} onChange={e => setCourse(e.target.value)}>{COURSES.map(c => <option key={c}>{c}</option>)}</Select>
              </Field>
            </div>
          </div>

          <div className="row gap-3" style={{ marginTop: 26 }}>
            <button className="btn btn-ghost grow" onClick={close}>Vazgeç</button>
            <button className="btn btn-primary grow" disabled={!valid} onClick={() => setStep(1)}>
              <Icon name="sparkle" size={17} />Link Oluştur
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="anim-scale-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--ok-soft)', color: 'var(--ok)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 16px' }}>
            <Icon name="checkCircle" size={34} />
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Davet linki hazır!</h2>
          <p style={{ color: 'var(--ink-2)', margin: '8px 0 22px', fontSize: 14.5 }}>{name || 'Öğrenci'} için kişiye özel link oluşturuldu. Aşağıdan paylaş.</p>

          <div className="row gap-2" style={{ background: 'var(--bg-2)', border: '1px dashed var(--line-strong)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
            <Icon name="link" size={17} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span className="mono grow" style={{ fontSize: 13, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
            <button className="btn btn-soft" onClick={copy} style={{ padding: '8px 12px', fontSize: 13 }}>
              <Icon name={copied ? 'check' : 'copy'} size={15} />{copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>

          <div className="row gap-3" style={{ marginBottom: 12 }}>
            <button className="btn grow" onClick={() => toast('WhatsApp ile gönderildi', 'whatsapp')} style={{ background: '#25D366', color: '#fff' }}><Icon name="whatsapp" size={18} />WhatsApp</button>
            <button className="btn btn-ghost grow" onClick={() => toast('SMS gönderildi', 'sms')}><Icon name="sms" size={17} />SMS Gönder</button>
          </div>

          <button className="btn btn-quiet btn-block" onClick={() => { onPreview(); }} style={{ color: 'var(--accent)' }}>
            <Icon name="eye" size={17} />Öğrenci ne görecek? Önizle
          </button>

          <div className="divider" style={{ margin: '18px 0' }} />
          <button className="btn btn-ghost btn-block" onClick={close}>Kapat</button>
        </div>
      )}
    </Modal>
  );
}

Object.assign(window, { AddChoiceModal, InviteFlow });
