import { useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Button, Field, Input, Modal, useToast } from '@/components/ui';
import { LEVELS } from '@/constants/options';
import type { Teacher } from '@/types/domain';
import { cn } from '@/utils/cn';
import { levelCode } from '@/utils/format';
import { createTeacher, updateTeacher } from './teachersSlice';

interface Props {
  teacher?: Teacher;
  onClose: () => void;
}

export function TeacherFormModal({ teacher, onClose }: Props) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [name, setName] = useState(teacher?.name ?? '');
  const [email, setEmail] = useState(teacher?.email ?? '');
  const [phone, setPhone] = useState(teacher?.phone ?? '');
  const [levels, setLevels] = useState<string[]>(teacher?.levels ?? []);
  const [note, setNote] = useState(teacher?.note ?? '');
  const [saving, setSaving] = useState(false);

  const toggleLevel = (level: string) =>
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );

  const submit = async () => {
    if (!name.trim()) {
      toast('İsim gerekli.', 'info');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      levels,
      note: note.trim() || null,
    };
    try {
      if (teacher) {
        await dispatch(updateTeacher({ id: teacher.id, patch: payload })).unwrap();
        toast('Öğretmen güncellendi.');
      } else {
        await dispatch(createTeacher(payload)).unwrap();
        toast('Öğretmen eklendi.');
      }
      onClose();
    } catch {
      toast('İşlem sırasında bir hata oluştu.', 'x');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <h3 className="m-0 mb-4 text-[17px] font-bold">
        {teacher ? 'Öğretmeni Düzenle' : 'Öğretmen Ekle'}
      </h3>
      <div className="flex flex-col gap-3">
        <Field label="Ad Soyad" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Ahmet Yılmaz" />
        </Field>
        <Field label="E-posta">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="ornek@mail.com"
          />
        </Field>
        <Field label="Telefon">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0 (5__) ___ __ __" />
        </Field>
        <Field label="Verdiği Seviyeler">
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors',
                  levels.includes(level)
                    ? 'border-accent bg-accent-soft text-accent-strong'
                    : 'border-line text-ink-2 hover:bg-surface-2',
                )}
              >
                {levelCode(level)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Not">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsiyonel not…" />
        </Field>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
