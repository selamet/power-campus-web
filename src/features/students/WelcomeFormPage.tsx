import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '@/api/axiosClient';
import { Button, DatePicker, Field, Icon, Input, Logo, Select, Steps, Textarea, useToast } from '@/components/ui';
import { CITIES } from '@/constants/options';
import { invitesApi } from './invitesApi';

const FORM_STEPS = ['Kişisel', 'Eğitim', 'İletişim'] as const;

/** Adjectives the hero headline cycles through — all fit "Power'ın ___ dünyası". */
const HERO_WORDS = ['ayrıcalıklı', 'başarı dolu', 'ilham veren', 'enerji dolu'] as const;

const EDU_LEVELS = [
  'Lise',
  'Ön Lisans',
  'Lisans',
  'Yüksek Lisans',
  'Doktora',
  'Mezun',
  'Diğer',
] as const;

interface FormState {
  name: string;
  tckn: string;
  birth: string;
  gender: string;
  city: string;
  addr: string;
  email: string;
  phone: string;
  eduLevel: string;
  school: string;
  department: string;
  grade: string;
  cName: string;
  cRelation: string;
  cPhone: string;
}

const initialForm: FormState = {
  name: '',
  tckn: '',
  birth: '',
  gender: '',
  city: 'İstanbul',
  addr: '',
  email: '',
  phone: '',
  eduLevel: EDU_LEVELS[0],
  school: '',
  department: '',
  grade: '',
  cName: '',
  cRelation: 'Anne',
  cPhone: '',
};

const GRID = 'stagger form-grid grid grid-cols-1 gap-3.5 sm:grid-cols-2';

/**
 * Public, self-service form reached through the invite link shared with the
 * student (`/hosgeldin/:tckn`). The student fills in their own details — no
 * authentication and no staff-only fields (fee, plan, discount). The
 * `preview` segment renders the exact same screen for staff to review.
 */
export function WelcomeFormPage() {
  const { tckn } = useParams<{ tckn: string }>();
  const isPreview = tckn === 'preview';
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    // The invite link carries the student's TCKN — pre-fill it so they don't
    // re-type it (and it stays read-only on the form).
    tckn: isPreview ? '' : (tckn ?? '').replace(/\D/g, '').slice(0, 11),
  }));
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [heroWord, setHeroWord] = useState(0);

  // Cycle the hero adjective for a lively first impression.
  useEffect(() => {
    const id = setInterval(() => setHeroWord((i) => (i + 1) % HERO_WORDS.length), 2600);
    return () => clearInterval(id);
  }, []);

  // Each step starts at the top instead of inheriting the previous scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, done]);

  // Load the invite to pre-fill the name and validate the link.
  useEffect(() => {
    if (isPreview || !tckn) return;
    let active = true;
    invitesApi
      .getPublic(tckn)
      .then((invite) => {
        if (!active) return;
        if (invite.status === 'completed') {
          setLinkError('Bu form daha önce dolduruldu.');
          return;
        }
        if (invite.name) setForm((prev) => (prev.name ? prev : { ...prev, name: invite.name ?? '' }));
      })
      .catch((error: ApiError) => {
        if (active) setLinkError(error?.message ?? 'Davet linki geçersiz veya süresi dolmuş.');
      });
    return () => {
      active = false;
    };
  }, [isPreview, tckn]);

  const update =
    (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const patch = (partial: Partial<FormState>) => setForm((prev) => ({ ...prev, ...partial }));

  const isLast = step === FORM_STEPS.length - 1;
  const next = () => setStep((s) => Math.min(s + 1, FORM_STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const stepValid = useMemo(() => {
    if (step === 0) return form.name.trim().length > 1 && form.tckn.length === 11;
    if (step === 1) return Boolean(form.eduLevel && form.school.trim());
    return /.+@.+\..+/.test(form.email) && form.phone.replace(/\D/g, '').length >= 10;
  }, [step, form]);

  // Fraction (0–1) of the current step's fields filled — drives the connector
  // fill that grows as the student types and completes when they advance.
  const stepProgress = useMemo(() => {
    const checks =
      step === 0
        ? [form.name.trim().length > 1, form.tckn.length === 11, Boolean(form.birth), Boolean(form.gender), Boolean(form.addr.trim())]
        : step === 1
          ? [Boolean(form.school.trim()), Boolean(form.department.trim()), Boolean(form.grade.trim())]
          : [/.+@.+\..+/.test(form.email), form.phone.replace(/\D/g, '').length >= 10, Boolean(form.cName.trim()), Boolean(form.cPhone.trim())];
    return checks.filter(Boolean).length / checks.length;
  }, [step, form]);

  const submit = async () => {
    if (isPreview) {
      toast('Önizleme — gönderim devre dışı', 'eye');
      return;
    }
    if (!tckn) return;
    setSubmitting(true);
    try {
      await invitesApi.submit(tckn, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        birthDate: form.birth || undefined,
        gender: form.gender || undefined,
        city: form.city || undefined,
        address: form.addr || undefined,
        educationLevel: form.eduLevel || undefined,
        school: form.school || undefined,
        department: form.department || undefined,
        grade: form.grade || undefined,
        contactName: form.cName || undefined,
        contactRelation: form.cRelation || undefined,
        contactPhone: form.cPhone || undefined,
      });
      setDone(true);
      toast('Formun bize ulaştı', 'check');
    } catch (error) {
      toast((error as ApiError)?.message ?? 'Form gönderilemedi, tekrar deneyin.', 'xCircle');
    } finally {
      setSubmitting(false);
    }
  };

  if (linkError) {
    return (
      <div className="welcome-bg flex min-h-screen flex-col">
        <WelcomeDecor isPreview={isPreview} />
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="card anim-scale-in max-w-[460px] p-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[18px] bg-warn-soft text-warn">
              <Icon name="info" size={32} />
            </div>
            <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em]">Link kullanılamıyor</h1>
            <p className="mt-2.5 mb-0 text-[14.5px] text-ink-2">{linkError}</p>
          </div>
        </div>
        <WelcomeFooter />
      </div>
    );
  }

  if (done) {
    return (
      <div className="welcome-bg flex min-h-screen flex-col">
        <WelcomeDecor isPreview={isPreview} />
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="card-glow anim-scale-in relative max-w-[480px] p-9 text-center">
            <div className="confetti" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <div className="relative mx-auto mb-4 flex size-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-ok to-[hsl(170_60%_38%)] text-white shadow-pop" style={{ animation: 'pop 0.45s cubic-bezier(0.2,0.8,0.3,1) both' }}>
              <Icon name="checkCircle" size={34} />
              <Icon name="partyPopper" size={20} className="absolute -right-2 -top-2 text-accent-2" />
            </div>
            <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em]">
              Aramıza{' '}
              <span className="font-script text-gradient-brand text-[34px] font-semibold leading-none">hoş geldin</span>
              {form.name ? `, ${form.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="mt-2.5 mb-0 text-[14.5px] text-ink-2">
              Power ailesinin bir parçası olmana çok az kaldı. Kayıt ekibimiz en kısa sürede
              seninle iletişime geçip kaydını tamamlayacak.
            </p>
          </div>
        </div>
        <WelcomeFooter />
      </div>
    );
  }

  const firstName = form.name.trim().split(' ')[0];

  return (
    <div className="welcome-bg flex min-h-screen flex-col">
      <WelcomeDecor isPreview={isPreview} />

      <div className="mx-auto w-full max-w-[720px] flex-1 px-5 pt-9 pb-8">
        <div className="anim-fade-up mb-6 text-center">
          <span className="kicker mb-2 inline-flex items-center gap-1.5 text-accent">
            <Icon name="sparkle" size={13} />
            Yeni öğrenci kaydı
            <Icon name="sparkle" size={13} />
          </span>
          <h1 className="m-0 text-[clamp(28px,7.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">
            Power'ın{' '}
            <span
              key={HERO_WORDS[heroWord]}
              className="font-script word-swap block py-1 text-[clamp(48px,13vw,76px)] font-semibold leading-[1.05] text-accent"
            >
              {HERO_WORDS[heroWord]}
            </span>{' '}
            dünyasına hoş geldin{firstName ? `, ${firstName}` : ''}!
          </h1>
        </div>

        <div className="mb-5">
          <Steps steps={FORM_STEPS} current={step} progress={stepProgress} />
        </div>

        <div className="card-glow p-5 sm:p-6">
          {step === 0 && (
            <div className="anim-fade-in">
              <SectionHead icon="user" title="Senin Bilgilerin" desc="Kimlik ve temel bilgiler" tone="accent" />
              <div className={GRID}>
                <Field label="Ad Soyad" required full>
                  <Input value={form.name} onChange={update('name')} placeholder="Örn. Ayşe Yılmaz" />
                </Field>
                <Field label="T.C. Kimlik No" required hint={!isPreview ? 'Davet linkinden alındı' : undefined}>
                  <Input
                    value={form.tckn}
                    onChange={(event) => patch({ tckn: event.target.value.replace(/\D/g, '').slice(0, 11) })}
                    placeholder="Örn. 12345678901"
                    className="font-mono"
                    inputMode="numeric"
                    readOnly={!isPreview}
                  />
                </Field>
                <Field label="Doğum Tarihi">
                  <DatePicker
                    value={form.birth}
                    onChange={(iso) => patch({ birth: iso })}
                    placeholder="gg.aa.yyyy"
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </Field>
                <Field label="Cinsiyet">
                  <Select value={form.gender} onChange={update('gender')}>
                    <option value="">Seçiniz</option>
                    <option>Kadın</option>
                    <option>Erkek</option>
                    <option>Belirtmek istemiyor</option>
                  </Select>
                </Field>
                <Field label="Şehir">
                  <Select value={form.city} onChange={update('city')}>
                    {CITIES.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Adres" full>
                  <Textarea rows={2} value={form.addr} onChange={update('addr')} placeholder="Mahalle, cadde, kapı no, ilçe" />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="anim-fade-in">
              <SectionHead icon="graduation" title="Eğitim Bilgilerin" desc="Hangi okulda okuyorsun, hangi bölüm" tone="accent-2" />
              <div className={GRID}>
                <Field label="Öğrenim Durumu" icon="trend" required>
                  <Select value={form.eduLevel} onChange={update('eduLevel')}>
                    {EDU_LEVELS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Sınıf / Yıl" icon="calendar" hint="Opsiyonel">
                  <Input value={form.grade} onChange={update('grade')} placeholder="Örn. 3. sınıf" />
                </Field>
                <Field label="Okul / Üniversite" icon="book" required full>
                  <Input value={form.school} onChange={update('school')} placeholder="Örn. İstanbul Üniversitesi" />
                </Field>
                <Field label="Bölüm" icon="graduation" full>
                  <Input value={form.department} onChange={update('department')} placeholder="Örn. İşletme" />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="anim-fade-in">
              <SectionHead icon="phone" title="İletişim Bilgilerin" desc="Sana ve birincil iletişim kişisine ulaşalım" tone="ok" />
              <div className={GRID}>
                <Field label="E-posta" icon="mail" required>
                  <Input type="email" value={form.email} onChange={update('email')} placeholder="ornek@mail.com" />
                </Field>
                <Field label="Cep Telefonu" icon="phone" required>
                  <Input value={form.phone} onChange={update('phone')} placeholder="0 (5__) ___ __ __" inputMode="tel" />
                </Field>
              </div>
              <div className="divider my-4" />
              <span className="kicker mb-3 block">BİRİNCİL İLETİŞİM KİŞİSİ</span>
              <div className={GRID}>
                <Field label="Ad Soyad">
                  <Input value={form.cName} onChange={update('cName')} placeholder="Veli / yakını" />
                </Field>
                <Field label="Yakınlık">
                  <Select value={form.cRelation} onChange={update('cRelation')}>
                    {['Anne', 'Baba', 'Eş', 'Kardeş', 'Vasi', 'Kendisi', 'Diğer'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Telefon" icon="phone" full>
                  <Input value={form.cPhone} onChange={update('cPhone')} placeholder="0 (5__) ___ __ __" inputMode="tel" />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          {step > 0 && (
            <Button variant="ghost" onClick={back}>
              <Icon name="arrowL" size={17} />
              Geri
            </Button>
          )}
          <div className="flex-1" />
          <span className="self-center font-mono text-xs text-ink-3">
            {step + 1} / {FORM_STEPS.length}
          </span>
          {!isLast ? (
            <Button variant="primary" disabled={!stepValid} onClick={next}>
              Devam et
              <Icon name="arrowR" size={17} />
            </Button>
          ) : (
            <Button variant="primary" disabled={!stepValid || submitting} onClick={submit}>
              <Icon name="check" size={18} />
              {submitting ? 'Gönderiliyor…' : 'Gönder'}
            </Button>
          )}
        </div>
      </div>

      <WelcomeFooter />
    </div>
  );
}

const BACKDROP_WORDS = ['başarı', 'gelecek', 'hedef', 'ayrıcalık', 'azim'] as const;

/** Faint oversized words drifting behind the form — pure decoration. */
function BackdropWords() {
  return (
    <div className="welcome-words" aria-hidden>
      {BACKDROP_WORDS.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </div>
  );
}

/** Decorative backdrop + preview badge — the public form has no navbar. */
function WelcomeDecor({ isPreview }: { isPreview: boolean }) {
  return (
    <>
      <BackdropWords />
      {isPreview && (
        <span className="fixed right-5 top-5 z-20 flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-semibold text-accent shadow-card">
          <Icon name="eye" size={14} />
          Önizleme
        </span>
      )}
    </>
  );
}

/** Brand mark anchored at the bottom of every welcome screen. */
function WelcomeFooter() {
  return (
    <div className="flex flex-col items-center gap-2 pb-7 pt-4">
      <Logo height={38} />
      <span className="font-mono text-[11px] tracking-[0.08em] text-ink-3">
        Crafted by{' '}
        <a
          href="https://selamet.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit no-underline"
        >
          selamet.dev
        </a>
      </span>
    </div>
  );
}

const SECTION_TONES = {
  accent: 'bg-gradient-to-br from-accent to-[hsl(0_60%_38%)] text-white shadow-accent',
  'accent-2': 'bg-gradient-to-br from-[hsl(8_80%_55%)] to-accent text-white shadow-accent',
  ok: 'bg-gradient-to-br from-accent-strong to-[hsl(0_60%_35%)] text-white shadow-accent',
} as const;

function SectionHead({
  icon,
  title,
  desc,
  tone = 'accent',
}: {
  icon: string;
  title: string;
  desc: string;
  tone?: keyof typeof SECTION_TONES;
}) {
  return (
    <div className="anim-fade-in mb-4 flex items-center gap-3">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${SECTION_TONES[tone]}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 text-lg font-bold tracking-[-0.01em]">{title}</h3>
        <span className="text-[13px] text-ink-3">{desc}</span>
      </div>
    </div>
  );
}
