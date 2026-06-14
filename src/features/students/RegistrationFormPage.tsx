import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DatePicker, Field, Icon, Select, Steps } from '@/components/ui';
import { COURSES, CUSTOM_PLAN, GOALS, LANGUAGES, LEVELS, PAY_METHODS, TERM_COUNTS } from '@/constants/options';
import { FinanceFields } from '@/features/students/components/FinanceFields';
import {
  ContactFields,
  PersonalFields,
  SectionHead,
  WelcomeShell,
} from '@/features/students/components/StudentFormKit';
import {
  FORM_GRID,
  PERSON_FORM_DEFAULTS,
  useStepForm,
  type PersonCoreForm,
} from '@/features/students/components/useStepForm';
import {
  FINANCE_FORM_DEFAULTS,
  financeFromForm,
  resolvePlan,
  type FinanceCoreForm,
} from '@/features/students/financePlan';
import { useStudentActions } from '@/features/students/useStudentActions';
import { paths } from '@/routes/paths';
import type { NewStudentInput } from '@/types/domain';
import { todayIso } from '@/utils/format';
import { isValidEmail, isValidPhone, isValidTckn } from '@/utils/validation';

const FORM_STEPS = ['Kişisel', 'Eğitim', 'İletişim', 'Finans'] as const;

interface FormState extends PersonCoreForm, FinanceCoreForm {
  lang: string;
  level: string;
  goal: string;
  course: string;
  start: string;
  payMethod: string;
}

const initialForm: FormState = {
  ...PERSON_FORM_DEFAULTS,
  ...FINANCE_FORM_DEFAULTS,
  lang: LANGUAGES[0],
  level: LEVELS[0],
  goal: GOALS[0],
  course: COURSES[0],
  start: '',
  payMethod: PAY_METHODS[0],
};

/**
 * Staff-only manual registration (`/kayit/yeni`). Shares the welcome theme
 * with the public invite form but adds the admin-only education and finance
 * steps plus navigation back to the dashboard.
 */
export function RegistrationFormPage() {
  const navigate = useNavigate();
  const { create } = useStudentActions();
  const { step, form, update, patch, next, back, isLast } = useStepForm(
    initialForm,
    FORM_STEPS.length,
  );

  const close = () => navigate(paths.overview);

  const tcknError =
    form.tckn.length === 11 && !isValidTckn(form.tckn) ? 'Geçersiz T.C. Kimlik No' : undefined;

  const stepValid = useMemo(() => {
    if (step === 0)
      return (
        form.name.trim().length > 1 &&
        (form.isForeign ? form.passport.trim().length >= 5 : isValidTckn(form.tckn))
      );
    if (step === 1) return Boolean(form.start);
    if (step === 2)
      return isValidEmail(form.email) && isValidPhone(form.phone);
    // Finance is optional: leaving it empty creates a pending student.
    return true;
  }, [step, form]);

  const save = () => {
    const { terms, net, paidNow } = financeFromForm(form);
    // Finance entered (a fee was set) auto-approves the student; otherwise the
    // student is created pending, awaiting approval once a plan is defined.
    const hasFinance = net > 0;
    const plan = resolvePlan(form.plan, terms);
    // Peşin with no explicit opening payment means paid in full; a custom
    // plan has no fixed next date unless one was picked.
    const paid = hasFinance ? (form.plan === 'Peşin' && !paidNow ? net : paidNow) : 0;
    const nextDate =
      !hasFinance || form.plan === 'Peşin' || paid >= net
        ? null
        : form.firstDate || (form.plan === CUSTOM_PLAN ? null : form.start);
    const newStudent: NewStudentInput = {
      name: form.name.trim(),
      lang: form.lang,
      level: form.level,
      course: form.course,
      status: hasFinance ? 'active' : 'pending',
      phone: form.phone,
      start: form.start,
      fee: hasFinance ? net : 0,
      paid,
      plan,
      next: nextDate,
      joined: todayIso(),
      email: form.email,
      source: 'manuel',
      tckn: form.isForeign ? null : form.tckn,
      passportNo: form.isForeign ? form.passport.trim() : null,
      terms,
      note: form.note.trim() || null,
      payMethod: form.payMethod,
    };
    create(newStudent);
    close();
  };

  return (
    <WelcomeShell
      badge={
        <>
          <Icon name="shield" size={14} />
          Yönetici
        </>
      }
    >
      <div className="mx-auto w-full max-w-[720px] flex-1 px-5 pt-5 pb-8">
        <div className="anim-fade-up mb-6">
          <Button variant="quiet" onClick={close}>
            <Icon name="arrowL" size={18} />
            Dashboard
          </Button>
          <div className="mt-2 text-center">
            <span className="kicker mb-2 inline-flex items-center gap-1.5 text-accent">
              <Icon name="sparkle" size={13} />
              Manuel kayıt
              <Icon name="sparkle" size={13} />
            </span>
            <h1 className="m-0 text-[clamp(26px,6vw,36px)] font-bold leading-[1.1] tracking-[-0.03em]">
              Yeni{' '}
              <span className="font-script text-[clamp(40px,9vw,56px)] font-semibold leading-[1.05] text-accent">
                öğrenci
              </span>{' '}
              kaydı
            </h1>
            <p className="mx-auto mt-2 mb-0 max-w-[440px] text-[13.5px] text-ink-3">
              Öğrenciyi adım adım kaydedin; eğitim ve ödeme planı bu ekrandan tanımlanır.
            </p>
          </div>
        </div>

        <div className="mb-5">
          <Steps steps={FORM_STEPS} current={step} />
        </div>

        <div className="card-glow p-5 sm:p-6">
          {step === 0 && (
            <div className="anim-fade-in">
              <SectionHead
                icon="user"
                title="Kişisel Bilgiler"
                desc="Öğrencinin kimlik ve temel bilgileri"
              />
              <PersonalFields form={form} update={update} patch={patch} tcknError={tcknError} />
            </div>
          )}

          {step === 1 && (
            <div className="anim-fade-in">
              <SectionHead
                icon="graduation"
                title="Eğitim Bilgileri"
                desc="Hangi dil, hangi seviye ve hedef"
                tone="accent-2"
              />
              <div className={FORM_GRID}>
                <Field label="Dil" icon="globe" required>
                  <Select value={form.lang} onChange={update('lang')}>
                    {LANGUAGES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Seviye" icon="trend" required>
                  <Select value={form.level} onChange={update('level')}>
                    {LEVELS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Hedef" icon="target">
                  <Select value={form.goal} onChange={update('goal')}>
                    {GOALS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Kur / Program" icon="book" required>
                  <Select value={form.course} onChange={update('course')}>
                    {COURSES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Kur Sayısı" icon="layers" hint="Kayıt kapsamındaki kur adedi">
                  <Select value={form.terms} onChange={update('terms')}>
                    {TERM_COUNTS.map((count) => (
                      <option key={count} value={count}>
                        {count} Kur
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Başlangıç Tarihi" icon="calendar" required>
                  <DatePicker
                    value={form.start}
                    onChange={(iso) => patch({ start: iso })}
                    placeholder="gg.aa.yyyy"
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="anim-fade-in">
              <SectionHead
                icon="phone"
                title="İletişim & Acil Durum Kişisi"
                desc="Öğrenci ve birincil iletişim kişisi"
                tone="ok"
              />
              <ContactFields form={form} update={update} />
            </div>
          )}

          {step === 3 && (
            <div className="anim-fade-in">
              <SectionHead
                icon="wallet"
                title="Finans & Ödeme Planı"
                desc="Kur ücreti, indirim, taksit ve ödeme yöntemi"
              />
              <p className="mb-4 rounded-token-sm bg-surface-2 px-3.5 py-2.5 text-[12.5px] text-ink-2">
                Ücret girerseniz öğrenci <strong>otomatik onaylanır</strong>. Boş bırakırsanız{' '}
                <strong>onay bekleyen</strong> olarak kaydedilir; ödeme planı sonra belirlenir.
              </p>
              <FinanceFields
                form={form}
                update={update}
                patch={patch}
                startDate={form.start}
                showPayMethod
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="ghost" onClick={step === 0 ? close : back}>
            <Icon name="arrowL" size={17} />
            {step === 0 ? 'Vazgeç' : 'Geri'}
          </Button>
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
            <Button variant="primary" disabled={!stepValid} onClick={save}>
              <Icon name="check" size={18} />
              {Number(form.termFee) > 0 ? 'Kaydet ve Onayla' : 'Onaya Gönder'}
            </Button>
          )}
        </div>
      </div>
    </WelcomeShell>
  );
}

