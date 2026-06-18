import { useState } from 'react';
import { Button, Icon, Modal, useToast } from '@/components/ui';
import type { ClassStudent } from '@/types/domain';
import { classesApi, type AutoAssignCriteria } from '../classesApi';
import { AssignBuilderFields } from './AssignBuilderFields';

interface AutoAssignModalProps {
  open: boolean;
  onClose: () => void;
  classId: number;
  onAssigned: (students: ClassStudent[]) => void;
}

/** Configurable auto-assignment for an existing class: pick the criteria, then
 *  assign matching active term students. */
export function AutoAssignModal({ open, onClose, classId, onAssigned }: AutoAssignModalProps) {
  const toast = useToast();
  const [criteria, setCriteria] = useState<AutoAssignCriteria>({
    order: 'oldest',
    payment: 'all',
  });
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const students = await classesApi.autoAssign(classId, criteria);
      onAssigned(students);
      toast(`${students.length} öğrenci atandı`, 'checkCircle');
      onClose();
    } catch {
      toast('Otomatik atama başarısız oldu', 'xCircle');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">Otomatik Ata</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Sınıf seviyesine uyan, dönemdeki aktif öğrenciler atanır.
          </p>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>

      <AssignBuilderFields value={criteria} onChange={setCriteria} />

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={busy}>
          <Icon name="sparkle" size={17} />
          {busy ? 'Atanıyor…' : 'Ata'}
        </Button>
      </div>
    </Modal>
  );
}
