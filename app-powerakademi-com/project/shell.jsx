/* shell.jsx — App shell: sidebar + topbar */
const { useState: useStateSh } = React;

const NAV = [
  { id: 'overview', label: 'Genel Bakış', icon: 'grid' },
  { id: 'students', label: 'Öğrenciler', icon: 'users' },
];
const NAV_SOON = [
  { label: 'Sınıflar', icon: 'layers' },
  { label: 'Yoklama', icon: 'clipboard' },
  { label: 'Ders Programı', icon: 'calendar' },
  { label: 'Dökümanlar', icon: 'folder' },
];

function Sidebar({ page, setPage, open, onClose }) {
  return (
    <>
      {open && <div onClick={onClose} className="sidebar-scrim" style={{ position: 'fixed', inset: 0, background: 'hsl(20 30% 8% / .5)', zIndex: 40, backdropFilter: 'blur(2px)' }} />}
      <aside className="sidebar" data-open={open} style={{
        width: 'var(--sidebar-w)', background: 'var(--surface)', borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      }}>
        <div style={{ padding: '22px 20px 16px' }}>
          <Logo height={30} />
        </div>

        <nav style={{ padding: '6px 12px', flex: 1, overflowY: 'auto' }}>
          <div className="kicker" style={{ padding: '12px 10px 8px' }}>Menü</div>
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => { setPage(n.id); onClose(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                  borderRadius: 11, border: 'none', cursor: 'pointer', marginBottom: 3,
                  fontFamily: 'inherit', fontSize: 14.5, fontWeight: active ? 600 : 500, textAlign: 'left',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent-strong)' : 'var(--ink-2)',
                  position: 'relative', transition: 'all .18s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                {active && <span style={{ position: 'absolute', left: -12, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--accent)' }} />}
                <Icon name={n.icon} size={19} />{n.label}
              </button>
            );
          })}

          <div className="kicker" style={{ padding: '18px 10px 8px' }}>Yakında</div>
          {NAV_SOON.map(n => (
            <div key={n.label} title="Yakında eklenecek"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 11, fontSize: 14.5, fontWeight: 500, color: 'var(--ink-3)', opacity: .65, cursor: 'not-allowed', marginBottom: 3 }}>
              <Icon name={n.icon} size={19} />{n.label}
              <span style={{ marginLeft: 'auto', fontSize: 9.5, fontFamily: 'Space Mono, monospace', fontWeight: 700, letterSpacing: '.05em', background: 'var(--bg-2)', color: 'var(--ink-3)', padding: '3px 6px', borderRadius: 6 }}>YAKINDA</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
          <div className="row gap-3" style={{ padding: '8px 8px', borderRadius: 11 }}>
            <Avatar name={STAFF.name} size={38} />
            <div className="col grow" style={{ minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{STAFF.name}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent)', letterSpacing: '.04em' }}>{STAFF.role.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ title, subtitle, onMenu, theme, setTheme, onAdd, search, setSearch }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30, background: 'hsl(30 24% 97% / .8)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--line)', padding: '14px 28px',
      display: 'flex', alignItems: 'center', gap: 16,
    }} className="topbar">
      <button className="topbar-menu btn-quiet btn" onClick={onMenu} style={{ display: 'none', padding: 9 }}><Icon name="menu" size={20} /></button>
      <div className="col grow" style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 21, margin: 0, letterSpacing: '-.02em', fontWeight: 700 }}>{title}</h1>
        {subtitle && <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{subtitle}</span>}
      </div>

      <div className="topbar-search" style={{ position: 'relative', width: 260 }}>
        <Icon name="search" size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
        <input className="input" placeholder="Öğrenci, ID, telefon ara…" value={search} onChange={e => setSearch && setSearch(e.target.value)}
          style={{ paddingLeft: 38, height: 42, background: 'var(--surface)' }} />
      </div>

      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="btn btn-ghost" style={{ padding: 10, width: 42, height: 42 }} aria-label="Tema">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
      </button>
      <button className="btn btn-ghost topbar-bell" style={{ padding: 10, width: 42, height: 42, position: 'relative' }} aria-label="Bildirimler">
        <Icon name="bell" size={19} />
        <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--surface)' }} />
      </button>
      <button className="btn btn-primary topbar-add" onClick={onAdd}>
        <Icon name="plus" size={18} />Öğrenci Ekle
      </button>
    </header>
  );
}

function AppShell({ page, setPage, title, subtitle, theme, setTheme, onAdd, search, setSearch, children }) {
  const [navOpen, setNavOpen] = useStateSh(false);
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar page={page} setPage={setPage} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="col grow" style={{ minWidth: 0 }}>
        <Topbar title={title} subtitle={subtitle} onMenu={() => setNavOpen(true)} theme={theme} setTheme={setTheme} onAdd={onAdd} search={search} setSearch={setSearch} />
        <main style={{ padding: '28px', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, AppShell });
