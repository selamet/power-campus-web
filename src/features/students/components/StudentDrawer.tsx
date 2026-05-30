import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Badge, Button, Icon } from '@/components/ui';
import { STATUS } from '@/constants/status';
import type { Student } from '@/types/domain';
import { cn } from '@/utils/cn';
import { formatDate, formatMoney, paidPercent } from '@/utils/format';

interface StudentDrawerProps {
  student: Student;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

/** Slide-over with student details and approve/reject actions. */
export function StudentDrawer({ student, onClose, onApprove, onReject }: StudentDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = STATUS[student.status];
  const pct = paidPercent(student.paid, student.fee);
  const isPending = student.status === 'pending';

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        onClick={close}
        className="absolute inset-0 bg-[hsl(20_30%_8%/0.5)] backdrop-blur-[3px]"
        style={{ animation: closing ? 'fadeIn .25s reverse' : 'fadeIn .25s ease' }}
      />
      <div
        className="absolute top-0 right-0 bottom-0 flex w-[520px] max-w-full flex-col bg-bg shadow-float"
        style={{
          animation: closing
            ? 'slideInRight .25s reverse forwards'
            : 'slideInRight .3s cubic-bezier(.2,.8,.3,1)',
        }}
      >
        {/* header */}
        <div className="border-b border-line bg-surface px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="kicker">ÖĞRENCİ KAYDI · {student.id}</span>
            <Button variant="quiet" onClick={close} className="p-2" aria-label="Kapat">
              <Icon name="x" size={20} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={student.name} size={56} />
            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <h2 className="m-0 text-[21px] font-bold tracking-[-0.01em]">{student.name}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge kind={status.kind} dot>
                  {status.label}
                </Badge>
                {student.source === 'davet' && (
                  <Badge kind="accent">
                    <Icon name="link" size={11} />
                    Davet ile
                  </Badge>
                )}
                {student.source === 'manuel' && (
                  <Badge kind="neutral">
                    <Icon name="edit" size={11} />
                    Manuel
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {isPending && (
            <div className="anim-fade-in flex items-center gap-3 rounded-xl border border-[hsl(38_60%_80%/0.5)] bg-warn-soft p-3.5">
              <Icon name="info" size={20} className="shrink-0 text-[hsl(38_80%_42%)]" />
              <span className="text-[13px] leading-[1.45] text-ink-2">
                Bu öğrenci hoşgeldin formunu doldurdu. Bilgileri kontrol edip{' '}
                <strong>onaylayın</strong> ya da düzeltme için geri gönderin.
              </span>
            </div>
          )}

          <InfoBlock icon="user" title="Kişisel & İletişim">
            <InfoRow label="E-posta" value={student.email} />
            <InfoRow label="Telefon" value={student.phone} mono />
            <InfoRow label="Kayıt Tarihi" value={formatDate(student.joined)} />
          </InfoBlock>

          <InfoBlock icon="graduation" title="Eğitim">
            <InfoRow label="Dil" value={student.lang} />
            <InfoRow label="Seviye" value={student.level} />
            <InfoRow label="Kur / Program" value={student.course} />
            <InfoRow label="Başlangıç" value={formatDate(student.start)} />
          </InfoBlock>

          <InfoBlock icon="wallet" title="Finans">
            <InfoRow label="Kayıt Ücreti" value={formatMoney(student.fee)} mono />
            <InfoRow label="Ödeme Planı" value={student.plan} />
            <InfoRow label="Ödenen" value={formatMoney(student.paid)} mono />
            {student.next && <InfoRow label="Sonraki Ödeme" value={formatDate(student.next)} />}
            <div className="flex flex-col gap-2 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-3">Tahsilat durumu</span>
                <span
                  className={cn(
                    'font-mono text-xs font-bold',
                    pct === 100 ? 'text-ok' : 'text-accent',
                  )}
                >
                  %{pct}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-bg-2">
                <div
                  className={cn('h-full rounded transition-[width] duration-500', pct === 100 ? 'bg-ok' : 'bg-accent')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </InfoBlock>
        </div>

        {/* footer */}
        {isPending ? (
          <div className="border-t border-line bg-surface px-6 py-4">
            {!rejecting ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" block onClick={() => setRejecting(true)}>
                  <Icon name="x" size={17} />
                  Reddet
                </Button>
                <Button
                  variant="primary"
                  block
                  onClick={() => {
                    onApprove(student.id);
                    close();
                  }}
                >
                  <Icon name="check" size={18} />
                  Onayla
                </Button>
              </div>
            ) : (
              <div className="anim-fade-in flex flex-col gap-3">
                <span className="text-[13px] text-ink-2">
                  Kaydı reddetmek istediğine emin misin?
                </span>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" block onClick={() => setRejecting(false)}>
                    Vazgeç
                  </Button>
                  <Button
                    block
                    onClick={() => {
                      onReject(student.id);
                      close();
                    }}
                    className="bg-[hsl(0_72%_48%)] text-white"
                  >
                    <Icon name="xCircle" size={17} />
                    Evet, reddet
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-line bg-surface px-6 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" block>
                <Icon name="edit" size={17} />
                Düzenle
              </Button>
              <Button variant="soft" block>
                <Icon name="wallet" size={17} />
                Ödeme Al
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-[9px]">
      <span className="shrink-0 text-[13px] text-ink-3">{label}</span>
      <span className={cn('text-right text-[13.5px] font-semibold', mono && 'font-mono tabular-nums')}>
        {value || '—'}
      </span>
    </div>
  );
}

function InfoBlock({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="card p-[18px]">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon name={icon} size={17} className="text-accent" />
        <h4 className="m-0 text-[14.5px] font-bold">{title}</h4>
      </div>
      {children}
    </div>
  );
}
