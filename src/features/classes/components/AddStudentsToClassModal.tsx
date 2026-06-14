import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Icon, Input, Modal, useToast } from '@/components/ui';
import { termsApi, type TermStudent } from '@/features/terms/termsApi';
import type { ApiError } from '@/api/axiosClient';
import { cn } from '@/utils/cn';
import { levelCode } from '@/utils/format';
import type { ClassStudent } from '@/types/domain';
import { classesApi } from '../classesApi';

interface AddStudentsToClassModalProps {
  open: boolean;
  onClose: () => void;
  classId: number;
  termId: number;
  /** Codes already in this class, hidden from the picker. */
  enrolledCodes: Set<string>;
  onAssigned: (roster: ClassStudent[]) => void;
}

/** Assign active students of the class's term to the class. */
export function AddStudentsToClassModal({
  open,
  onClose,
  classId,
  termId,
  enrolledCodes,
  onAssigned,
}: AddStudentsToClassModalProps) {
  const toast = useToast();
  const [termStudents, setTermStudents] = useState<TermStudent[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    termsApi
      .students(termId)
      .then((list) => active && setTermStudents(list))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, termId]);

  const candidates = useMemo(() => {
    const text = query.trim().toLowerCase();
    return termStudents
      // Only active students not already in this class can be added.
      .filter((s) => s.status === 'active' && !enrolledCodes.has(s.studentId))
      .filter((s) =>
        text ? `${s.name}${s.studentId}`.toLowerCase().includes(text) : true,
      );
  }, [termStudents, enrolledCodes, query]);

  const toggle = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const canSubmit = selected.size > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const roster = await classesApi.assign(classId, [...selected]);
      onAssigned(roster);
      toast(`${selected.size} öğrenci sınıfa eklendi`, 'checkCircle');
      onClose();
    } catch (error) {
      toast((error as ApiError)?.message || 'Ekleme başarısız oldu', 'xCircle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={640}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">Öğrenci Ekle</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Bu dönemin aktif öğrencilerini sınıfa ekleyin. Başka bir sınıftaki öğrenci
            buraya taşınır.
          </p>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink-2">
            Öğrenciler {selected.size > 0 && `· ${selected.size} seçili`}
          </span>
          <div className="w-[200px]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara…"
              className="py-1.5 text-[13px]"
            />
          </div>
        </div>
        <div className="flex max-h-[360px] flex-col overflow-y-auto rounded-token-sm border border-line">
          {candidates.map((student) => {
            const checked = selected.has(student.studentId);
            return (
              <button
                key={student.studentId}
                type="button"
                onClick={() => toggle(student.studentId)}
                className={cn(
                  'flex items-center gap-3 border-b border-line px-3.5 py-2.5 text-left transition-colors last:border-b-0',
                  checked ? 'bg-accent-soft' : 'hover:bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors',
                    checked ? 'border-accent bg-accent text-accent-contrast' : 'border-line-strong',
                  )}
                >
                  {checked && <Icon name="check" size={13} />}
                </span>
                <Avatar name={student.name} size={32} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13.5px] font-semibold">{student.name}</span>
                  <span className="font-mono text-[11px] text-ink-3">{student.studentId}</span>
                </div>
                <span className="text-[12px] text-ink-3">{levelCode(student.level) || '—'}</span>
              </button>
            );
          })}
          {candidates.length === 0 && (
            <div className="p-8 text-center text-[13px] text-ink-3">
              Eklenebilecek öğrenci yok.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          <Icon name="plus" size={17} />
          {submitting ? 'Ekleniyor…' : 'Sınıfa Ekle'}
        </Button>
      </div>
    </Modal>
  );
}
