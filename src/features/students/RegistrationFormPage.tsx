import { useNavigate } from 'react-router-dom';
import { Button, DatePicker, Field, Icon, Input, Select, Steps } from '@/components/ui';
import { COURSES, GOALS, LANGUAGES, LEVELS, PAYMENT_PLANS, PAY_METHODS } from '@/constants/options';
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
  type FieldUpdater,
  type PersonCoreForm,
} from '@/features/students/components/useStepForm';
import { useStudentActions } from '@/features/students/useStudentActions';
import { paths } from '@/routes/paths';
import type { NewStudentInput } from '@/types/domain';
import { formatMoney } from '@/utils/format';

const FORM_STEPS = ['Kişisel', 'Eğitim', 'İletişim', 'Finans'] as const;

interface FormState extends PersonCoreForm {
  lang: string;
  level: string;
  goal: string;
  course: string;
  start: string;
  fee: string;
  plan: string;
  payMethod: string;
  firstDate: string;
  discount: string;
}

const initialForm: FormState = {
  ...PERSON_FORM_DEFAULTS,
  lang: LANGUAGES[0],
  level: LEVELS[0],
  goal: GOALS[0],
  course: COURSES[0],
  start: '',
  fee: '',
  plan: 'Peşin',
  payMethod: PAY_METHODS[0],
  firstDate: '',
  discount: '0',
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

  const save = () => {
    const fee = Number(form.fee) || 18500;
    const newStudent: NewStudentInput = {
      name: form.name || 'Yeni Öğrenci',
      lang: form.lang,
      level: form.level,
      course: form.course,
      status: 'active',
      phone: form.phone || '0500 000 00 00',
      start: form.start || '2026-06-15',
      fee,
      paid: form.plan === 'Peşin' ? fee : 0,
      plan: form.plan,
      next: form.plan === 'Peşin' ? null : form.firstDate || '2026-07-01',
      joined: '2026-05-30',
      email: form.email || 'ogrenci@gmail.com',
      source: 'manuel',
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
              <PersonalFields form={form} update={update} patch={patch} />
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
                <Field label="Başlangıç Tarihi" icon="calendar" full>
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

          {step === 3 && <FinanceSection form={form} update={update} patch={patch} />}
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
            <Button variant="primary" onClick={next}>
              Devam et
              <Icon name="arrowR" size={17} />
            </Button>
          ) : (
            <Button variant="primary" onClick={save}>
              <Icon name="check" size={18} />
              Kaydı Tamamla
            </Button>
          )}
        </div>
      </div>
    </WelcomeShell>
  );
}

interface FinanceSectionProps {
  form: FormState;
  update: FieldUpdater<FormState>;
  patch: (partial: Partial<FormState>) => void;
}

function FinanceSection({ form, update, patch }: FinanceSectionProps) {
  const fee = Number(form.fee) || 0;
  const discount = Number(form.discount) || 0;
  const net = Math.max(0, fee - (fee * discount) / 100);

  return (
    <div className="anim-fade-in">
      <SectionHead
        icon="wallet"
        title="Finans & Ödeme Planı"
        desc="Kayıt ücreti, indirim, taksit ve ödeme yöntemi"
      />
      <div className={FORM_GRID}>
        <Field label="Kayıt Ücreti (₺)" required>
          <Input
            value={form.fee}
            onChange={(event) => patch({ fee: event.target.value.replace(/\D/g, '') })}
            placeholder="Örn. 18500"
            className="font-mono"
            inputMode="numeric"
          />
        </Field>
        <Field label="İndirim (%)" hint="Erken kayıt, kardeş vb.">
          <Input
            value={form.discount}
            onChange={(event) =>
              patch({ discount: event.target.value.replace(/\D/g, '').slice(0, 3) })
            }
            className="font-mono"
            inputMode="numeric"
          />
        </Field>
        <Field label="Ödeme Planı">
          <Select value={form.plan} onChange={update('plan')}>
            {PAYMENT_PLANS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Ödeme Yöntemi">
          <Select value={form.payMethod} onChange={update('payMethod')}>
            {PAY_METHODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="İlk Ödeme Tarihi" icon="calendar" full>
          <DatePicker
            value={form.firstDate}
            onChange={(iso) => patch({ firstDate: iso })}
            placeholder="gg.aa.yyyy"
          />
        </Field>
      </div>

      {/* summary */}
      <div className="mt-4 rounded-[14px] border border-accent-soft-border bg-accent-soft p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13.5px] text-ink-2">Kayıt Ücreti</span>
          <span className="font-mono text-sm tabular-nums">{formatMoney(fee)}</span>
        </div>
        {discount > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13.5px] text-ink-2">İndirim (%{discount})</span>
            <span className="font-mono text-sm text-ok tabular-nums">
              −{formatMoney(Math.round((fee * discount) / 100))}
            </span>
          </div>
        )}
        <div className="divider my-2.5" style={{ background: 'var(--accent-soft-border)' }} />
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-accent-strong">Net Tutar</span>
          <span className="font-mono text-[20px] font-bold text-accent-strong tabular-nums">
            {formatMoney(Math.round(net))}
          </span>
        </div>
        {form.plan !== 'Peşin' && net > 0 && (
          <p className="mt-2 mb-0 text-right font-mono text-[11.5px] text-ink-3">
            {form.plan} · ayda {formatMoney(Math.round(net / parseInt(form.plan, 10)))}
          </p>
        )}
      </div>
    </div>
  );
}
