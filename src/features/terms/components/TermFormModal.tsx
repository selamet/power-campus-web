import { useMemo, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Button, DatePicker, Field, Icon, Input, Modal, useToast } from '@/components/ui';
import type { Term } from '@/types/domain';
import { createTerm, updateTerm } from '../termsSlice';

interface TermFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided the modal edits an existing term; otherwise it creates. */
  term: Term | null;
}

export function TermFormModal({ open, onClose, term }: TermFormModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isEdit = term !== null;

  const [name, setName] = useState(term?.name ?? '');
  const [start, setStart] = useState(term?.start ?? '');
  const [end, setEnd] = useState(term?.end ?? '');
  const [submitting, setSubmitting] = useState(false);

  const error = useMemo(() => {
    if (!start) return 'Başlangıç tarihi gerekli.';
    if (!end) return 'Bitiş tarihi gerekli.';
    if (end < start) return 'Bitiş, başlangıçtan önce olamaz.';
    return null;
  }, [start, end]);

  const handleSubmit = async () => {
    if (error || submitting) return;
    setSubmitting(true);
    const trimmed = name.trim();

    if (isEdit && term) {
      const result = await dispatch(
        updateTerm({ id: term.id, patch: { name: trimmed || undefined, start, end } }),
      );
      setSubmitting(false);
      if (updateTerm.fulfilled.match(result)) {
        toast('Dönem güncellendi', 'check');
        onClose();
      } else {
        toast((result.payload as string) || 'Güncelleme başarısız oldu', 'xCircle');
      }
      return;
    }

    const result = await dispatch(createTerm({ name: trimmed || undefined, start, end }));
    setSubmitting(false);
    if (createTerm.fulfilled.match(result)) {
      toast('Dönem oluşturuldu', 'checkCircle');
      onClose();
    } else {
      toast((result.payload as string) || 'Oluşturma başarısız oldu', 'xCircle');
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">
            {isEdit ? 'Dönemi Düzenle' : 'Yeni Dönem'}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Kurslar bu dönemler üzerinden yürür. Öğrenciler onay aşamasında bir döneme bağlanır.
          </p>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>

      <div className="flex flex-col gap-3.5">
        <Field label="Dönem Adı" hint="Boş bırakırsan eğlenceli bir isim üretilir.">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. 2026 Güz"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Başlangıç" required>
            <DatePicker value={start} onChange={setStart} placeholder="gg.aa.yyyy" />
          </Field>
          <Field label="Bitiş" required>
            <DatePicker value={end} onChange={setEnd} placeholder="gg.aa.yyyy" />
          </Field>
        </div>
      </div>

      {error && <p className="mt-4 text-[12.5px] font-medium text-accent">{error}</p>}

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!!error || submitting}>
          <Icon name={isEdit ? 'check' : 'plus'} size={17} />
          {isEdit ? 'Kaydet' : 'Oluştur'}
        </Button>
      </div>
    </Modal>
  );
}
