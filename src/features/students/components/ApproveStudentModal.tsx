import { Avatar, Badge, Button, Icon, Modal } from '@/components/ui';
import { formatDate, formatMoney, levelCode } from '@/utils/format';
import type { Student } from '@/types/domain';

interface ApproveStudentModalProps {
  /** The student to approve; the modal is open while this is non-null. */
  student: Student | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[13px] text-ink-3">{label}</span>
      <span className={strong ? 'text-[13.5px] font-semibold' : 'text-[13.5px] text-ink-2'}>
        {value}
      </span>
    </div>
  );
}

/** Confirmation preview shown before a pending enrollment is approved. */
export function ApproveStudentModal({
  student,
  submitting,
  onClose,
  onConfirm,
}: ApproveStudentModalProps) {
  if (!student) return null;
  const remaining = Math.max(student.fee - student.paid, 0);

  return (
    <Modal open={student !== null} onClose={onClose} width={460}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">Kaydı Onayla</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Onaylandığında kayıt aktifleşir ve ödeme planı oluşturulur. Lütfen önce
            bilgileri kontrol edin.
          </p>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-token-sm border border-line bg-surface-2 p-3.5">
        <Avatar name={student.name} size={40} />
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14.5px] font-semibold">{student.name}</span>
            {student.source === 'davet' && (
              <Badge kind="accent">
                <Icon name="link" size={11} />
                davet
              </Badge>
            )}
          </div>
          <span className="font-mono text-[11px] text-ink-3">{student.id}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col divide-y divide-line">
        <Row
          label="Kur"
          value={`${student.lang} · ${levelCode(student.level)} · ${student.course}`}
        />
        <Row label="Ödeme Planı" value={student.plan} />
        {(student.terms ?? 1) > 1 && <Row label="Kur Sayısı" value={`${student.terms} kur`} />}
        <Row label="Kur Ücreti" value={formatMoney(student.fee)} />
        <Row label="Alınan" value={formatMoney(student.paid)} />
        <Row label="Kalan" value={formatMoney(remaining)} strong />
        {student.next && <Row label="Sonraki Ödeme" value={formatDate(student.next)} />}
      </div>

      {student.note && (
        <p className="mt-3 rounded-token-sm bg-surface-2 px-3.5 py-2.5 text-[12.5px] text-ink-2">
          {student.note}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={submitting}>
          <Icon name="check" size={17} />
          {submitting ? 'Onaylanıyor…' : 'Onayla'}
        </Button>
      </div>
    </Modal>
  );
}
