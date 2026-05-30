/* screen_dashboard.jsx — Overview + Students list */
const { useMemo: useMemoD } = React;

function MetricCard({ icon, label, value, delta, deltaKind = 'ok', accent }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accent ? 'var(--accent-soft)' : 'var(--bg-2)', color: accent ? 'var(--accent)' : 'var(--ink-2)' }}>
          <Icon name={icon} size={21} />
        </div>
        {delta && (
          <span className="badge" style={{ background: deltaKind === 'ok' ? 'var(--ok-soft)' : 'var(--warn-soft)', color: deltaKind === 'ok' ? 'var(--ok)' : 'hsl(38 80% 40%)' }}>
            <Icon name="trend" size={12} />{delta}
          </span>
        )}
      </div>
      <div className="col" style={{ gap: 3 }}>
        <span className="mono tnum" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}>{value}</span>
        <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</span>
      </div>
    </div>
  );
}

function DashboardOverview({ students, onApprove, onOpenStudent, setPage, onAdd }) {
  const pending = students.filter(s => s.status === 'pending');
  const active = students.filter(s => s.status === 'active');
  const upcoming = students.filter(s => s.next).sort((a, b) => a.next.localeCompare(b.next)).slice(0, 4);

  return (
    <div className="col gap-6 stagger" style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* Hero greeting */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ background: 'linear-gradient(120deg, hsl(4 74% 50%), hsl(8 70% 56%))', padding: '26px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '44px solid hsl(0 0% 100% / .08)', top: -140, right: -60 }} />
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative' }}>
            <div className="col" style={{ gap: 6 }}>
              <span className="mono" style={{ fontSize: 12, opacity: .85, letterSpacing: '.1em' }}>{STAFF.branch.toUpperCase()} · 30 MAYIS 2026</span>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>Merhaba {STAFF.name.split(' ')[0]} 👋</h2>
              <p style={{ margin: 0, opacity: .92, fontSize: 14.5 }}>
                {pending.length > 0 ? <><strong>{pending.length} kayıt</strong> onayını bekliyor.</> : 'Bekleyen onay yok, harika!'}
              </p>
            </div>
            <button className="btn" onClick={onAdd} style={{ background: '#fff', color: 'var(--accent-strong)', alignSelf: 'center', fontWeight: 600 }}>
              <Icon name="plus" size={18} />Yeni Öğrenci
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
        <MetricCard icon="users" label="Toplam Öğrenci" value="1.248" delta="+12%" accent />
        <MetricCard icon="graduation" label="Aktif Kayıt" value={active.length * 124} delta="+8%" />
        <MetricCard icon="clock" label="Bekleyen Onay" value={pending.length} delta={pending.length ? 'yeni' : '0'} deltaKind="warn" />
        <MetricCard icon="wallet" label="Bu Ay Tahsilat" value="₺412K" delta="+23%" />
      </div>

      {/* Two columns */}
      <div className="dash-cols" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Pending approvals */}
        <div className="card" style={{ padding: 22 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="row gap-2">
              <Icon name="clipboard" size={19} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700 }}>Onay Bekleyenler</h3>
              <Badge kind="warn">{pending.length}</Badge>
            </div>
            <button className="btn btn-quiet" onClick={() => setPage('students')} style={{ fontSize: 13 }}>Tümü<Icon name="arrowR" size={15} /></button>
          </div>
          {pending.length === 0 && <Empty msg="Bekleyen onay yok." />}
          <div className="col gap-3">
            {pending.map(s => (
              <div key={s.id} className="approve-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface-2)', transition: 'all .2s' }}>
                <Avatar name={s.name} size={42} />
                <div className="col grow" style={{ minWidth: 0, gap: 2 }}>
                  <div className="row gap-2">
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</span>
                    {s.source === 'davet' && <Badge kind="accent"><Icon name="link" size={11} />davet</Badge>}
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{s.lang} · {s.level.split(' — ')[0]} · {s.course}</span>
                </div>
                <div className="row gap-2 approve-actions">
                  <button className="btn btn-ghost" onClick={() => onOpenStudent(s)} style={{ padding: '9px 12px', fontSize: 13 }}>İncele</button>
                  <button className="btn btn-primary" onClick={() => onApprove(s.id)} style={{ padding: '9px 14px', fontSize: 13 }}><Icon name="check" size={16} />Onayla</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: activity + payments */}
        <div className="col gap-4">
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16.5, fontWeight: 700 }}>Son Hareketler</h3>
            <div className="col" style={{ gap: 0 }}>
              {ACTIVITY.map((a, i) => (
                <div key={i} className="row gap-3" style={{ padding: '11px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: a.kind === 'ok' ? 'var(--ok-soft)' : a.kind === 'accent' ? 'var(--accent-soft)' : 'var(--bg-2)',
                    color: a.kind === 'ok' ? 'var(--ok)' : a.kind === 'accent' ? 'var(--accent)' : 'var(--ink-2)' }}>
                    <Icon name={a.icon} size={16} />
                  </div>
                  <div className="col grow" style={{ gap: 1 }}>
                    <span style={{ fontSize: 13.5, lineHeight: 1.4 }}><strong style={{ fontWeight: 600 }}>{a.who}</strong> {a.what}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16.5, fontWeight: 700 }}>Yaklaşan Ödemeler</h3>
            <div className="col gap-2">
              {upcoming.map(s => (
                <div key={s.id} className="row gap-3" style={{ padding: '8px 0' }}>
                  <Avatar name={s.name} size={32} />
                  <div className="col grow" style={{ gap: 0 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtDate(s.next)}</span>
                  </div>
                  <span className="mono tnum" style={{ fontWeight: 700, fontSize: 14 }}>{fmtMoney(s.fee - s.paid)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div className="col" style={{ alignItems: 'center', gap: 10, padding: '32px 0', color: 'var(--ink-3)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--ok-soft)', color: 'var(--ok)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="checkCircle" size={26} />
      </div>
      <span style={{ fontSize: 14 }}>{msg}</span>
    </div>
  );
}

/* ---------------- Students list ---------------- */
function StudentsList({ students, search, onOpenStudent, onAdd, onApprove }) {
  const [filter, setFilter] = React.useState('all');
  const rows = useMemoD(() => {
    let r = students;
    if (filter !== 'all') r = r.filter(s => s.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s => (s.name + s.id + s.phone + s.lang).toLowerCase().includes(q));
    }
    return r;
  }, [students, filter, search]);

  const tabs = [
    { value: 'all', label: 'Tümü', n: students.length },
    { value: 'active', label: 'Aktif', n: students.filter(s => s.status === 'active').length },
    { value: 'pending', label: 'Onay Bekleyen', n: students.filter(s => s.status === 'pending').length },
    { value: 'inactive', label: 'Pasif', n: students.filter(s => s.status === 'inactive').length },
  ];

  return (
    <div className="col gap-4 anim-fade-up" style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* filter bar */}
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="row gap-2 students-tabs" style={{ flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)}
              style={{ border: '1px solid', borderColor: filter === t.value ? 'transparent' : 'var(--line-strong)', cursor: 'pointer',
                background: filter === t.value ? 'var(--ink)' : 'var(--surface)', color: filter === t.value ? 'var(--bg)' : 'var(--ink-2)',
                padding: '9px 15px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 600, fontSize: 13.5, transition: 'all .18s', display: 'flex', gap: 7, alignItems: 'center' }}>
              {t.label}<span className="mono" style={{ fontSize: 11, opacity: .7 }}>{t.n}</span>
            </button>
          ))}
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost"><Icon name="download" size={17} />Dışa Aktar</button>
          <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={18} />Öğrenci Ekle</button>
        </div>
      </div>

      {/* table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="students-table">
          <div className="strow shead">
            <div>Öğrenci</div>
            <div>Dil / Seviye</div>
            <div>Kur</div>
            <div>Durum</div>
            <div>Ödeme</div>
            <div></div>
          </div>
          {rows.map((s, i) => {
            const st = STATUS[s.status];
            const pct = Math.round((s.paid / s.fee) * 100);
            return (
              <div key={s.id} className="strow sbody" onClick={() => onOpenStudent(s)} style={{ animationDelay: `${i * .03}s` }}>
                <div className="row gap-3" style={{ minWidth: 0 }}>
                  <Avatar name={s.name} size={40} />
                  <div className="col" style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.id}</span>
                  </div>
                </div>
                <div className="col" style={{ gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{s.lang}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.level.split(' — ')[0]} · {s.level.split(' — ')[1]}</span>
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-2)' }} className="st-course">{s.course}</div>
                <div><Badge kind={st.kind} dot>{st.label}</Badge></div>
                <div className="col" style={{ gap: 5, minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="mono tnum" style={{ fontSize: 12.5, fontWeight: 700 }}>{fmtMoney(s.paid)}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', borderRadius: 3, background: pct === 100 ? 'var(--ok)' : 'var(--accent)', transition: 'width .6s' }} />
                  </div>
                </div>
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  {s.status === 'pending'
                    ? <button className="btn btn-soft" onClick={e => { e.stopPropagation(); onApprove(s.id); }} style={{ padding: '8px 12px', fontSize: 12.5 }}><Icon name="check" size={15} />Onayla</button>
                    : <button className="btn btn-quiet" onClick={e => e.stopPropagation()} style={{ padding: 8 }}><Icon name="chevR" size={18} /></button>}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}>Sonuç bulunamadı.</div>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardOverview, StudentsList });
