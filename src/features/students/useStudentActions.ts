import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useToast } from '@/components/ui';
import {
  approveStudent,
  createStudent,
  rejectStudent,
  selectStudents,
} from './studentsSlice';
import type { NewStudentInput } from '@/types/domain';

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

  return { approve, reject, create };
}
