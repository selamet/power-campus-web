import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Badge, type BadgeKind, Button, Icon, Input, Modal, Select } from '@/components/ui';
import { COURSES, LANGUAGES, LEVELS, PAYMENT_PLANS, PAY_METHODS } from '@/constants/options';
import { STATUS } from '@/constants/status';
import type { Student } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatDate, formatMoney, paidPercent } from '@/utils/format';
import {
  studentsApi,
  type Installment,
  type InstallmentStatus,
  type Payment,
  type RecordPaymentInput,
  type StudentUpdateInput,
} from '../studentsApi';

interface StudentModalProps {
  student: Student;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdate: (id: string, patch: StudentUpdateInput) => Promise<boolean>;
  onPay: (id: string, input: RecordPaymentInput) => Promise<Student | null>;
}

interface Draft {
  name: string;
  email: string;
  phone: string;
  lang: string;
  level: string;
  course: string;
  plan: string;
  fee: string;
}

const INSTALLMENT_BADGE: Record<InstallmentStatus, { kind: BadgeKind; label: string }> = {
  paid: { kind: 'ok', label: 'Ödendi' },
  partial: { kind: 'accent', label: 'Kısmi' },
  overdue: { kind: 'warn', label: 'Gecikmiş' },
  pending: { kind: 'neutral', label: 'Bekliyor' },
};

const toDraft = (s: Student): Draft => ({
  name: s.name,
  email: s.email,
  phone: s.phone,
  lang: s.lang,
  level: s.level,
  course: s.course,
  plan: s.plan,
  fee: String(s.fee),
});

const today = () => new Date().toISOString().slice(0, 10);

const planCount = (plan: string): number => {
  const digits = plan.replace(/\D/g, '');
  return digits ? Number(digits) : 1;
};

/** Centered modal with student details, budgeting + approval, editing and payments. */
export function StudentModal({ student, onClose, onApprove, onReject, onUpdate, onPay }: StudentModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [current, setCurrent] = useState<Student>(student);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(student));
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paying, setPaying] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: PAY_METHODS[0] as string, paidAt: today(), note: '' });

  const isPending = current.status === 'pending';

  const reloadSchedule = async () => {
    const [ins, pays] = await Promise.all([
      studentsApi.installments(current.id),
      studentsApi.payments(current.id),
    ]);
    setInstallments(ins);
    setPayments(pays);
  };

  useEffect(() => {
    if (student.status === 'pending') return;
    let active = true;
    Promise.all([studentsApi.installments(student.id), studentsApi.payments(student.id)])
      .then(([ins, pays]) => {
        if (active) {
          setInstallments(ins);
          setPayments(pays);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [student.id, student.status]);

  const set = (key: keyof Draft, value: string) => setDraft((prev) => ({ ...prev, [key]: value }));

  const buildPatch = (): StudentUpdateInput => ({
    name: draft.name,
    email: draft.email,
    phone: draft.phone,
    lang: draft.lang,
    level: draft.level,
    course: draft.course,
    plan: draft.plan,
    fee: Number(draft.fee) || 0,
  });

  const save = async () => {
    setSaving(true);
    const ok = await onUpdate(current.id, buildPatch());
    setSaving(false);
    if (ok) {
      setCurrent((prev) => ({ ...prev, ...buildPatch() }));
      setEditing(false);
    }
  };

  const approve = async () => {
    setSaving(true);
    const ok = await onUpdate(current.id, buildPatch());
    setSaving(false);
    if (ok) {
      onApprove(current.id);
      onClose();
    }
  };

  const submitPayment = async () => {
    const amount = Number(payForm.amount) || 0;
    if (amount <= 0) return;
    setSavingPay(true);
    const updated = await onPay(current.id, {
      amount,
      paidAt: payForm.paidAt,
      method: payForm.method,
      note: payForm.note || undefined,
    });
    setSavingPay(false);
    if (updated) {
      setCurrent(updated);
      setPaying(false);
      setPayForm((prev) => ({ ...prev, amount: '', note: '' }));
      await reloadSchedule();
    }
  };

  const status = STATUS[current.status];
  const pct = paidPercent(current.paid, current.fee);
  const feeNum = Number(draft.fee) || 0;
  const count = planCount(draft.plan);
  const perInstallment = count > 0 ? Math.floor(feeNum / count) : feeNum;

  return (
    <Modal open onClose={onClose} width={600} pad={false}>
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface px-6 py-4">
        <Avatar name={current.name} size={46} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="m-0 truncate text-[18px] font-bold tracking-[-0.01em]">{current.name}</h2>
            <span className="font-mono text-[11px] text-ink-3">{current.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge kind={status.kind} dot>
              {status.label}
            </Badge>
            {current.source === 'davet' && (
              <Badge kind="accent">
                <Icon name="link" size={11} />
                Davet ile
              </Badge>
            )}
            {current.source === 'manuel' && (
              <Badge kind="neutral">
                <Icon name="edit" size={11} />
                Manuel
              </Badge>
            )}
          </div>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={20} />
        </Button>
      </div>

      {/* body */}
      <div className="flex flex-col gap-4 px-6 py-5">
        {isPending ? (
          <>
            <p className="m-0 flex items-start gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-[13px] leading-[1.5] text-ink-2">
              <Icon name="info" size={18} className="mt-px shrink-0 text-accent" />
              <span>
                Öğrenci hoşgeldin formunu doldurdu. <strong>Seviye ve ücreti belirleyip</strong>{' '}
                onayladığında taksit planı otomatik oluşturulur.
              </span>
            </p>

            <Section icon="wallet" title="Bütçelendirme" subtitle="Onaydan önce belirleyin">
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <EditField label="Dil">
                  <OptionSelect value={draft.lang} onChange={(v) => set('lang', v)} options={LANGUAGES} />
                </EditField>
                <EditField label="Seviye">
                  <OptionSelect value={draft.level} onChange={(v) => set('level', v)} options={LEVELS} />
                </EditField>
                <EditField label="Kur / Program">
                  <OptionSelect value={draft.course} onChange={(v) => set('course', v)} options={COURSES} />
                </EditField>
                <EditField label="Ödeme Planı">
                  <OptionSelect value={draft.plan} onChange={(v) => set('plan', v)} options={PAYMENT_PLANS} />
                </EditField>
                <EditField label="Kayıt Ücreti (₺)">
                  <Input
                    value={draft.fee}
                    onChange={(e) => set('fee', e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    className="font-mono"
                    placeholder="0"
                  />
                </EditField>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-accent-soft-border bg-accent-soft px-3.5 py-2.5">
                <span className="text-[13px] text-ink-2">Taksit önizleme</span>
                <span className="font-mono text-[13px] font-bold text-accent-strong">
                  {count <= 1 ? `Peşin · ${formatMoney(feeNum)}` : `${count} × ${formatMoney(perInstallment)}`}
                </span>
              </div>
            </Section>

            <Section icon="user" title="İletişim">
              <InfoRow label="E-posta" value={current.email} />
              <InfoRow label="Telefon" value={current.phone} mono />
              <InfoRow label="Form Tarihi" value={formatDate(current.joined)} />
            </Section>
          </>
        ) : editing ? (
          <>
            <Section icon="user" title="Kişisel & İletişim">
              <div className="flex flex-col gap-3 pt-1">
                <EditField label="Ad Soyad">
                  <Input value={draft.name} onChange={(e) => set('name', e.target.value)} />
                </EditField>
                <EditField label="E-posta">
                  <Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
                </EditField>
                <EditField label="Telefon">
                  <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
                </EditField>
              </div>
            </Section>
            <Section icon="graduation" title="Eğitim & Finans">
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <EditField label="Dil">
                  <OptionSelect value={draft.lang} onChange={(v) => set('lang', v)} options={LANGUAGES} />
                </EditField>
                <EditField label="Seviye">
                  <OptionSelect value={draft.level} onChange={(v) => set('level', v)} options={LEVELS} />
                </EditField>
                <EditField label="Kur / Program">
                  <OptionSelect value={draft.course} onChange={(v) => set('course', v)} options={COURSES} />
                </EditField>
                <EditField label="Ödeme Planı">
                  <OptionSelect value={draft.plan} onChange={(v) => set('plan', v)} options={PAYMENT_PLANS} />
                </EditField>
                <EditField label="Kayıt Ücreti (₺)">
                  <Input
                    value={draft.fee}
                    onChange={(e) => set('fee', e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    className="font-mono"
                  />
                </EditField>
              </div>
            </Section>
          </>
        ) : (
          <>
            <Section icon="user" title="Kişisel & İletişim">
              <InfoRow label="E-posta" value={current.email} />
              <InfoRow label="Telefon" value={current.phone} mono />
              <InfoRow label="Kayıt Tarihi" value={formatDate(current.joined)} />
            </Section>

            <Section icon="graduation" title="Eğitim">
              <InfoRow label="Dil" value={current.lang} />
              <InfoRow label="Seviye" value={current.level} />
              <InfoRow label="Kur / Program" value={current.course} />
              <InfoRow label="Başlangıç" value={formatDate(current.start)} />
            </Section>

            <Section icon="wallet" title="Finans">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] text-ink-3">Kayıt Ücreti</span>
                <span className="font-mono text-sm font-semibold tabular-nums">{formatMoney(current.fee)}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] text-ink-3">Ödenen · %{pct}</span>
                <span className={cn('font-mono text-sm font-bold tabular-nums', pct === 100 ? 'text-ok' : 'text-accent')}>
                  {formatMoney(current.paid)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-bg-2">
                <div
                  className={cn('h-full rounded transition-[width] duration-500', pct === 100 ? 'bg-ok' : 'bg-accent')}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {installments.length > 0 && (
                <div className="mt-4 flex flex-col gap-1">
                  <span className="kicker mb-1 block">TAKSİT PLANI</span>
                  {installments.map((item) => {
                    const badge = INSTALLMENT_BADGE[item.status];
                    return (
                      <div
                        key={item.sequence}
                        className="flex items-center justify-between border-b border-line py-[7px] text-[13px]"
                      >
                        <span className="text-ink-3">
                          #{item.sequence} · {formatDate(item.dueDate)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono tabular-nums">{formatMoney(item.amount)}</span>
                          <Badge kind={badge.kind}>{badge.label}</Badge>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {payments.length > 0 && (
                <div className="mt-3 flex flex-col gap-1">
                  <span className="kicker mb-1 block">TAHSİLATLAR</span>
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-[3px] text-[12.5px] text-ink-2"
                    >
                      <span>
                        {formatDate(payment.paidAt)} · {payment.method}
                      </span>
                      <span className="font-mono tabular-nums">{formatMoney(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>

      {/* footer */}
      <div className="sticky bottom-0 z-10 border-t border-line bg-surface px-6 py-4">
        {isPending ? (
          !rejecting ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" block onClick={() => setRejecting(true)} disabled={saving}>
                <Icon name="x" size={17} />
                Reddet
              </Button>
              <Button variant="primary" block onClick={approve} disabled={saving}>
                <Icon name="check" size={18} />
                {saving ? 'Onaylanıyor…' : 'Onayla & Planı Oluştur'}
              </Button>
            </div>
          ) : (
            <div className="anim-fade-in flex flex-col gap-3">
              <span className="text-[13px] text-ink-2">Kaydı reddetmek istediğine emin misin?</span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" block onClick={() => setRejecting(false)}>
                  Vazgeç
                </Button>
                <Button
                  block
                  onClick={() => {
                    onReject(current.id);
                    onClose();
                  }}
                  className="bg-accent text-white"
                >
                  <Icon name="xCircle" size={17} />
                  Evet, reddet
                </Button>
              </div>
            </div>
          )
        ) : editing ? (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              block
              disabled={saving}
              onClick={() => {
                setDraft(toDraft(current));
                setEditing(false);
              }}
            >
              Vazgeç
            </Button>
            <Button variant="primary" block onClick={save} disabled={saving}>
              <Icon name="check" size={17} />
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        ) : paying ? (
          <div className="anim-fade-in flex flex-col gap-3">
            <span className="kicker">ÖDEME AL</span>
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Tutar (₺)">
                <Input
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))}
                  inputMode="numeric"
                  className="font-mono"
                  placeholder="0"
                />
              </EditField>
              <EditField label="Tarih">
                <Input
                  type="date"
                  value={payForm.paidAt}
                  onChange={(e) => setPayForm((p) => ({ ...p, paidAt: e.target.value }))}
                />
              </EditField>
            </div>
            <EditField label="Yöntem">
              <Select value={payForm.method} onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))}>
                {PAY_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </Select>
            </EditField>
            <div className="flex items-center gap-3">
              <Button variant="ghost" block disabled={savingPay} onClick={() => setPaying(false)}>
                Vazgeç
              </Button>
              <Button variant="primary" block disabled={savingPay || !payForm.amount} onClick={submitPayment}>
                <Icon name="wallet" size={17} />
                {savingPay ? 'Kaydediliyor…' : 'Ödemeyi Kaydet'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="ghost" block onClick={() => setEditing(true)}>
              <Icon name="edit" size={17} />
              Düzenle
            </Button>
            <Button variant="soft" block onClick={() => setPaying(true)}>
              <Icon name="wallet" size={17} />
              Ödeme Al
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function EditField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function OptionSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const hasValue = options.includes(value);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {!hasValue && value && <option value={value}>{value}</option>}
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </Select>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-[9px] last:border-0">
      <span className="shrink-0 text-[13px] text-ink-3">{label}</span>
      <span className={cn('text-right text-[13.5px] font-semibold', mono && 'font-mono tabular-nums')}>
        {value || '—'}
      </span>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="card p-[18px]">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon name={icon} size={17} />
        </div>
        <div className="flex flex-col">
          <h4 className="m-0 text-[14.5px] font-bold">{title}</h4>
          {subtitle && <span className="text-[12px] text-ink-3">{subtitle}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}
