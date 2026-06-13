import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Field, Icon, Input, Modal, PasswordInput, Select, Toggle, useToast } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/roles';
import type { CreateStaffInput, StaffAccount, UpdateStaffInput } from '@/types/domain';
import { cn } from '@/utils/cn';
import { createStaff, selectPermissionCatalog, updateStaff } from '../staffSlice';

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided the modal edits an existing account; otherwise it creates. */
  staff: StaffAccount | null;
}

// Roles that can be assigned to a panel account (students are excluded).
const ROLE_OPTIONS = ['admin', 'manager', 'teacher'] as const;

interface PermissionCheckboxProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function PermissionCheckbox({ label, checked, disabled, onChange }: PermissionCheckboxProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2.5 rounded-token-sm border-[1.5px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'border-accent-soft-border bg-accent-soft text-accent-strong'
          : 'border-line-strong bg-surface text-ink-2 hover:border-ink-3',
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
      {label}
    </button>
  );
}

export function StaffFormModal({ open, onClose, staff }: StaffFormModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const catalog = useAppSelector(selectPermissionCatalog);
  const isEdit = staff !== null;

  const [name, setName] = useState(staff?.name ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(staff?.role ?? 'manager');
  const [isActive, setIsActive] = useState(staff?.isActive ?? true);
  const [permissions, setPermissions] = useState<Set<string>>(
    () => new Set(staff?.permissions ?? []),
  );
  const [submitting, setSubmitting] = useState(false);

  const isAdminRole = role === 'admin';

  const error = useMemo(() => {
    if (name.trim().length < 2) return 'Ad en az 2 karakter olmalı.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Geçerli bir e-posta girin.';
    if (!isEdit && password.length < 8) return 'Parola en az 8 karakter olmalı.';
    if (isEdit && password.length > 0 && password.length < 8)
      return 'Parola en az 8 karakter olmalı.';
    return null;
  }, [name, email, password, isEdit]);

  const toggle = (key: string, on: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (error || submitting) return;
    setSubmitting(true);
    const permissionList = isAdminRole ? [] : [...permissions];

    if (isEdit && staff) {
      const patch: UpdateStaffInput = {
        name: name.trim(),
        role,
        isActive,
        permissions: permissionList,
      };
      if (password) patch.password = password;
      const result = await dispatch(updateStaff({ id: staff.id, patch }));
      setSubmitting(false);
      if (updateStaff.fulfilled.match(result)) {
        toast('Yetkili güncellendi', 'check');
        onClose();
      } else {
        toast((result.payload as string) || 'Güncelleme başarısız oldu', 'xCircle');
      }
      return;
    }

    const input: CreateStaffInput = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      permissions: permissionList,
    };
    const result = await dispatch(createStaff(input));
    setSubmitting(false);
    if (createStaff.fulfilled.match(result)) {
      toast('Yetkili eklendi', 'checkCircle');
      onClose();
    } else {
      toast((result.payload as string) || 'Ekleme başarısız oldu', 'xCircle');
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={620}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">
            {isEdit ? 'Yetkiliyi Düzenle' : 'Yeni Yetkili Ekle'}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Panel erişimi ve izinleri buradan yönetilir.
          </p>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={18} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Ad Soyad" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmet Yılmaz" />
        </Field>
        <Field label="E-posta" required>
          <Input
            type="email"
            value={email}
            disabled={isEdit}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ad@powerakademi.com"
          />
        </Field>
        <Field
          label={isEdit ? 'Yeni Parola' : 'Parola'}
          required={!isEdit}
          hint={isEdit ? 'Değiştirmemek için boş bırakın.' : 'En az 8 karakter.'}
        >
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Rol" required>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isEdit && (
        <div className="mt-4 flex items-center justify-between rounded-token-sm border-[1.5px] border-line-strong bg-surface px-3.5 py-3">
          <div>
            <span className="text-[14px] font-semibold">Hesap aktif</span>
            <p className="text-[12px] text-ink-3">Pasif hesaplar panele giriş yapamaz.</p>
          </div>
          <Toggle checked={isActive} onChange={setIsActive} />
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink-2">İzinler</span>
          {isAdminRole && (
            <span className="text-[12px] font-medium text-accent">
              Admin tüm izinlere sahiptir
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {catalog.map((group) => (
            <div key={group.module} className="rounded-token-sm border border-line bg-surface-2 p-3">
              <div className="mb-2 text-[12.5px] font-semibold text-ink-2">{group.label}</div>
              <div className="grid grid-cols-2 gap-2">
                {group.permissions.map((item) => (
                  <PermissionCheckbox
                    key={item.key}
                    label={item.label}
                    disabled={isAdminRole}
                    checked={isAdminRole || permissions.has(item.key)}
                    onChange={(on) => toggle(item.key, on)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-[12.5px] font-medium text-accent">{error}</p>}

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!!error || submitting}>
          <Icon name={isEdit ? 'check' : 'plus'} size={17} />
          {isEdit ? 'Kaydet' : 'Ekle'}
        </Button>
      </div>
    </Modal>
  );
}
