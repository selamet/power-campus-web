import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ApiError } from '@/api/axiosClient';
import { Button, Icon, Steps, useToast } from '@/components/ui';
import {
  ContactFields,
  EducationFields,
  PersonalFields,
  SectionHead,
  WelcomeShell,
} from '@/features/students/components/StudentFormKit';
import {
  EDUCATION_FORM_DEFAULTS,
  PERSON_FORM_DEFAULTS,
  useStepForm,
  type EducationCoreForm,
  type PersonCoreForm,
} from '@/features/students/components/useStepForm';
import { digitsOnly } from '@/utils/format';
import { isValidEmail, isValidPhone } from '@/utils/validation';
import { invitesApi } from './invitesApi';

const FORM_STEPS = ['Kişisel', 'Eğitim', 'İletişim'] as const;

/** Adjectives the hero headline cycles through — all fit "Power'ın ___ dünyası". */
const HERO_WORDS = ['ayrıcalıklı', 'başarı dolu', 'ilham veren', 'enerji dolu'] as const;

interface FormState extends PersonCoreForm, EducationCoreForm {}

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
  const { step, form, setForm, update, patch, next, back, isLast } = useStepForm<FormState>(
    {
      ...PERSON_FORM_DEFAULTS,
      ...EDUCATION_FORM_DEFAULTS,
      // The invite link carries the student's TCKN — pre-fill it so they don't
      // re-type it (and it stays read-only on the form).
      tckn: isPreview ? '' : digitsOnly(tckn ?? '').slice(0, 11),
    },
    FORM_STEPS.length,
  );
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [heroWord, setHeroWord] = useState(0);

  // Cycle the hero adjective for a lively first impression.
  useEffect(() => {
    const id = setInterval(() => setHeroWord((i) => (i + 1) % HERO_WORDS.length), 2600);
    return () => clearInterval(id);
  }, []);

  // The success screen replaces the form — make sure it opens at the top.
  useEffect(() => {
    if (done) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [done]);

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
  }, [isPreview, tckn, setForm]);

  const stepValid = useMemo(() => {
    if (step === 0) return form.name.trim().length > 1 && form.tckn.length === 11;
    if (step === 1) return Boolean(form.eduLevel && form.school.trim());
    return isValidEmail(form.email) && isValidPhone(form.phone);
  }, [step, form]);

  // Fraction (0–1) of the current step's fields filled — drives the connector
  // fill that grows as the student types and completes when they advance.
  const stepProgress = useMemo(() => {
    const checks =
      step === 0
        ? [form.name.trim().length > 1, form.tckn.length === 11, Boolean(form.birth), Boolean(form.gender), Boolean(form.addr.trim())]
        : step === 1
          ? [Boolean(form.school.trim()), Boolean(form.department.trim()), Boolean(form.grade.trim())]
          : [isValidEmail(form.email), isValidPhone(form.phone), Boolean(form.cName.trim()), Boolean(form.cPhone.trim())];
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

  const previewBadge = isPreview ? (
    <>
      <Icon name="eye" size={14} />
      Önizleme
    </>
  ) : undefined;

  if (linkError) {
    return (
      <WelcomeShell badge={previewBadge}>
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="card anim-scale-in max-w-[460px] p-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[18px] bg-warn-soft text-warn">
              <Icon name="info" size={32} />
            </div>
            <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em]">Link kullanılamıyor</h1>
            <p className="mt-2.5 mb-0 text-[14.5px] text-ink-2">{linkError}</p>
          </div>
        </div>
      </WelcomeShell>
    );
  }

  if (done) {
    return (
      <WelcomeShell badge={previewBadge}>
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
      </WelcomeShell>
    );
  }

  const firstName = form.name.trim().split(' ')[0];

  return (
    <WelcomeShell badge={previewBadge}>
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
              <PersonalFields
                form={form}
                update={update}
                patch={patch}
                tcknReadOnly={!isPreview}
                tcknHint={!isPreview ? 'Davet linkinden alındı' : undefined}
              />
            </div>
          )}

          {step === 1 && (
            <div className="anim-fade-in">
              <SectionHead icon="graduation" title="Eğitim Bilgilerin" desc="Hangi okulda okuyorsun, hangi bölüm" tone="accent-2" />
              <EducationFields form={form} update={update} />
            </div>
          )}

          {step === 2 && (
            <div className="anim-fade-in">
              <SectionHead icon="phone" title="İletişim Bilgilerin" desc="Sana ve birincil iletişim kişisine ulaşalım" tone="ok" />
              <ContactFields form={form} update={update} />
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
    </WelcomeShell>
  );
}
