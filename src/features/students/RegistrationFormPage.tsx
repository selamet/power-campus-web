import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DatePicker, Field, Icon, Input, Select, Steps, Textarea } from '@/components/ui';
import {
  COURSES,
  CUSTOM_PLAN,
  GOALS,
  LANGUAGES,
  LEVELS,
  PAYMENT_PLANS,
  PAY_METHODS,
  PER_TERM_PLAN,
  TERM_COUNTS,
} from '@/constants/options';
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
import { formatDate, formatMoney } from '@/utils/format';
import { isValidTckn } from '@/utils/tckn';

const FORM_STEPS = ['Kişisel', 'Eğitim', 'İletişim', 'Finans'] as const;

type DiscountType = 'percent' | 'amount';

interface FormState extends PersonCoreForm {
  lang: string;
  level: string;
  goal: string;
  course: string;
  terms: string;
  start: string;
  termFee: string;
  plan: string;
  payMethod: string;
  firstDate: string;
  discount: string;
  discountType: DiscountType;
  paidNow: string;
  note: string;
}

const initialForm: FormState = {
  ...PERSON_FORM_DEFAULTS,
  lang: LANGUAGES[0],
  level: LEVELS[0],
  goal: GOALS[0],
  course: COURSES[0],
  terms: '1',
  start: '',
  termFee: '',
  plan: 'Peşin',
  payMethod: PAY_METHODS[0],
  firstDate: '',
  discount: '0',
  discountType: 'percent',
  paidNow: '',
  note: '',
};

/**
 * Totals derived from the finance step. The registration fee is dynamic:
 * number of terms ("kur") × price per term, then discount and the opening
 * payment are applied on top.
 */
function financeSummary(form: FormState) {
  const terms = Number(form.terms) || 1;
  const termFee = Number(form.termFee) || 0;
  const fee = terms * termFee;
  const rawDiscount = Number(form.discount) || 0;
  const discountValue =
    form.discountType === 'percent'
      ? Math.round((fee * Math.min(rawDiscount, 100)) / 100)
      : Math.min(rawDiscount, fee);
  const net = Math.max(0, fee - discountValue);
  const paidNow = Math.min(Number(form.paidNow) || 0, net);
  return { terms, termFee, fee, discountValue, net, paidNow, remaining: net - paidNow };
}

/** ISO date `months` months after `iso`, day clamped like the backend does. */
function addMonthsIso(iso: string, months: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const index = month - 1 + months;
  const targetYear = year + Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  const clampedDay = Math.min(day, new Date(targetYear, targetMonth, 0).getDate());
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

/**
 * Equal installments over the remaining balance, mirroring the backend's
 * schedule builder (rounding remainder goes to the first installment).
 */
function previewInstallments(amount: number, count: number, startIso: string) {
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, index) => ({
    sequence: index + 1,
    amount: base + (index === 0 ? remainder : 0),
    due: startIso ? addMonthsIso(startIso, index) : null,
  }));
}

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
    if (step === 0) return form.name.trim().length > 1 && isValidTckn(form.tckn);
    if (step === 1) return Boolean(form.start);
    if (step === 2)
      return /.+@.+\..+/.test(form.email) && form.phone.replace(/\D/g, '').length >= 10;
    return Number(form.termFee) > 0;
  }, [step, form]);

  const save = () => {
    const { terms, net, paidNow } = financeSummary(form);
    // "Kur Başına" resolves to one installment per term so the backend can
    // build the schedule from the plan label.
    const plan = form.plan === PER_TERM_PLAN ? `${terms} Taksit` : form.plan;
    // Peşin with no explicit opening payment means paid in full; a custom
    // plan has no fixed next date unless one was picked.
    const paid = form.plan === 'Peşin' && !paidNow ? net : paidNow;
    const next =
      form.plan === 'Peşin' || paid >= net
        ? null
        : form.firstDate || (form.plan === CUSTOM_PLAN ? null : form.start);
    const newStudent: NewStudentInput = {
      name: form.name.trim(),
      lang: form.lang,
      level: form.level,
      course: form.course,
      status: 'active',
      phone: form.phone,
      start: form.start,
      fee: net,
      paid,
      plan,
      next,
      joined: new Date().toISOString().slice(0, 10),
      email: form.email,
      source: 'manuel',
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
            <Button variant="primary" disabled={!stepValid} onClick={next}>
              Devam et
              <Icon name="arrowR" size={17} />
            </Button>
          ) : (
            <Button variant="primary" disabled={!stepValid} onClick={save}>
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
  const { terms, termFee, fee, discountValue, net, paidNow, remaining } = financeSummary(form);
  const isCustom = form.plan === CUSTOM_PLAN;
  const isPerTerm = form.plan === PER_TERM_PLAN;
  const installmentCount = isPerTerm ? terms : parseInt(form.plan, 10);
  // Installments split what is left after the discount and opening payment.
  const showSchedule =
    !isCustom && form.plan !== 'Peşin' && installmentCount > 0 && remaining > 0;
  const schedule = showSchedule
    ? previewInstallments(remaining, installmentCount, form.firstDate || form.start)
    : [];

  const digits = (value: string) => value.replace(/\D/g, '');

  return (
    <div className="anim-fade-in">
      <SectionHead
        icon="wallet"
        title="Finans & Ödeme Planı"
        desc="Kur ücreti, indirim, taksit ve ödeme yöntemi"
      />
      <div className={FORM_GRID}>
        <Field
          label="Kur Ücreti (₺)"
          required
          hint={termFee > 0 ? `${terms} Kur × ${formatMoney(termFee)} = ${formatMoney(fee)}` : `${terms} Kur seçildi — toplam otomatik hesaplanır`}
        >
          <Input
            value={form.termFee}
            onChange={(event) => patch({ termFee: digits(event.target.value) })}
            placeholder="Örn. 2000"
            className="font-mono"
            inputMode="numeric"
          />
        </Field>
        <Field label="İndirim" hint="Erken kayıt, kardeş vb.">
          <div className="flex gap-1.5">
            <Input
              value={form.discount}
              onChange={(event) => patch({ discount: digits(event.target.value) })}
              className="flex-1 font-mono"
              inputMode="numeric"
            />
            <div className="flex shrink-0 overflow-hidden rounded-[10px] border border-line">
              {(
                [
                  ['percent', '%'],
                  ['amount', '₺'],
                ] as const
              ).map(([type, symbol]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => patch({ discountType: type })}
                  className={`px-3 text-sm font-semibold transition-colors ${
                    form.discountType === type
                      ? 'bg-accent text-white'
                      : 'bg-transparent text-ink-3 hover:text-ink'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </Field>
        <Field
          label="Ödeme Planı"
          hint={
            isCustom
              ? 'Serbest plan — öğrenci istediği zaman öder'
              : isPerTerm
                ? `Her kur başında bir ödeme (${terms} ödeme)`
                : undefined
          }
        >
          <Select value={form.plan} onChange={update('plan')}>
            <option>Peşin</option>
            <option value={PER_TERM_PLAN}>
              Kur Başına ({terms} ödeme)
            </option>
            {PAYMENT_PLANS.filter((item) => item !== 'Peşin').map((item) => (
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
        <Field label="Ödenen Tutar (₺)" hint="Kayıt sırasında alınan ödeme">
          <Input
            value={form.paidNow}
            onChange={(event) => patch({ paidNow: digits(event.target.value) })}
            placeholder="0"
            className="font-mono"
            inputMode="numeric"
          />
        </Field>
        <Field label="İlk Ödeme Tarihi" icon="calendar" hint={isCustom ? 'Opsiyonel' : undefined}>
          <DatePicker
            value={form.firstDate}
            onChange={(iso) => patch({ firstDate: iso })}
            placeholder="gg.aa.yyyy"
          />
        </Field>
        <Field label="Finans Notu" full>
          <Textarea
            rows={2}
            value={form.note}
            onChange={update('note')}
            placeholder="Örn. ikinci taksiti velisi ödeyecek"
          />
        </Field>
      </div>

      {/* summary */}
      <div className="mt-4 rounded-[14px] border border-accent-soft-border bg-accent-soft p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13.5px] text-ink-2">
            {terms > 1 ? `Toplam (${terms} Kur × ${formatMoney(termFee)})` : 'Kayıt Ücreti'}
          </span>
          <span className="font-mono text-sm tabular-nums">{formatMoney(fee)}</span>
        </div>
        {discountValue > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13.5px] text-ink-2">
              İndirim{form.discountType === 'percent' ? ` (%${Number(form.discount)})` : ''}
            </span>
            <span className="font-mono text-sm text-ok tabular-nums">
              −{formatMoney(discountValue)}
            </span>
          </div>
        )}
        {paidNow > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13.5px] text-ink-2">Ödenen</span>
            <span className="font-mono text-sm text-ok tabular-nums">−{formatMoney(paidNow)}</span>
          </div>
        )}
        <div className="divider my-2.5" style={{ background: 'var(--accent-soft-border)' }} />
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-accent-strong">
            {paidNow > 0 ? 'Kalan Tutar' : 'Net Tutar'}
          </span>
          <span className="font-mono text-[20px] font-bold text-accent-strong tabular-nums">
            {formatMoney(paidNow > 0 ? remaining : net)}
          </span>
        </div>
        {isCustom && net > 0 && (
          <p className="mt-2 mb-0 text-right font-mono text-[11.5px] text-ink-3">
            Özel plan · ödeme tarihleri esnek
          </p>
        )}
        {showSchedule && (
          <p className="mt-2 mb-0 text-right font-mono text-[11.5px] text-ink-3">
            {isPerTerm ? 'Kur Başına' : form.plan} · {installmentCount} ×{' '}
            {formatMoney(Math.round(remaining / installmentCount))}
          </p>
        )}
      </div>

      {/* installment preview — mirrors the schedule the backend will create */}
      {showSchedule && (
        <div className="card mt-3 p-4">
          <span className="kicker mb-2.5 block">TAKSİT ÖNİZLEME</span>
          <div className="flex flex-col">
            {schedule.map((item) => (
              <div
                key={item.sequence}
                className="flex items-center justify-between border-b border-line py-2 text-[13.5px] last:border-b-0 last:pb-0 first:pt-0"
              >
                <span className="text-ink-2">
                  {item.sequence}. {isPerTerm ? 'Kur' : 'Taksit'}
                </span>
                <span className="font-mono text-[12px] text-ink-3">
                  {item.due ? formatDate(item.due) : '—'}
                </span>
                <span className="font-mono tabular-nums">{formatMoney(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
