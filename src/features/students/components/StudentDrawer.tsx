import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Badge, Button, Icon, Input, Select } from '@/components/ui';
import { COURSES, LANGUAGES, LEVELS, PAYMENT_PLANS } from '@/constants/options';
import { STATUS } from '@/constants/status';
import type { Student } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatDate, formatMoney, paidPercent } from '@/utils/format';
import type { StudentUpdateInput } from '../studentsApi';

interface StudentDrawerProps {
  student: Student;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdate: (id: string, patch: StudentUpdateInput) => Promise<boolean>;
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

/** Slide-over with student details, inline editing and approve/reject actions. */
export function StudentDrawer({ student, onClose, onApprove, onReject, onUpdate }: StudentDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [current, setCurrent] = useState<Student>(student);
  const [editing, setEditing] = useState(student.status === 'pending');
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(student));

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const status = STATUS[current.status];
  const pct = paidPercent(current.paid, current.fee);
  const isPending = current.status === 'pending';

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
      close();
    }
  };

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        onClick={close}
        className="absolute inset-0 bg-[hsl(20_30%_8%/0.5)] backdrop-blur-[3px]"
        style={{ animation: closing ? 'fadeIn .25s reverse' : 'fadeIn .25s ease' }}
      />
      <div
        className="absolute top-0 right-0 bottom-0 flex w-[520px] max-w-full flex-col bg-bg shadow-float"
        style={{
          animation: closing
            ? 'slideInRight .25s reverse forwards'
            : 'slideInRight .3s cubic-bezier(.2,.8,.3,1)',
        }}
      >
        {/* header */}
        <div className="border-b border-line bg-surface px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="kicker">ÖĞRENCİ KAYDI · {current.id}</span>
            <Button variant="quiet" onClick={close} className="p-2" aria-label="Kapat">
              <Icon name="x" size={20} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={current.name} size={56} />
            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <h2 className="m-0 text-[21px] font-bold tracking-[-0.01em]">{current.name}</h2>
              <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {isPending && (
            <div className="anim-fade-in flex items-center gap-3 rounded-xl border border-[hsl(38_60%_80%/0.5)] bg-warn-soft p-3.5">
              <Icon name="info" size={20} className="shrink-0 text-[hsl(38_80%_42%)]" />
              <span className="text-[13px] leading-[1.45] text-ink-2">
                Bu öğrenci hoşgeldin formunu doldurdu. Seviye ve ücreti belirleyip{' '}
                <strong>onaylayın</strong>.
              </span>
            </div>
          )}

          <InfoBlock icon="user" title="Kişisel & İletişim">
            {editing ? (
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
            ) : (
              <>
                <InfoRow label="E-posta" value={current.email} />
                <InfoRow label="Telefon" value={current.phone} mono />
                <InfoRow label="Kayıt Tarihi" value={formatDate(current.joined)} />
              </>
            )}
          </InfoBlock>

          <InfoBlock icon="graduation" title="Eğitim">
            {editing ? (
              <div className="flex flex-col gap-3 pt-1">
                <EditField label="Dil">
                  <OptionSelect value={draft.lang} onChange={(v) => set('lang', v)} options={LANGUAGES} />
                </EditField>
                <EditField label="Seviye">
                  <OptionSelect value={draft.level} onChange={(v) => set('level', v)} options={LEVELS} />
                </EditField>
                <EditField label="Kur / Program">
                  <OptionSelect value={draft.course} onChange={(v) => set('course', v)} options={COURSES} />
                </EditField>
              </div>
            ) : (
              <>
                <InfoRow label="Dil" value={current.lang} />
                <InfoRow label="Seviye" value={current.level} />
                <InfoRow label="Kur / Program" value={current.course} />
                <InfoRow label="Başlangıç" value={formatDate(current.start)} />
              </>
            )}
          </InfoBlock>

          <InfoBlock icon="wallet" title="Finans">
            {editing ? (
              <div className="flex flex-col gap-3 pt-1">
                <EditField label="Kayıt Ücreti (₺)">
                  <Input
                    value={draft.fee}
                    onChange={(e) => set('fee', e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    className="font-mono"
                  />
                </EditField>
                <EditField label="Ödeme Planı">
                  <OptionSelect value={draft.plan} onChange={(v) => set('plan', v)} options={PAYMENT_PLANS} />
                </EditField>
              </div>
            ) : (
              <>
                <InfoRow label="Kayıt Ücreti" value={formatMoney(current.fee)} mono />
                <InfoRow label="Ödeme Planı" value={current.plan} />
                <InfoRow label="Ödenen" value={formatMoney(current.paid)} mono />
                {current.next && <InfoRow label="Sonraki Ödeme" value={formatDate(current.next)} />}
                <div className="flex flex-col gap-2 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] text-ink-3">Tahsilat durumu</span>
                    <span className={cn('font-mono text-xs font-bold', pct === 100 ? 'text-ok' : 'text-accent')}>
                      %{pct}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-bg-2">
                    <div
                      className={cn('h-full rounded transition-[width] duration-500', pct === 100 ? 'bg-ok' : 'bg-accent')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </InfoBlock>
        </div>

        {/* footer */}
        {isPending ? (
          <div className="border-t border-line bg-surface px-6 py-4">
            {!rejecting ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" block onClick={() => setRejecting(true)} disabled={saving}>
                  <Icon name="x" size={17} />
                  Reddet
                </Button>
                <Button variant="primary" block onClick={approve} disabled={saving}>
                  <Icon name="check" size={18} />
                  {saving ? 'Kaydediliyor…' : 'Onayla'}
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
                      close();
                    }}
                    className="bg-accent text-white"
                  >
                    <Icon name="xCircle" size={17} />
                    Evet, reddet
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-line bg-surface px-6 py-4">
            {editing ? (
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
            ) : (
              <Button variant="ghost" block onClick={() => setEditing(true)}>
                <Icon name="edit" size={17} />
                Düzenle
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
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
    <div className="flex items-center justify-between gap-4 border-b border-line py-[9px]">
      <span className="shrink-0 text-[13px] text-ink-3">{label}</span>
      <span className={cn('text-right text-[13.5px] font-semibold', mono && 'font-mono tabular-nums')}>
        {value || '—'}
      </span>
    </div>
  );
}

function InfoBlock({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="card p-[18px]">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon name={icon} size={17} className="text-accent" />
        <h4 className="m-0 text-[14.5px] font-bold">{title}</h4>
      </div>
      {children}
    </div>
  );
}
