import { Field, Input, Select } from '@/components/ui';
import { digitsOnly } from '@/utils/format';
import type { AutoAssignCriteria } from '../classesApi';

interface AssignBuilderFieldsProps {
  value: AutoAssignCriteria;
  onChange: (next: AutoAssignCriteria) => void;
}

/** Shared controls for configuring an auto-assignment: how many students, in
 *  what order, which payment status, and whether to pull in students already
 *  sitting in another class of the term. */
export function AssignBuilderFields({ value, onChange }: AssignBuilderFieldsProps) {
  const set = (patch: Partial<AutoAssignCriteria>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="En fazla öğrenci" hint="Boş bırakırsan uygun herkes atanır.">
          <Input
            value={value.limit ? String(value.limit) : ''}
            onChange={(e) => {
              const n = digitsOnly(e.target.value).slice(0, 4);
              set({ limit: n ? Number(n) : undefined });
            }}
            inputMode="numeric"
            className="font-mono"
            placeholder="Tümü"
          />
        </Field>
        <Field label="Öncelik">
          <Select
            value={value.order ?? 'oldest'}
            onChange={(e) => set({ order: e.target.value as AutoAssignCriteria['order'] })}
          >
            <option value="oldest">Önce eski kayıtlar</option>
            <option value="newest">Önce yeni kayıtlar</option>
            <option value="random">Rastgele</option>
          </Select>
        </Field>
      </div>
      <Field label="Ödeme durumu">
        <Select
          value={value.payment ?? 'all'}
          onChange={(e) => set({ payment: e.target.value as AutoAssignCriteria['payment'] })}
        >
          <option value="all">Tüm öğrenciler</option>
          <option value="paidOnly">Yalnızca ödemesi tamamlananlar</option>
        </Select>
      </Field>
      <label className="flex items-center gap-2.5 text-[13px] text-ink-2">
        <input
          type="checkbox"
          checked={value.includeAssigned ?? false}
          onChange={(e) => set({ includeAssigned: e.target.checked })}
        />
        Başka sınıftaki öğrenciler de taşınsın
      </label>
    </div>
  );
}
