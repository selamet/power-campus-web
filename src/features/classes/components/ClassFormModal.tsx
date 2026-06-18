import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Field, Icon, Input, Modal, Select, useToast } from '@/components/ui';
import { LEVELS } from '@/constants/options';
import { selectTerms } from '@/features/terms/termsSlice';
import { teachersApi } from '@/features/teachers/teachersApi';
import { digitsOnly } from '@/utils/format';
import type { LessonType, SchoolClass, Teacher } from '@/types/domain';
import { classesApi, type AutoAssignCriteria } from '../classesApi';
import { createClass, updateClass } from '../classesSlice';
import { LessonRow, type LessonDraft } from './LessonRow';
import { AssignBuilderFields } from './AssignBuilderFields';

const LESSON_LABELS: Record<LessonType, string> = {
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  speaking_club: 'Speaking Club',
};

interface ClassFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided the modal edits an existing class; otherwise it creates. */
  schoolClass: SchoolClass | null;
  /** Pre-selected term for new classes (e.g. the current term). */
  defaultTermId?: number;
}

export function ClassFormModal({
  open,
  onClose,
  schoolClass,
  defaultTermId,
}: ClassFormModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const terms = useAppSelector(selectTerms);
  const isEdit = schoolClass !== null;

  const [termId, setTermId] = useState<string>(
    String(schoolClass?.termId ?? defaultTermId ?? terms[0]?.id ?? ''),
  );
  const [level, setLevel] = useState<string>(schoolClass?.level ?? LEVELS[0]);
  // Blank section means "auto-assign the next free number".
  const [section, setSection] = useState<string>(
    schoolClass ? String(schoolClass.section) : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lessonDrafts, setLessonDrafts] = useState<LessonDraft[]>([]);
  // New classes can optionally auto-assign students on creation.
  const [autoAssignOn, setAutoAssignOn] = useState(false);
  const [criteria, setCriteria] = useState<AutoAssignCriteria>({
    order: 'oldest',
    payment: 'all',
  });

  // Creating a class: load the lesson catalog (defaulted on) and active teachers.
  useEffect(() => {
    if (!open || isEdit) return;
    let active = true;
    void classesApi.lessonTypes().then((catalog) => {
      if (!active) return;
      setLessonDrafts(
        catalog.map((c) => ({
          lessonType: c.value,
          enabled: true,
          sessionDurationMin: c.defaultDurationMin,
          sessionsPerWeek: c.defaultSessionsPerWeek,
          teacherId: null,
        })),
      );
    });
    void teachersApi.list('active').then((rows) => active && setTeachers(rows));
    return () => {
      active = false;
    };
  }, [open, isEdit]);

  const error = useMemo(() => {
    if (!isEdit && !termId) return 'Dönem seçin.';
    if (!level) return 'Seviye seçin.';
    return null;
  }, [isEdit, termId, level]);

  const handleSubmit = async () => {
    if (error || submitting) return;
    setSubmitting(true);
    const sectionValue = section ? Number(section) : undefined;

    if (isEdit && schoolClass) {
      const result = await dispatch(
        updateClass({ id: schoolClass.id, patch: { level, section: sectionValue } }),
      );
      setSubmitting(false);
      if (updateClass.fulfilled.match(result)) {
        toast('Sınıf güncellendi', 'check');
        onClose();
      } else {
        toast((result.payload as string) || 'Güncelleme başarısız oldu', 'xCircle');
      }
      return;
    }

    const lessons = lessonDrafts
      .filter((d) => d.enabled)
      .map((d) => ({
        lessonType: d.lessonType,
        sessionDurationMin: d.sessionDurationMin,
        sessionsPerWeek: d.sessionsPerWeek,
        teacherId: d.teacherId,
      }));

    const result = await dispatch(
      createClass({
        termId: Number(termId),
        level,
        section: sectionValue,
        lessons,
        autoAssign: autoAssignOn ? criteria : undefined,
      }),
    );
    setSubmitting(false);
    if (createClass.fulfilled.match(result)) {
      toast('Sınıf oluşturuldu', 'checkCircle');
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
            {isEdit ? 'Sınıfı Düzenle' : 'Yeni Sınıf'}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Sınıflar bir döneme ve seviyeye bağlıdır (örn. A1/1). Öğrenciler sonra atanır.
          </p>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>

      <div className="flex flex-col gap-3.5">
        <Field label="Dönem" required>
          <Select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            disabled={isEdit}
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Seviye" required>
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Şube No" hint="Boş bırakırsan otomatik atanır.">
            <Input
              value={section}
              onChange={(e) => setSection(digitsOnly(e.target.value).slice(0, 3))}
              inputMode="numeric"
              className="font-mono"
              placeholder="Otomatik"
            />
          </Field>
        </div>

        {!isEdit && lessonDrafts.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-ink-2">Dersler</span>
            {lessonDrafts.map((draft, index) => (
              <LessonRow
                key={draft.lessonType}
                label={LESSON_LABELS[draft.lessonType]}
                draft={draft}
                teachers={teachers}
                onChange={(next) =>
                  setLessonDrafts((prev) => prev.map((d, i) => (i === index ? next : d)))
                }
              />
            ))}
          </div>
        )}

        {!isEdit && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-[13px] font-medium text-ink-2">
              <input
                type="checkbox"
                checked={autoAssignOn}
                onChange={(e) => setAutoAssignOn(e.target.checked)}
              />
              Öğrencileri otomatik ata
            </label>
            {autoAssignOn && <AssignBuilderFields value={criteria} onChange={setCriteria} />}
          </div>
        )}
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
