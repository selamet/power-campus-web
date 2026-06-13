import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Avatar, Badge, Button, Icon } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { roleLabel } from '@/constants/roles';
import { usePermission } from '@/features/auth/usePermission';
import type { StaffAccount } from '@/types/domain';
import { cn } from '@/utils/cn';
import { StaffFormModal } from './components/StaffFormModal';
import {
  fetchPermissionCatalog,
  fetchStaff,
  selectStaff,
  selectStaffStatus,
} from './staffSlice';

const permissionSummary = (staff: StaffAccount): string => {
  if (staff.role === 'admin') return 'Tüm izinler';
  const count = staff.permissions.length;
  return count ? `${count} izin` : 'İzin yok';
};

export function StaffPage() {
  const dispatch = useAppDispatch();
  const staff = useAppSelector(selectStaff);
  const status = useAppSelector(selectStaffStatus);
  const { has } = usePermission();
  const canWrite = has(PERMISSIONS.usersWrite);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffAccount | null>(null);

  useEffect(() => {
    void dispatch(fetchStaff());
    void dispatch(fetchPermissionCatalog());
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (account: StaffAccount) => {
    if (!canWrite) return;
    setEditing(account);
    setModalOpen(true);
  };

  return (
    <div className="anim-fade-up mx-auto flex max-w-[1100px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">Yetkili Kişiler</h2>
          <p className="text-[13px] text-ink-3">
            Panel kullanıcılarını ve erişim izinlerini yönetin.
          </p>
        </div>
        {canWrite && (
          <Button variant="primary" onClick={openCreate}>
            <Icon name="plus" size={18} />
            Yetkili Ekle
          </Button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="hidden items-center gap-4 border-b border-line px-5 py-3 text-[11.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase md:flex">
          <span className="flex-1">Kullanıcı</span>
          <span className="w-[110px]">Rol</span>
          <span className="w-[150px]">Şube</span>
          <span className="w-[110px]">İzinler</span>
          <span className="w-[90px]">Durum</span>
        </div>

        {staff.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => openEdit(account)}
            disabled={!canWrite}
            className={cn(
              'flex w-full flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 text-left transition-colors last:border-b-0',
              canWrite ? 'cursor-pointer hover:bg-surface-2' : 'cursor-default',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={account.name} size={40} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{account.name}</span>
                <span className="truncate text-[12px] text-ink-3">{account.email}</span>
              </div>
            </div>
            <div className="w-[110px]">
              <span className="inline-flex rounded-md bg-bg-2 px-2 py-1 font-mono text-[11px] font-bold tracking-[0.03em] text-ink-2 uppercase">
                {roleLabel(account.role)}
              </span>
            </div>
            <div className="w-[150px] truncate text-[13.5px] text-ink-2">
              {account.branch ?? '—'}
            </div>
            <div className="w-[110px] text-[13px] text-ink-2">{permissionSummary(account)}</div>
            <div className="w-[90px]">
              <Badge kind={account.isActive ? 'ok' : 'neutral'} dot>
                {account.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
          </button>
        ))}

        {status === 'loading' && staff.length === 0 && (
          <div className="p-12 text-center text-ink-3">Yükleniyor…</div>
        )}
        {status === 'succeeded' && staff.length === 0 && (
          <div className="p-12 text-center text-ink-3">Henüz yetkili eklenmemiş.</div>
        )}
      </div>

      {modalOpen && (
        <StaffFormModal
          key={editing?.id ?? 'new'}
          open={modalOpen}
          staff={editing}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
