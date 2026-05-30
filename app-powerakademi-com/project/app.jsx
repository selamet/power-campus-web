/* app.jsx — root, routing, state */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  return { h: Math.round(hue), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E11D2A",
  "density": "regular",
  "radius": 14
}/*EDITMODE-END*/;

function App() {
  const [theme, setTheme] = useTheme();
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffectApp(() => {
    const root = document.documentElement.style;
    const { h, s, l } = hexToHsl(tw.accent);
    root.setProperty('--accent-h', h);
    root.setProperty('--accent-s', Math.max(s, 55) + '%');
    root.setProperty('--accent-l', l + '%');
    const dens = { compact: 0.62, regular: 1, comfy: 1.35 }[tw.density] || 1;
    root.setProperty('--density', dens);
    root.setProperty('--radius', tw.radius + 'px');
    root.setProperty('--radius-sm', (tw.radius - 4) + 'px');
    root.setProperty('--radius-lg', (tw.radius + 8) + 'px');
  }, [tw.accent, tw.density, tw.radius]);
  const [view, setView] = useStateApp('login'); // login | app | form | welcome
  const [page, setPage] = useStateApp('overview'); // overview | students
  const [students, setStudents] = useStateApp(STUDENTS);
  const [search, setSearch] = useStateApp('');
  const [drawer, setDrawer] = useStateApp(null);
  const [choiceOpen, setChoiceOpen] = useStateApp(false);
  const [inviteOpen, setInviteOpen] = useStateApp(false);
  const toast = useToast();

  const approve = (id) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    const s = students.find(x => x.id === id);
    toast(`${s ? s.name : 'Öğrenci'} onaylandı`, 'checkCircle');
  };
  const reject = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    toast('Kayıt reddedildi', 'xCircle');
  };
  const addStudent = (st) => setStudents(prev => [st, ...prev]);

  const openAdd = () => setChoiceOpen(true);

  const titles = {
    overview: { title: 'Genel Bakış', subtitle: STAFF.branch + ' · yönetim paneli' },
    students: { title: 'Öğrenciler', subtitle: students.length + ' kayıt' },
  };
  const t = titles[page];

  let content;
  if (view === 'login') {
    content = <LoginScreen onLogin={() => setView('app')} theme={theme} setTheme={setTheme} />;
  } else if (view === 'form') {
    content = <RegistrationForm onClose={() => setView('app')} onSave={addStudent} />;
  } else if (view === 'welcome') {
    content = <WelcomeMobile onClose={() => setView('app')} />;
  } else {
    content = (
      <>
        <AppShell page={page} setPage={setPage} title={t.title} subtitle={t.subtitle}
          theme={theme} setTheme={setTheme} onAdd={openAdd} search={search} setSearch={setSearch}>
          {page === 'overview' && (
            <DashboardOverview students={students} onApprove={approve} onOpenStudent={setDrawer} setPage={setPage} onAdd={openAdd} />
          )}
          {page === 'students' && (
            <StudentsList students={students} search={search} onOpenStudent={setDrawer} onAdd={openAdd} onApprove={approve} />
          )}
        </AppShell>

        {drawer && <StudentDrawer student={drawer} onClose={() => setDrawer(null)} onApprove={approve} onReject={reject} />}

        <AddChoiceModal open={choiceOpen} onClose={() => setChoiceOpen(false)}
          onManual={() => { setChoiceOpen(false); setView('form'); }}
          onInvite={() => { setChoiceOpen(false); setInviteOpen(true); }} />

        <InviteFlow open={inviteOpen} onClose={() => setInviteOpen(false)}
          onPreview={() => { setInviteOpen(false); setView('welcome'); }} />
      </>
    );
  }

  return (
    <>
      {content}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Marka" />
        <TweakColor label="Vurgu rengi" value={tw.accent}
          options={['#E11D2A', '#C81E5B', '#E0561C', '#B5283C', '#1F8A5B', '#2563EB']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Düzen" />
        <TweakRadio label="Yoğunluk" value={tw.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)} />
        <TweakSlider label="Köşe yuvarlaklığı" value={tw.radius} min={6} max={22} step={2} unit="px"
          onChange={(v) => setTweak('radius', v)} />
        <TweakSection label="Tema" />
        <TweakRadio label="Görünüm" value={theme}
          options={['light', 'dark']}
          onChange={(v) => setTheme(v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider><App /></ToastProvider>
);
