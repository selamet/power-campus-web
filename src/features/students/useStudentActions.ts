import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useToast } from '@/components/ui';
import {
  approveStudent,
  createStudent,
  recordPayment,
  rejectStudent,
  selectStudents,
  updateStudent,
} from './studentsSlice';
import type { RecordPaymentInput, StudentUpdateInput } from './studentsApi';
import type { NewStudentInput, Student } from '@/types/domain';

/** Encapsulates student mutations together with their user-facing toasts. */
export function useStudentActions() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const students = useAppSelector(selectStudents);

  const approve = useCallback(
    (id: string) => {
      const student = students.find((item) => item.id === id);
      dispatch(approveStudent(id));
      toast(`${student?.name ?? 'Öğrenci'} onaylandı`, 'checkCircle');
    },
    [dispatch, students, toast],
  );

  const reject = useCallback(
    (id: string) => {
      dispatch(rejectStudent(id));
      toast('Kayıt reddedildi', 'xCircle');
    },
    [dispatch, toast],
  );

  const create = useCallback(
    (input: NewStudentInput) => {
      dispatch(createStudent(input));
      toast('Öğrenci kaydı oluşturuldu', 'checkCircle');
    },
    [dispatch, toast],
  );

  const update = useCallback(
    async (id: string, patch: StudentUpdateInput): Promise<boolean> => {
      const result = await dispatch(updateStudent({ id, patch }));
      if (updateStudent.fulfilled.match(result)) {
        toast('Öğrenci bilgileri güncellendi', 'check');
        return true;
      }
      toast('Güncelleme başarısız oldu', 'xCircle');
      return false;
    },
    [dispatch, toast],
  );

  const pay = useCallback(
    async (id: string, input: RecordPaymentInput): Promise<Student | null> => {
      const result = await dispatch(recordPayment({ id, input }));
      if (recordPayment.fulfilled.match(result)) {
        toast('Ödeme alındı', 'wallet');
        return result.payload;
      }
      toast('Ödeme kaydedilemedi', 'xCircle');
      return null;
    },
    [dispatch, toast],
  );

  return { approve, reject, create, update, pay };
}
