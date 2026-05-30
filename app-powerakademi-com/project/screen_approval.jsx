/* screen_approval.jsx — Student detail / approval slide-over */
const { useState: useStateAp, useEffect: useEffectAp } = React;

function InfoRow({ label, value, mono }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--line)', gap: 16 }}>
      <span style={{ fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>{label}</span>
      <span className={mono ? 'mono tnum' : ''} style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

function InfoBlock({ icon, title, children }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="row gap-2" style={{ marginBottom: 6 }}>
        <Icon name={icon} size={17} style={{ color: 'var(--accent)' }} />
        <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function StudentDrawer({ student, onClose, onApprove, onReject }) {
  const [closing, setClosing] = useStateAp(false);
  const [rejecting, setRejecting] = useStateAp(false);
  const s = student;

  const close = () => { setClosing(true); setTimeout(onClose, 250); };
  useEffectAp(() => {
    const h = e => e.key === 'Escape' && close();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (!s) return null;
  const st = STATUS[s.status];
  const pct = Math.round((s.paid / s.fee) * 100);
  const isPending = s.status === 'pending';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120 }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'hsl(20 30% 8% / .5)', backdropFilter: 'blur(3px)', animation: closing ? 'fadeIn .25s reverse' : 'fadeIn .25s ease' }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '100%',
        background: 'var(--bg)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
        animation: closing ? 'slideInRight .25s reverse forwards' : 'slideInRight .3s cubic-bezier(.2,.8,.3,1)',
      }}>
        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="kicker">ÖĞRENCİ KAYDI · {s.id}</span>
            <button className="btn btn-quiet" onClick={close} style={{ padding: 8 }}><Icon name="x" size={20} /></button>
          </div>
          <div className="row gap-3">
            <Avatar name={s.name} size={56} />
            <div className="col grow" style={{ gap: 5 }}>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-.01em' }}>{s.name}</h2>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                <Badge kind={st.kind} dot>{st.label}</Badge>
                {s.source === 'davet' && <Badge kind="accent"><Icon name="link" size={11} />Davet ile</Badge>}
                {s.source === 'manuel' && <Badge kind="neutral"><Icon name="edit" size={11} />Manuel</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="col gap-4">
          {isPending && (
            <div className="row gap-3 anim-fade-in" style={{ padding: 14, borderRadius: 12, background: 'var(--warn-soft)', border: '1px solid hsl(38 60% 80% / .5)' }}>
              <Icon name="info" size={20} style={{ color: 'hsl(38 80% 42%)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>Bu öğrenci hoşgeldin formunu doldurdu. Bilgileri kontrol edip <strong>onaylayın</strong> ya da düzeltme için geri gönderin.</span>
            </div>
          )}

          <InfoBlock icon="user" title="Kişisel & İletişim">
            <InfoRow label="E-posta" value={s.email} />
            <InfoRow label="Telefon" value={s.phone} mono />
            <InfoRow label="Kayıt Tarihi" value={fmtDate(s.joined)} />
          </InfoBlock>

          <InfoBlock icon="graduation" title="Eğitim">
            <InfoRow label="Dil" value={s.lang} />
            <InfoRow label="Seviye" value={s.level} />
            <InfoRow label="Kur / Program" value={s.course} />
            <InfoRow label="Başlangıç" value={fmtDate(s.start)} />
          </InfoBlock>

          <InfoBlock icon="wallet" title="Finans">
            <InfoRow label="Kayıt Ücreti" value={fmtMoney(s.fee)} mono />
            <InfoRow label="Ödeme Planı" value={s.plan} />
            <InfoRow label="Ödenen" value={fmtMoney(s.paid)} mono />
            {s.next && <InfoRow label="Sonraki Ödeme" value={fmtDate(s.next)} />}
            <div className="col gap-2" style={{ paddingTop: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Tahsilat durumu</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? 'var(--ok)' : 'var(--accent)' }}>%{pct}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', borderRadius: 4, background: pct === 100 ? 'var(--ok)' : 'var(--accent)', transition: 'width .6s' }} />
              </div>
            </div>
          </InfoBlock>
        </div>

        {/* footer actions */}
        {isPending && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
            {!rejecting ? (
              <div className="row gap-3">
                <button className="btn btn-ghost grow" onClick={() => setRejecting(true)}><Icon name="x" size={17} />Reddet</button>
                <button className="btn btn-primary grow" onClick={() => { onApprove(s.id); close(); }}><Icon name="check" size={18} />Onayla</button>
              </div>
            ) : (
              <div className="col gap-3 anim-fade-in">
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Kaydı reddetmek istediğine emin misin?</span>
                <div className="row gap-3">
                  <button className="btn btn-ghost grow" onClick={() => setRejecting(false)}>Vazgeç</button>
                  <button className="btn grow" onClick={() => { onReject(s.id); close(); }} style={{ background: 'var(--accent)', color: '#fff' }}><Icon name="xCircle" size={17} />Evet, reddet</button>
                </div>
              </div>
            )}
          </div>
        )}
        {!isPending && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
            <div className="row gap-3">
              <button className="btn btn-ghost grow"><Icon name="edit" size={17} />Düzenle</button>
              <button className="btn btn-soft grow"><Icon name="wallet" size={17} />Ödeme Al</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.StudentDrawer = StudentDrawer;
