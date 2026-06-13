import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  Avatar,
  Badge,
  type BadgeKind,
  Button,
  DatePicker,
  Field,
  Icon,
  Input,
  Select,
} from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermission } from '@/features/auth/usePermission';
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
import { paths } from '@/routes/paths';
import { fetchTerms, selectCurrentTerm, selectTerms } from '@/features/terms/termsSlice';
import type { Student, Term } from '@/types/domain';
import { cn } from '@/utils/cn';
import { digitsOnly, formatDate, formatMoney, paidPercent, todayIso } from '@/utils/format';
import { isValidTckn } from '@/utils/validation';
import { FinanceFields } from './components/FinanceFields';
import { ContactFields, EducationFields, PersonalFields } from './components/StudentFormKit';
import {
  FORM_GRID,
  useFormDraft,
  type EducationCoreForm,
  type FieldUpdater,
  type PersonCoreForm,
} from './components/useStepForm';
import {
  FINANCE_FORM_DEFAULTS,
  financeFromForm,
  resolvePlan,
  type FinanceCoreForm,
} from './financePlan';
import { fetchStudent, selectStudentByIdentifier } from './studentsSlice';
import {
  studentsApi,
  type Enrollment,
  type Installment,
  type InstallmentStatus,
  type Payment,
  type StudentUpdateInput,
} from './studentsApi';
import { useStudentActions } from './useStudentActions';

const INSTALLMENT_BADGE: Record<InstallmentStatus, { kind: BadgeKind; label: string }> = {
  paid: { kind: 'ok', label: 'Ödendi' },
  partial: { kind: 'accent', label: 'Kısmi' },
  overdue: { kind: 'warn', label: 'Gecikmiş' },
  pending: { kind: 'neutral', label: 'Bekliyor' },
};

/**
 * Dedicated student page at `/students/:tckn`. Replaces the old detail modal:
 * staff review and approve, edit, record payments and reject from here. The
 * outer component handles loading the record (supporting direct links and
 * refreshes); the inner view holds the form state for a guaranteed student.
 */
export function StudentDetailPage() {
  const { tckn } = useParams<{ tckn: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const student = useAppSelector((state) => selectStudentByIdentifier(state, tckn));
  const [loading, setLoading] = useState(!student);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    void dispatch(fetchTerms());
  }, [dispatch]);

  useEffect(() => {
    if (!tckn) return;
    let active = true;
    setNotFound(false);
    dispatch(fetchStudent(tckn))
      .then((result) => {
        if (active && fetchStudent.rejected.match(result)) setNotFound(true);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [dispatch, tckn]);

  if (student) return <StudentDetailView key={student.id} student={student} />;

  return (
    <div className="anim-fade-up mx-auto flex max-w-[1100px] flex-col gap-4">
      <BackButton onClick={() => navigate(paths.students)} />
      <div className="card p-12 text-center text-ink-3">
        {loading && !notFound ? 'Yükleniyor…' : 'Öğrenci bulunamadı.'}
      </div>
    </div>
  );
}

/** Education + finance choices made while approving a pending student. */
interface ApprovalDraft extends FinanceCoreForm {
  lang: string;
  level: string;
  course: string;
  termId: string;
}

/** Personal + education details, shared by approval review and active editing. */
type InfoDraft = PersonCoreForm & EducationCoreForm;

/** Full edit of an already-active student: profile, contact, course and fee. */
type EditDraft = InfoDraft & {
  lang: string;
  level: string;
  course: string;
  plan: string;
  fee: string;
  termId: string;
};

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
    termId: s.termId ? String(s.termId) : '',
  };
};

const toEditDraft = (s: Student): EditDraft => ({
  ...toInfoDraft(s),
  lang: s.lang,
  level: s.level,
  course: s.course,
  plan: s.plan,
  fee: String(s.fee),
  termId: s.termId ? String(s.termId) : '',
});

/** Education + finance for enrolling the student into another term. */
type NewEnrollDraft = FinanceCoreForm & {
  lang: string;
  level: string;
  course: string;
  termId: string;
};

const toNewEnrollDraft = (s: Student, termId: string): NewEnrollDraft => ({
  ...FINANCE_FORM_DEFAULTS,
  lang: s.lang,
  level: s.level,
  course: s.course,
  termId,
});

function StudentDetailView({ student }: { student: Student }) {
  const navigate = useNavigate();
  const isPending = student.status === 'pending';
  const { has } = usePermission();
  const canWriteStudents = has(PERMISSIONS.studentsWrite);
  const canReadFinance = has(PERMISSIONS.financeRead);
  const canWriteFinance = has(PERMISSIONS.financeWrite);
  const terms = useAppSelector(selectTerms);
  const currentTerm = useAppSelector(selectCurrentTerm);
  const { approve, reject, update, pay, enroll } = useStudentActions();

  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [savingEnroll, setSavingEnroll] = useState(false);
  const [history, setHistory] = useState<Enrollment[]>([]);

  const { form: draft, setForm: setDraft, update: updateEdit, patch: patchEdit } =
    useFormDraft<EditDraft>(toEditDraft(student));
  const { form: approval, update: updateApproval, patch: setApprovalField } =
    useFormDraft<ApprovalDraft>(toApprovalDraft(student));
  const { form: info, update: updateInfo, patch: patchInfo } = useFormDraft<InfoDraft>(
    toInfoDraft(student),
  );
  const { form: payForm, patch: patchPay, update: updatePay } = useFormDraft({
    amount: '',
    method: PAY_METHODS[0] as string,
    paidAt: todayIso(),
    note: '',
  });
  const {
    form: newEnroll,
    update: updateNewEnroll,
    patch: patchNewEnroll,
    setForm: setNewEnroll,
  } = useFormDraft<NewEnrollDraft>(toNewEnrollDraft(student, ''));

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const reloadSchedule = async () => {
    const [ins, pays] = await Promise.all([
      studentsApi.installments(student.id),
      studentsApi.payments(student.id),
    ]);
    setInstallments(ins);
    setPayments(pays);
  };

  const reloadHistory = async () => {
    setHistory(await studentsApi.enrollments(student.id));
  };

  useEffect(() => {
    if (student.status === 'pending' || !canReadFinance) return;
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
  }, [student.id, student.status, canReadFinance]);

  useEffect(() => {
    if (student.status === 'pending') return;
    let active = true;
    studentsApi
      .enrollments(student.id)
      .then((list) => active && setHistory(list))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [student.id, student.status]);

  // Default a pending student's term to the current one, once terms load.
  useEffect(() => {
    if (isPending && !approval.termId && !student.termId && currentTerm) {
      setApprovalField({ termId: String(currentTerm.id) });
    }
  }, [currentTerm, isPending, student.termId, approval.termId, setApprovalField]);

  const fin = financeFromForm(approval);
  const tcknError = info.tckn && !isValidTckn(info.tckn) ? 'Geçersiz T.C. Kimlik No' : undefined;
  const canApprove = fin.termFee > 0 && !tcknError;
  const editTcknError =
    draft.tckn && !isValidTckn(draft.tckn) ? 'Geçersiz T.C. Kimlik No' : undefined;
  const status = STATUS[student.status];

  const startEdit = () => {
    setDraft(toEditDraft(student));
    setPaying(false);
    setEditing(true);
  };

  const startPay = () => {
    patchPay({ amount: '', note: '', paidAt: todayIso() });
    setEditing(false);
    setEnrolling(false);
    setPaying(true);
  };

  const startEnroll = () => {
    setNewEnroll(toNewEnrollDraft(student, currentTerm ? String(currentTerm.id) : ''));
    setEditing(false);
    setPaying(false);
    setEnrolling(true);
  };

  /** Open the payment panel pre-filled with an installment's remaining amount. */
  const collectInstallment = (item: Installment) => {
    const remaining = Math.max(0, item.amount - item.paidAmount);
    patchPay({
      amount: remaining > 0 ? String(remaining) : '',
      note: `${item.sequence}. taksit`,
      paidAt: todayIso(),
    });
    setEditing(false);
    setPaying(true);
  };

  const saveEdit = async () => {
    if (editTcknError) return;
    const patch: StudentUpdateInput = {
      name: draft.name.trim() || student.name,
      email: draft.email,
      phone: draft.phone,
      tckn: draft.tckn || null,
      birthDate: draft.birth || null,
      gender: draft.gender || null,
      city: draft.city || null,
      address: draft.addr || null,
      educationLevel: draft.eduLevel || null,
      school: draft.school || null,
      department: draft.department || null,
      grade: draft.grade || null,
      contactName: draft.cName || null,
      contactRelation: draft.cName ? draft.cRelation : null,
      contactPhone: draft.cPhone || null,
      lang: draft.lang,
      level: draft.level,
      course: draft.course,
      plan: draft.plan,
      fee: Number(draft.fee) || 0,
      termId: Number(draft.termId) || null,
    };
    setSaving(true);
    const ok = await update(student.id, patch);
    setSaving(false);
    if (ok) setEditing(false);
  };

  const submitApproval = async () => {
    const plan = resolvePlan(approval.plan, fin.terms);
    // Peşin with no explicit opening payment means paid in full; a custom plan
    // has no fixed next date unless one was picked.
    const paid = approval.plan === 'Peşin' && !fin.paidNow ? fin.net : fin.paidNow;
    const next =
      approval.plan === 'Peşin' || paid >= fin.net
        ? null
        : approval.firstDate || (approval.plan === CUSTOM_PLAN ? null : student.start);
    setSaving(true);
    // Approval persists the reviewer's edits to both info and finance first.
    const ok = await update(student.id, {
      name: info.name.trim() || student.name,
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
      termId: Number(approval.termId) || null,
    });
    if (ok) await approve(student.id);
    setSaving(false);
  };

  const submitPayment = async () => {
    const amount = Number(payForm.amount) || 0;
    if (amount <= 0) return;
    setSavingPay(true);
    const updated = await pay(student.id, {
      amount,
      paidAt: payForm.paidAt,
      method: payForm.method,
      note: payForm.note || undefined,
    });
    setSavingPay(false);
    if (updated) {
      setPaying(false);
      if (canReadFinance) await reloadSchedule();
    }
  };

  const finNew = financeFromForm(newEnroll);
  const submitNewEnrollment = async () => {
    if (finNew.termFee <= 0) return;
    const plan = resolvePlan(newEnroll.plan, finNew.terms);
    const paid = newEnroll.plan === 'Peşin' && !finNew.paidNow ? finNew.net : finNew.paidNow;
    const chosenTerm = terms.find((term) => String(term.id) === newEnroll.termId);
    const start = chosenTerm?.start || todayIso();
    const next =
      newEnroll.plan === 'Peşin' || paid >= finNew.net
        ? null
        : newEnroll.firstDate || (newEnroll.plan === CUSTOM_PLAN ? null : start);
    setSavingEnroll(true);
    const updated = await enroll(student.id, {
      termId: Number(newEnroll.termId) || null,
      lang: newEnroll.lang,
      level: newEnroll.level,
      course: newEnroll.course,
      plan,
      fee: finNew.net,
      paid,
      terms: finNew.terms,
      note: newEnroll.note.trim() || null,
      next,
      start,
      payMethod: newEnroll.payMethod,
    });
    setSavingEnroll(false);
    if (updated) {
      setEnrolling(false);
      await reloadHistory();
    }
  };

  const doReject = () => {
    reject(student.id);
    navigate(paths.students);
  };

  return (
    <div className="anim-fade-up mx-auto flex max-w-[1100px] flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <BackButton onClick={() => navigate(paths.students)} />
        <Avatar name={student.name} size={48} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 truncate text-[20px] font-bold tracking-[-0.01em]">{student.name}</h1>
            <Badge kind={status.kind} dot>
              {status.label}
            </Badge>
            {student.source === 'davet' && (
              <Badge kind="accent">
                <Icon name="link" size={11} />
                Davet ile
              </Badge>
            )}
            {student.source === 'manuel' && (
              <Badge kind="neutral">
                <Icon name="edit" size={11} />
                Manuel
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-ink-3">
            <span>{student.id}</span>
            {student.tckn && <span>· TCKN {student.tckn}</span>}
          </div>
        </div>
        {!isPending && !editing && !paying && !enrolling && (
          <div className="flex flex-wrap items-center gap-2">
            {canWriteStudents && (
              <Button variant="ghost" onClick={startEdit}>
                <Icon name="edit" size={17} />
                Düzenle
              </Button>
            )}
            {canWriteFinance && (
              <Button variant="soft" onClick={startPay}>
                <Icon name="wallet" size={17} />
                Ödeme Al
              </Button>
            )}
            {canWriteStudents && (
              <Button variant="primary" onClick={startEnroll}>
                <Icon name="plus" size={17} />
                Yeni Dönem Kaydı
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <main className="flex min-w-0 flex-col gap-4">
          {isPending ? (
            <PendingPanels
              student={student}
              terms={terms}
              approval={approval}
              updateApproval={updateApproval}
              setApprovalField={setApprovalField}
              info={info}
              updateInfo={updateInfo}
              patchInfo={patchInfo}
              tcknError={tcknError}
              canWriteStudents={canWriteStudents}
              canApprove={canApprove}
              saving={saving}
              fin={fin}
              rejecting={rejecting}
              setRejecting={setRejecting}
              onApprove={submitApproval}
              onReject={doReject}
            />
          ) : editing ? (
            <EditPanel
              draft={draft}
              terms={terms}
              update={updateEdit}
              patch={patchEdit}
              tcknError={editTcknError}
              saving={saving}
              onCancel={() => setEditing(false)}
              onSave={saveEdit}
            />
          ) : paying ? (
            <PaymentPanel
              form={payForm}
              update={updatePay}
              patch={patchPay}
              saving={savingPay}
              onCancel={() => setPaying(false)}
              onSubmit={submitPayment}
            />
          ) : enrolling ? (
            <NewEnrollmentPanel
              terms={terms}
              draft={newEnroll}
              update={updateNewEnroll}
              patch={patchNewEnroll}
              fin={finNew}
              saving={savingEnroll}
              onCancel={() => setEnrolling(false)}
              onSubmit={submitNewEnrollment}
            />
          ) : (
            <>
              <Section icon="graduation" title="Eğitim">
                <InfoRow label="Dil" value={student.lang} />
                <InfoRow label="Seviye" value={student.level} />
                <InfoRow label="Kur / Program" value={student.course} />
                {student.termName && <InfoRow label="Dönem" value={student.termName} />}
                {(student.terms ?? 1) > 1 && (
                  <InfoRow label="Kur Sayısı" value={`${student.terms} Kur`} />
                )}
                <InfoRow label="Başlangıç" value={formatDate(student.start)} />
              </Section>
              <Section icon="phone" title="İletişim">
                <InfoRow label="E-posta" value={student.email} />
                <InfoRow label="Telefon" value={student.phone} mono />
                <ContactRows student={student} />
              </Section>
              <ProfileSection student={student} />
              {canReadFinance && (
                <FinanceSection
                  student={student}
                  installments={installments}
                  payments={payments}
                  canWriteFinance={canWriteFinance}
                  onCollect={collectInstallment}
                />
              )}
              <EnrollmentHistory items={history} />
            </>
          )}
        </main>

        <aside className="flex flex-col gap-4">
          <QuickFacts student={student} />
          {!isPending && <FinanceSnapshot student={student} />}
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Pending approval ---------------- */

interface PendingPanelsProps {
  student: Student;
  terms: Term[];
  approval: ApprovalDraft;
  updateApproval: FieldUpdater<ApprovalDraft>;
  setApprovalField: (partial: Partial<ApprovalDraft>) => void;
  info: InfoDraft;
  updateInfo: FieldUpdater<InfoDraft>;
  patchInfo: (partial: Partial<InfoDraft>) => void;
  tcknError?: string;
  canWriteStudents: boolean;
  canApprove: boolean;
  saving: boolean;
  fin: ReturnType<typeof financeFromForm>;
  rejecting: boolean;
  setRejecting: (value: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
}

function PendingPanels({
  student,
  terms,
  approval,
  updateApproval,
  setApprovalField,
  info,
  updateInfo,
  patchInfo,
  tcknError,
  canWriteStudents,
  canApprove,
  saving,
  fin,
  rejecting,
  setRejecting,
  onApprove,
  onReject,
}: PendingPanelsProps) {
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
            <OptionSelect
              value={approval.lang}
              onChange={(v) => setApprovalField({ lang: v })}
              options={LANGUAGES}
            />
          </Field>
          <Field label="Seviye" icon="trend">
            <OptionSelect
              value={approval.level}
              onChange={(v) => setApprovalField({ level: v })}
              options={LEVELS}
            />
          </Field>
          <Field label="Kur / Program" icon="book">
            <OptionSelect
              value={approval.course}
              onChange={(v) => setApprovalField({ course: v })}
              options={COURSES}
            />
          </Field>
          <Field label="Kur Sayısı" icon="layers" hint="Kayıt kapsamındaki kur adedi">
            <Select value={approval.terms} onChange={updateApproval('terms')}>
              {TERM_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count} Kur
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dönem" icon="calendar" hint="Opsiyonel — varsayılan güncel dönem">
            <TermSelect
              terms={terms}
              value={approval.termId}
              onChange={(v) => setApprovalField({ termId: v })}
            />
          </Field>
        </div>
      </Section>

      <Section icon="wallet" title="Finans & Ödeme Planı" subtitle="Onaydan önce belirleyin">
        <FinanceFields
          form={approval}
          update={updateApproval}
          patch={setApprovalField}
          startDate={student.start}
        />
      </Section>

      <Section icon="id" title="Öğrenci Bilgileri" subtitle="Gerekirse düzeltip onayla">
        <div className="flex flex-col gap-4 pt-1">
          <PersonalFields form={info} update={updateInfo} patch={patchInfo} tcknError={tcknError} />
          <EducationFields form={info} update={updateInfo} />
          <ContactFields form={info} update={updateInfo} />
        </div>
      </Section>

      {/* Approval actions */}
      <div className="card sticky bottom-4 z-10 p-4">
        {!canWriteStudents ? (
          <span className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-ink-3">
            <Icon name="lock" size={14} />
            Bu kaydı onaylama yetkiniz yok.
          </span>
        ) : !rejecting ? (
          <div className="flex flex-col gap-2">
            {!canApprove && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-warn-ink">
                <Icon name="info" size={14} />
                {fin.termFee <= 0
                  ? 'Onay için kur ücreti girilmeli.'
                  : 'T.C. Kimlik No geçersiz — Öğrenci Bilgileri’nden düzeltin.'}
              </span>
            )}
            <div className="flex items-center gap-3">
              <Button variant="ghost" block onClick={() => setRejecting(true)} disabled={saving}>
                <Icon name="x" size={17} />
                Reddet
              </Button>
              <Button variant="primary" block onClick={onApprove} disabled={saving || !canApprove}>
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
              <Button block onClick={onReject} className="bg-accent text-white">
                <Icon name="xCircle" size={17} />
                Evet, reddet
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- Active: edit ---------------- */

interface EditPanelProps {
  draft: EditDraft;
  terms: Term[];
  update: FieldUpdater<EditDraft>;
  patch: (partial: Partial<EditDraft>) => void;
  tcknError?: string;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

function EditPanel({
  draft,
  terms,
  update,
  patch,
  tcknError,
  saving,
  onCancel,
  onSave,
}: EditPanelProps) {
  return (
    <>
      <Section icon="user" title="Kişisel Bilgiler">
        <div className="pt-1">
          <PersonalFields form={draft} update={update} patch={patch} tcknError={tcknError} />
        </div>
      </Section>
      <Section icon="graduation" title="Eğitim Bilgileri">
        <div className="pt-1">
          <EducationFields form={draft} update={update} />
        </div>
      </Section>
      <Section icon="phone" title="İletişim">
        <div className="pt-1">
          <ContactFields form={draft} update={update} />
        </div>
      </Section>
      <Section icon="wallet" title="Kayıt & Finans">
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
          <Field label="Ödeme Planı" icon="wallet">
            <OptionSelect value={draft.plan} onChange={(v) => patch({ plan: v })} options={PAYMENT_PLANS} />
          </Field>
          <Field label="Kayıt Ücreti (₺)">
            <Input
              value={draft.fee}
              onChange={(e) => patch({ fee: digitsOnly(e.target.value) })}
              inputMode="numeric"
              className="font-mono"
            />
          </Field>
          <Field label="Dönem" icon="calendar">
            <TermSelect terms={terms} value={draft.termId} onChange={(v) => patch({ termId: v })} />
          </Field>
        </div>
      </Section>
      <div className="flex items-center gap-3">
        <Button variant="ghost" block disabled={saving} onClick={onCancel}>
          Vazgeç
        </Button>
        <Button variant="primary" block onClick={onSave} disabled={saving || !!tcknError}>
          <Icon name="check" size={17} />
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </>
  );
}

/* ---------------- Active: record payment ---------------- */

interface PaymentPanelProps {
  form: { amount: string; method: string; paidAt: string; note: string };
  update: FieldUpdater<{ amount: string; method: string; paidAt: string; note: string }>;
  patch: (partial: Partial<{ amount: string; method: string; paidAt: string; note: string }>) => void;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function PaymentPanel({ form, update, patch, saving, onCancel, onSubmit }: PaymentPanelProps) {
  return (
    <Section icon="wallet" title="Ödeme Al">
      <div className="flex flex-col gap-3 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tutar (₺)">
            <Input
              value={form.amount}
              onChange={(e) => patch({ amount: digitsOnly(e.target.value) })}
              inputMode="numeric"
              className="font-mono"
              placeholder="0"
            />
          </Field>
          <Field label="Tarih">
            <DatePicker
              value={form.paidAt}
              onChange={(iso) => patch({ paidAt: iso })}
              placeholder="gg.aa.yyyy"
            />
          </Field>
        </div>
        <Field label="Yöntem">
          <Select value={form.method} onChange={update('method')}>
            {PAY_METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </Select>
        </Field>
        <Field label="Not (opsiyonel)">
          <Input value={form.note} onChange={update('note')} placeholder="Açıklama" />
        </Field>
        <div className="flex items-center gap-3">
          <Button variant="ghost" block disabled={saving} onClick={onCancel}>
            Vazgeç
          </Button>
          <Button variant="primary" block disabled={saving || !form.amount} onClick={onSubmit}>
            <Icon name="wallet" size={17} />
            {saving ? 'Kaydediliyor…' : 'Ödemeyi Kaydet'}
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- New term enrollment ---------------- */

interface NewEnrollmentPanelProps {
  terms: Term[];
  draft: NewEnrollDraft;
  update: FieldUpdater<NewEnrollDraft>;
  patch: (partial: Partial<NewEnrollDraft>) => void;
  fin: ReturnType<typeof financeFromForm>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function NewEnrollmentPanel({
  terms,
  draft,
  update,
  patch,
  fin,
  saving,
  onCancel,
  onSubmit,
}: NewEnrollmentPanelProps) {
  const chosenTerm = terms.find((term) => String(term.id) === draft.termId);
  const canSubmit = fin.termFee > 0;
  return (
    <>
      <p className="m-0 flex items-start gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-[13px] leading-[1.5] text-ink-2">
        <Icon name="info" size={18} className="mt-px shrink-0 text-accent" />
        <span>
          Bu öğrenciyi seçtiğin döneme yeni bir kayıtla ekliyorsun; önceki kayıtları korunur.
        </span>
      </p>
      <Section icon="graduation" title="Eğitim & Dönem">
        <div className={FORM_GRID}>
          <Field label="Dönem" icon="calendar">
            <TermSelect terms={terms} value={draft.termId} onChange={(v) => patch({ termId: v })} />
          </Field>
          <Field label="Kur Sayısı" icon="layers">
            <Select value={draft.terms} onChange={update('terms')}>
              {TERM_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count} Kur
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dil" icon="globe">
            <OptionSelect value={draft.lang} onChange={(v) => patch({ lang: v })} options={LANGUAGES} />
          </Field>
          <Field label="Seviye" icon="trend">
            <OptionSelect value={draft.level} onChange={(v) => patch({ level: v })} options={LEVELS} />
          </Field>
          <Field label="Kur / Program" icon="book">
            <OptionSelect value={draft.course} onChange={(v) => patch({ course: v })} options={COURSES} />
          </Field>
        </div>
      </Section>
      <Section icon="wallet" title="Finans & Ödeme Planı" subtitle="Kayıt için belirleyin">
        <FinanceFields form={draft} update={update} patch={patch} startDate={chosenTerm?.start} />
      </Section>
      <div className="flex flex-col gap-2">
        {!canSubmit && (
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-warn-ink">
            <Icon name="info" size={14} />
            Kayıt için kur ücreti girilmeli.
          </span>
        )}
        <div className="flex items-center gap-3">
          <Button variant="ghost" block disabled={saving} onClick={onCancel}>
            Vazgeç
          </Button>
          <Button variant="primary" block disabled={saving || !canSubmit} onClick={onSubmit}>
            <Icon name="check" size={17} />
            {saving ? 'Kaydediliyor…' : 'Döneme Kaydet'}
          </Button>
        </div>
      </div>
    </>
  );
}

function EnrollmentHistory({ items }: { items: Enrollment[] }) {
  if (items.length === 0) return null;
  const currentId = items.reduce((max, item) => Math.max(max, item.id), 0);
  return (
    <Section icon="layers" title="Dönem Kayıtları" subtitle="Öğrencinin tüm dönem kayıtları">
      {items.map((item) => {
        const badge = STATUS[item.status];
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2.5 last:border-0"
          >
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
              {item.termName ?? 'Dönem atanmadı'}
            </span>
            <span className="text-[12.5px] text-ink-3">
              {item.lang} · {item.level.split(' — ')[0]} · {item.course}
            </span>
            <Badge kind={badge.kind} dot>
              {badge.label}
            </Badge>
            <span className="font-mono text-[12.5px] tabular-nums">
              {formatMoney(item.paid)} / {formatMoney(item.fee)}
            </span>
            {item.id === currentId && <Badge kind="accent">Güncel</Badge>}
          </div>
        );
      })}
    </Section>
  );
}

/* ---------------- Read-only presentation ---------------- */

function FinanceSection({
  student,
  installments,
  payments,
  canWriteFinance,
  onCollect,
}: {
  student: Student;
  installments: Installment[];
  payments: Payment[];
  canWriteFinance: boolean;
  onCollect: (item: Installment) => void;
}) {
  const pct = paidPercent(student.paid, student.fee);
  return (
    <Section icon="wallet" title="Finans">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] text-ink-3">Kayıt Ücreti</span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatMoney(student.fee)}
        </span>
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
        <span
          className={cn(
            'font-mono text-sm font-bold tabular-nums',
            pct === 100 ? 'text-ok' : 'text-accent',
          )}
        >
          {formatMoney(student.paid)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-bg-2">
        <div
          className={cn(
            'h-full rounded transition-[width] duration-500',
            pct === 100 ? 'bg-ok' : 'bg-accent',
          )}
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
                className="flex items-center justify-between gap-2 border-b border-line py-[7px] text-[13px] last:border-0"
              >
                <span className="text-ink-3">
                  #{item.sequence} · {formatDate(item.dueDate)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono tabular-nums">{formatMoney(item.amount)}</span>
                  <Badge kind={badge.kind}>{badge.label}</Badge>
                  {canWriteFinance && item.status !== 'paid' && (
                    <Button
                      variant="quiet"
                      onClick={() => onCollect(item)}
                      className="px-2 py-1 text-[12px]"
                    >
                      Tahsil et
                    </Button>
                  )}
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

/* ---------------- Aside cards ---------------- */

function QuickFacts({ student }: { student: Student }) {
  return (
    <Section icon="info" title="Hızlı Bilgi">
      <InfoRow label="Öğrenci No" value={student.id} mono />
      {student.tckn && <InfoRow label="T.C. Kimlik No" value={student.tckn} mono />}
      <InfoRow label="Kayıt Tarihi" value={formatDate(student.joined)} />
      {student.approvedByName && (
        <InfoRow
          label="Onaylayan"
          value={`${student.approvedByName}${
            student.approvedAt ? ` · ${formatDate(student.approvedAt)}` : ''
          }`}
        />
      )}
    </Section>
  );
}

function FinanceSnapshot({ student }: { student: Student }) {
  const pct = paidPercent(student.paid, student.fee);
  return (
    <div className="card p-[18px]">
      <span className="kicker mb-3 block">FİNANS DURUMU</span>
      <div className="mb-1 flex items-end justify-between">
        <span
          className={cn(
            'font-mono text-[22px] font-bold tabular-nums',
            pct === 100 ? 'text-ok' : 'text-accent',
          )}
        >
          {formatMoney(student.paid)}
        </span>
        <span className="font-mono text-[12px] text-ink-3">/ {formatMoney(student.fee)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded bg-bg-2">
        <div
          className={cn(
            'h-full rounded transition-[width] duration-500',
            pct === 100 ? 'bg-ok' : 'bg-accent',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-ink-3">
        <span>Ödenen · %{pct}</span>
        {student.next && <span>Sonraki: {formatDate(student.next)}</span>}
      </div>
    </div>
  );
}

/* ---------------- Small shared pieces ---------------- */

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="quiet"
      onClick={onClick}
      className="px-2 py-1.5 text-[13px] text-ink-3"
      aria-label="Öğrenci listesine dön"
    >
      <Icon name="chevL" size={18} />
      Öğrenciler
    </Button>
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

function TermSelect({
  terms,
  value,
  onChange,
}: {
  terms: Term[];
  value: string;
  onChange: (termId: string) => void;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Dönem seçilmedi</option>
      {terms.map((term) => (
        <option key={term.id} value={term.id}>
          {term.name}
          {term.current ? ' · güncel' : ''}
        </option>
      ))}
    </Select>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-[9px] last:border-0">
      <span className="shrink-0 text-[13px] text-ink-3">{label}</span>
      <span
        className={cn('text-right text-[13.5px] font-semibold', mono && 'font-mono tabular-nums')}
      >
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
