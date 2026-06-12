import { DatePicker, Field, Input, Select, Textarea } from '@/components/ui';
import { CUSTOM_PLAN, PAYMENT_PLANS, PAY_METHODS, PER_TERM_PLAN } from '@/constants/options';
import { formatDate, formatMoney } from '@/utils/format';
import {
  financeFromForm,
  planInstallmentCount,
  previewInstallments,
  type FinanceCoreForm,
} from '../financePlan';
import { FORM_GRID, type FieldUpdater } from './useStepForm';

interface FinanceFieldsProps {
  form: FinanceCoreForm;
  update: FieldUpdater<FinanceCoreForm>;
  patch: (partial: Partial<FinanceCoreForm>) => void;
  /** Course start date — anchor for preview dates when no first date is set. */
  startDate?: string;
  /** The manual form collects the opening payment's method; approval doesn't. */
  showPayMethod?: boolean;
}

const digits = (value: string) => value.replace(/\D/g, '');

/**
 * Shared finance editor: per-term pricing, %/₺ discount, plan choice, opening
 * payment, note — plus the live summary and installment preview. Used by the
 * manual registration form and the approval modal so behavior stays identical.
 */
export function FinanceFields({ form, update, patch, startDate = '', showPayMethod }: FinanceFieldsProps) {
  const { terms, termFee, fee, discountValue, net, paidNow, remaining } = financeFromForm(form);
  const isCustom = form.plan === CUSTOM_PLAN;
  const isPerTerm = form.plan === PER_TERM_PLAN;
  const installmentCount = planInstallmentCount(form.plan, terms);
  // Installments split what is left after the discount and opening payment.
  const showSchedule = installmentCount > 0 && remaining > 0;
  const schedule = showSchedule
    ? previewInstallments(remaining, installmentCount, form.firstDate || startDate)
    : [];

  return (
    <>
      <div className={FORM_GRID}>
        <Field
          label="Kur Ücreti (₺)"
          required
          hint={
            termFee > 0
              ? `${terms} Kur × ${formatMoney(termFee)} = ${formatMoney(fee)}`
              : `${terms} Kur seçildi — toplam otomatik hesaplanır`
          }
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
                      : 'bg-transparent text-ink-3 hover:text-ink-2'
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
            <option value={PER_TERM_PLAN}>{`Kur Başına (${terms} ödeme)`}</option>
            {PAYMENT_PLANS.filter((item) => item !== 'Peşin').map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        {showPayMethod && (
          <Field label="Ödeme Yöntemi">
            <Select value={form.payMethod} onChange={update('payMethod')}>
              {PAY_METHODS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
        )}
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
    </>
  );
}
