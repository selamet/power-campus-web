import { useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { Avatar, Button, Icon, Input, Modal, useToast } from '@/components/ui';
import { selectStudents } from '@/features/students/studentsSlice';
import type { ApiError } from '@/api/axiosClient';
import { cn } from '@/utils/cn';
import { termsApi, type TermStudent } from '../termsApi';

interface AddStudentsModalProps {
  open: boolean;
  onClose: () => void;
  termId: number;
  /** Codes already enrolled in this term, hidden from the picker. */
  enrolledCodes: Set<string>;
  onEnrolled: (roster: TermStudent[]) => void;
}

/** Add existing students to a term. No course or finance is set here. */
export function AddStudentsModal({
  open,
  onClose,
  termId,
  enrolledCodes,
  onEnrolled,
}: AddStudentsModalProps) {
  const students = useAppSelector(selectStudents);
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const candidates = useMemo(() => {
    const text = query.trim().toLowerCase();
    return students
      // Only active students can join a term; pending/inactive ones are excluded.
      .filter((student) => student.status === 'active')
      .filter((student) => !enrolledCodes.has(student.id))
      .filter((student) =>
        text ? `${student.name}${student.id}`.toLowerCase().includes(text) : true,
      );
  }, [students, enrolledCodes, query]);

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
      const roster = await termsApi.bulkEnroll(termId, { studentCodes: [...selected] });
      onEnrolled(roster);
      toast(`${selected.size} öğrenci döneme eklendi`, 'checkCircle');
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
            Yalnızca aktif öğrenciler bu döneme eklenebilir. Kur ve ücret daha sonra
            öğrencinin kaydından belirlenir.
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
            const checked = selected.has(student.id);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => toggle(student.id)}
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
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13.5px] font-semibold">{student.name}</span>
                  <span className="font-mono text-[11px] text-ink-3">{student.id}</span>
                </div>
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
          {submitting ? 'Ekleniyor…' : 'Döneme Ekle'}
        </Button>
      </div>
    </Modal>
  );
}
