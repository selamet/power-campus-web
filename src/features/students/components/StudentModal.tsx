import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Badge, type BadgeKind, Button, DatePicker, Field, Icon, Input, Modal, Select } from '@/components/ui';
import {
  COURSES,
  CUSTOM_PLAN,
  EDU_LEVELS,
  LANGUAGES,
  LEVELS,
  PAYMENT_PLANS,
  PAY_METHODS,
  RELATIONS,
  TERM_COUNTS,
} from '@/constants/options';
import { STATUS } from '@/constants/status';
import type { Student } from '@/types/domain';
import { cn } from '@/utils/cn';
import { digitsOnly, formatDate, formatMoney, paidPercent, todayIso } from '@/utils/format';
import { isValidTckn } from '@/utils/validation';
import { FinanceFields } from './FinanceFields';
import {
  ContactFields,
  EducationFields,
  PersonalFields,
} from './StudentFormKit';
import {
  FORM_GRID,
  useFormDraft,
  type EducationCoreForm,
  type FieldUpdater,
  type PersonCoreForm,
} from './useStepForm';
import {
  FINANCE_FORM_DEFAULTS,
  financeFromForm,
  resolvePlan,
  type FinanceCoreForm,
} from '../financePlan';
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

/** Education + finance choices made while approving a pending student. */
interface ApprovalDraft extends FinanceCoreForm {
  lang: string;
  level: string;
  course: string;
}

/** Simple field edits for an already-active student. */
interface EditDraft {
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

/** Personal + education details editable while reviewing a pending student. */
type InfoDraft = PersonCoreForm & EducationCoreForm;

const toInfoDraft = (s: Student): InfoDraft => ({
  name: s.name,
  tckn: s.tckn ?? '',
  birth: s.birthDate ?? '',
  gender: s.gender ?? '',
  city: s.city || 'İstanbul',
  addr: s.address ?? '',
  email: s.email,
  phone: s.phone,
  cName: s.contactName ?? '',
  cRelation: s.contactRelation || RELATIONS[0],
  cPhone: s.contactPhone ?? '',
  eduLevel: s.educationLevel || EDU_LEVELS[0],
  school: s.school ?? '',
  department: s.department ?? '',
  grade: s.grade ?? '',
});

const toApprovalDraft = (s: Student): ApprovalDraft => {
  const terms = s.terms && s.terms > 0 ? s.terms : 1;
  return {
    ...FINANCE_FORM_DEFAULTS,
    lang: s.lang,
    level: s.level,
    course: s.course,
    terms: String(terms),
    termFee: s.fee > 0 ? String(Math.round(s.fee / terms)) : '',
    plan: s.plan || 'Peşin',
    paidNow: s.paid > 0 ? String(s.paid) : '',
    note: s.note ?? '',
  };
};

const toEditDraft = (s: Student): EditDraft => ({
  name: s.name,
  email: s.email,
  phone: s.phone,
  lang: s.lang,
  level: s.level,
  course: s.course,
  plan: s.plan,
  fee: String(s.fee),
});


/** Centered modal with tabbed student details, approval flow, editing and payments. */
export function StudentModal({ student, onClose, onApprove, onReject, onUpdate, onPay }: StudentModalProps) {
  const isPending = student.status === 'pending';
  const [current, setCurrent] = useState<Student>(student);
  const [tab, setTab] = useState<string>(isPending ? 'onay' : 'ozet');
  const [rejecting, setRejecting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { form: approval, update: updateApproval, patch: setApprovalField } =
    useFormDraft<ApprovalDraft>(toApprovalDraft(student));
  const { form: info, update: updateInfo, patch: patchInfo } = useFormDraft<InfoDraft>(
    toInfoDraft(student),
  );
  const { form: draft, setForm: setDraft, update: updateEdit, patch: patchEdit } =
    useFormDraft<EditDraft>(toEditDraft(student));
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paying, setPaying] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const { form: payForm, update: updatePay, patch: patchPay } = useFormDraft({
    amount: '',
    method: PAY_METHODS[0] as string,
    paidAt: todayIso(),
    note: '',
  });

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

  const fin = financeFromForm(approval);
  const tcknError =
    info.tckn && !isValidTckn(info.tckn) ? 'Geçersiz T.C. Kimlik No' : undefined;
  const canApprove = fin.termFee > 0 && !tcknError;

  const approve = async () => {
    const plan = resolvePlan(approval.plan, fin.terms);
    // Peşin with no explicit opening payment means paid in full; a custom
    // plan has no fixed next date unless one was picked.
    const paid = approval.plan === 'Peşin' && !fin.paidNow ? fin.net : fin.paidNow;
    const next =
      approval.plan === 'Peşin' || paid >= fin.net
        ? null
        : approval.firstDate || (approval.plan === CUSTOM_PLAN ? null : current.start);
    setSaving(true);
    // Approval persists the reviewer's edits on both tabs in a single update.
    const ok = await onUpdate(current.id, {
      name: info.name.trim() || current.name,
      email: info.email,
      phone: info.phone,
      tckn: info.tckn || null,
      birthDate: info.birth || null,
      gender: info.gender || null,
      city: info.city || null,
      address: info.addr || null,
      educationLevel: info.eduLevel || null,
      school: info.school || null,
      department: info.department || null,
      grade: info.grade || null,
      contactName: info.cName || null,
      contactRelation: info.cName ? info.cRelation : null,
      contactPhone: info.cPhone || null,
      lang: approval.lang,
      level: approval.level,
      course: approval.course,
      plan,
      fee: fin.net,
      paid,
      terms: fin.terms,
      note: approval.note.trim() || null,
      next,
    });
    setSaving(false);
    if (ok) {
      onApprove(current.id);
      onClose();
    }
  };

  const saveEdit = async () => {
    const patch: StudentUpdateInput = {
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      lang: draft.lang,
      level: draft.level,
      course: draft.course,
      plan: draft.plan,
      fee: Number(draft.fee) || 0,
    };
    setSaving(true);
    const ok = await onUpdate(current.id, patch);
    setSaving(false);
    if (ok) {
      setCurrent((prev) => ({ ...prev, ...patch }));
      setEditing(false);
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
      patchPay({ amount: '', note: '' });
      await reloadSchedule();
    }
  };

  const status = STATUS[current.status];
  const tabs = isPending
    ? [
        { value: 'onay', label: 'Onay & Finans', icon: 'wallet' },
        { value: 'bilgiler', label: 'Öğrenci Bilgileri', icon: 'id' },
      ]
    : [
        { value: 'ozet', label: 'Özet', icon: 'user' },
        { value: 'finans', label: 'Finans', icon: 'wallet' },
      ];

  return (
    <Modal open onClose={onClose} width={640} pad={false}>
      {/* header */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line bg-surface px-6 pb-3 pt-4">
        <div className="flex items-center gap-3">
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
        {!editing && !paying && (
          <div className="flex gap-1 rounded-xl bg-bg-2 p-1">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-[13px] font-semibold transition-colors',
                  tab === item.value ? 'bg-surface shadow-card' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* body */}
      <div className="flex flex-col gap-4 px-6 py-5">
        {editing ? (
          <>
            <Section icon="user" title="Kişisel & İletişim">
              <div className="flex flex-col gap-3 pt-1">
                <Field label="Ad Soyad">
                  <Input value={draft.name} onChange={updateEdit('name')} />
                </Field>
                <Field label="E-posta">
                  <Input type="email" value={draft.email} onChange={updateEdit('email')} />
                </Field>
                <Field label="Telefon">
                  <Input value={draft.phone} onChange={updateEdit('phone')} inputMode="tel" />
                </Field>
              </div>
            </Section>
            <Section icon="graduation" title="Eğitim & Finans">
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <Field label="Dil">
                  <OptionSelect value={draft.lang} onChange={(v) => patchEdit({ lang: v })} options={LANGUAGES} />
                </Field>
                <Field label="Seviye">
                  <OptionSelect value={draft.level} onChange={(v) => patchEdit({ level: v })} options={LEVELS} />
                </Field>
                <Field label="Kur / Program">
                  <OptionSelect value={draft.course} onChange={(v) => patchEdit({ course: v })} options={COURSES} />
                </Field>
                <Field label="Ödeme Planı">
                  <OptionSelect value={draft.plan} onChange={(v) => patchEdit({ plan: v })} options={PAYMENT_PLANS} />
                </Field>
                <Field label="Kayıt Ücreti (₺)">
                  <Input
                    value={draft.fee}
                    onChange={(e) => patchEdit({ fee: digitsOnly(e.target.value) })}
                    inputMode="numeric"
                    className="font-mono"
                  />
                </Field>
              </div>
            </Section>
          </>
        ) : isPending && tab === 'onay' ? (
          <ApprovalFinance
            student={current}
            draft={approval}
            update={updateApproval}
            patch={setApprovalField}
          />
        ) : isPending && tab === 'bilgiler' ? (
          <>
            <p className="m-0 flex items-start gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-[13px] leading-[1.5] text-ink-2">
              <Icon name="edit" size={18} className="mt-px shrink-0 text-accent" />
              <span>
                Gerekirse öğrencinin bilgilerini düzelt — <strong>onayladığında</strong> buradaki
                değişiklikler de kaydedilir.
              </span>
            </p>
            <Section icon="user" title="Kişisel Bilgiler">
              <div className="pt-1">
                <PersonalFields form={info} update={updateInfo} patch={patchInfo} tcknError={tcknError} />
              </div>
            </Section>
            <Section icon="graduation" title="Eğitim Bilgileri">
              <div className="pt-1">
                <EducationFields form={info} update={updateInfo} />
              </div>
            </Section>
            <Section icon="phone" title="İletişim">
              <div className="pt-1">
                <ContactFields form={info} update={updateInfo} />
              </div>
            </Section>
          </>
        ) : tab === 'ozet' ? (
          <>
            <Section icon="phone" title="İletişim">
              <InfoRow label="E-posta" value={current.email} />
              <InfoRow label="Telefon" value={current.phone} mono />
              <ContactRows student={current} />
              <InfoRow label="Kayıt Tarihi" value={formatDate(current.joined)} />
              {current.approvedByName && (
                <InfoRow
                  label="Onaylayan"
                  value={`${current.approvedByName}${
                    current.approvedAt ? ` · ${formatDate(current.approvedAt)}` : ''
                  }`}
                />
              )}
            </Section>
            <Section icon="graduation" title="Eğitim">
              <InfoRow label="Dil" value={current.lang} />
              <InfoRow label="Seviye" value={current.level} />
              <InfoRow label="Kur / Program" value={current.course} />
              {(current.terms ?? 1) > 1 && <InfoRow label="Kur Sayısı" value={`${current.terms} Kur`} />}
              <InfoRow label="Başlangıç" value={formatDate(current.start)} />
            </Section>
            <ProfileSection student={current} />
          </>
        ) : (
          <FinanceTab student={current} installments={installments} payments={payments} />
        )}
      </div>

      {/* footer */}
      <div className="sticky bottom-0 z-10 border-t border-line bg-surface px-6 py-4">
        {isPending ? (
          !rejecting ? (
            <div className="flex flex-col gap-2">
              {!canApprove && (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-warn-ink">
                  <Icon name="info" size={14} />
                  {fin.termFee <= 0
                    ? 'Onay için kur ücreti girilmeli.'
                    : 'T.C. Kimlik No geçersiz — Öğrenci Bilgileri sekmesinden düzeltin.'}
                </span>
              )}
              <div className="flex items-center gap-3">
                <Button variant="ghost" block onClick={() => setRejecting(true)} disabled={saving}>
                  <Icon name="x" size={17} />
                  Reddet
                </Button>
                <Button variant="primary" block onClick={approve} disabled={saving || !canApprove}>
                  <Icon name="check" size={18} />
                  {saving ? 'Onaylanıyor…' : 'Onayla & Planı Oluştur'}
                </Button>
              </div>
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
                setDraft(toEditDraft(current));
                setEditing(false);
              }}
            >
              Vazgeç
            </Button>
            <Button variant="primary" block onClick={saveEdit} disabled={saving}>
              <Icon name="check" size={17} />
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        ) : paying ? (
          <div className="anim-fade-in flex flex-col gap-3">
            <span className="kicker">ÖDEME AL</span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tutar (₺)">
                <Input
                  value={payForm.amount}
                  onChange={(e) => patchPay({ amount: digitsOnly(e.target.value) })}
                  inputMode="numeric"
                  className="font-mono"
                  placeholder="0"
                />
              </Field>
              <Field label="Tarih">
                <DatePicker
                  value={payForm.paidAt}
                  onChange={(iso) => patchPay({ paidAt: iso })}
                  placeholder="gg.aa.yyyy"
                />
              </Field>
            </div>
            <Field label="Yöntem">
              <Select value={payForm.method} onChange={updatePay('method')}>
                {PAY_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </Select>
            </Field>
            <Field label="Not (opsiyonel)">
              <Input
                value={payForm.note}
                onChange={updatePay('note')}
                placeholder="Açıklama"
              />
            </Field>
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
            <Button
              variant="soft"
              block
              onClick={() => {
                setTab('finans');
                setPaying(true);
              }}
            >
              <Icon name="wallet" size={17} />
              Ödeme Al
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface ApprovalFinanceProps {
  student: Student;
  draft: ApprovalDraft;
  update: FieldUpdater<ApprovalDraft>;
  patch: (partial: Partial<ApprovalDraft>) => void;
}

/** Education choices + the shared finance editor, filled in before approval. */
function ApprovalFinance({ student, draft, update, patch }: ApprovalFinanceProps) {
  return (
    <>
      <p className="m-0 flex items-start gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-[13px] leading-[1.5] text-ink-2">
        <Icon name="info" size={18} className="mt-px shrink-0 text-accent" />
        <span>
          {student.source === 'davet'
            ? 'Öğrenci hoşgeldin formunu doldurdu. '
            : 'Kayıt onay bekliyor. '}
          Eğitim ve ödeme planını belirleyip onayladığında taksit planı otomatik oluşturulur.
        </span>
      </p>

      <Section icon="graduation" title="Eğitim">
        <div className={FORM_GRID}>
          <Field label="Dil" icon="globe">
            <OptionSelect value={draft.lang} onChange={(v) => patch({ lang: v })} options={LANGUAGES} />
          </Field>
          <Field label="Seviye" icon="trend">
            <OptionSelect value={draft.level} onChange={(v) => patch({ level: v })} options={LEVELS} />
          </Field>
          <Field label="Kur / Program" icon="book">
            <OptionSelect value={draft.course} onChange={(v) => patch({ course: v })} options={COURSES} />
          </Field>
          <Field label="Kur Sayısı" icon="layers" hint="Kayıt kapsamındaki kur adedi">
            <Select value={draft.terms} onChange={update('terms')}>
              {TERM_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count} Kur
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section icon="wallet" title="Finans & Ödeme Planı" subtitle="Onaydan önce belirleyin">
        <FinanceFields form={draft} update={update} patch={patch} startDate={student.start} />
      </Section>
    </>
  );
}

interface FinanceTabProps {
  student: Student;
  installments: Installment[];
  payments: Payment[];
}

/** Read-only finance overview for active students. */
function FinanceTab({ student, installments, payments }: FinanceTabProps) {
  const pct = paidPercent(student.paid, student.fee);
  return (
    <Section icon="wallet" title="Finans">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] text-ink-3">Kayıt Ücreti</span>
        <span className="font-mono text-sm font-semibold tabular-nums">{formatMoney(student.fee)}</span>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] text-ink-3">Plan</span>
        <span className="text-[13.5px] font-semibold">
          {student.plan}
          {(student.terms ?? 1) > 1 ? ` · ${student.terms} Kur` : ''}
        </span>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] text-ink-3">Ödenen · %{pct}</span>
        <span className={cn('font-mono text-sm font-bold tabular-nums', pct === 100 ? 'text-ok' : 'text-accent')}>
          {formatMoney(student.paid)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-bg-2">
        <div
          className={cn('h-full rounded transition-[width] duration-500', pct === 100 ? 'bg-ok' : 'bg-accent')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {student.note && (
        <p className="m-0 mt-3 flex items-start gap-2 rounded-lg bg-bg-2 px-3 py-2 text-[12.5px] leading-[1.5] text-ink-2">
          <Icon name="edit" size={14} className="mt-px shrink-0 text-ink-3" />
          {student.note}
        </p>
      )}

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
                {payment.note ? ` · ${payment.note}` : ''}
              </span>
              <span className="font-mono tabular-nums">{formatMoney(payment.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/** Profile details submitted through the welcome or manual form; only filled rows. */
function ProfileSection({ student }: { student: Student }) {
  const rows: { label: string; value?: string; mono?: boolean }[] = [
    { label: 'T.C. Kimlik No', value: student.tckn ?? undefined, mono: true },
    {
      label: 'Doğum Tarihi',
      value: student.birthDate ? formatDate(student.birthDate) : undefined,
    },
    { label: 'Cinsiyet', value: student.gender ?? undefined },
    { label: 'Şehir', value: student.city ?? undefined },
    { label: 'Adres', value: student.address ?? undefined },
    { label: 'Öğrenim Durumu', value: student.educationLevel ?? undefined },
    { label: 'Okul', value: student.school ?? undefined },
    { label: 'Bölüm', value: student.department ?? undefined },
    { label: 'Sınıf / Yıl', value: student.grade ?? undefined },
  ].filter((row) => row.value);

  if (rows.length === 0) return null;
  return (
    <Section icon="id" title="Öğrenci Bilgileri" subtitle="Kayıt formunda bildirilenler">
      {rows.map((row) => (
        <InfoRow key={row.label} label={row.label} value={row.value} mono={row.mono} />
      ))}
    </Section>
  );
}

/** Primary contact person rows, rendered only when provided. */
function ContactRows({ student }: { student: Student }) {
  if (!student.contactName && !student.contactPhone) return null;
  return (
    <>
      {student.contactName && (
        <InfoRow
          label="İletişim Kişisi"
          value={`${student.contactName}${
            student.contactRelation ? ` (${student.contactRelation})` : ''
          }`}
        />
      )}
      {student.contactPhone && (
        <InfoRow label="İletişim Telefonu" value={student.contactPhone} mono />
      )}
    </>
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
