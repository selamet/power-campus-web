import { Button, Icon, Modal } from '@/components/ui';
import { cn } from '@/utils/cn';

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onManual: () => void;
  onInvite: () => void;
}

/** First step of adding a student: pick manual entry or an invite link. */
export function AddStudentModal({ open, onClose, onManual, onInvite }: AddStudentModalProps) {
  return (
    <Modal open={open} onClose={onClose} width={580}>
      <div className="mb-1.5 flex items-start justify-between">
        <div className="flex flex-col">
          <span className="kicker">YENİ KAYIT</span>
          <h2 className="mt-1 text-[22px] font-bold tracking-[-0.02em]">
            Öğrenciyi nasıl eklemek istersin?
          </h2>
        </div>
        <Button variant="quiet" onClick={onClose} className="p-2" aria-label="Kapat">
          <Icon name="x" size={20} />
        </Button>
      </div>
      <p className="mt-1.5 mb-[22px] text-[14.5px] text-ink-2">
        İki yöntemden birini seç. Davet linkinde öğrenci bilgilerini kendi telefonundan doldurur.
      </p>

      <div className="add-choice grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <ChoiceCard
          icon="edit"
          title="Manuel Kayıt"
          desc="Tüm bilgileri sen doldur. Kişisel, eğitim, iletişim ve finans."
          badge="Tam form"
          onClick={onManual}
        />
        <ChoiceCard
          icon="send"
          title="Davet Linki Gönder"
          desc="TCKN + telefon gir, kişiye özel link oluştur. Öğrenci doldursun."
          badge="Önerilen"
          accent
          onClick={onInvite}
        />
      </div>
    </Modal>
  );
}

interface ChoiceCardProps {
  icon: string;
  title: string;
  desc: string;
  badge: string;
  accent?: boolean;
  onClick: () => void;
}

function ChoiceCard({ icon, title, desc, badge, accent, onClick }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'choice-card flex cursor-pointer flex-col gap-3 rounded-2xl bg-surface p-5 text-left transition-all duration-200',
        accent ? 'border-[1.5px] border-accent shadow-accent' : 'border-[1.5px] border-line-strong',
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex size-[46px] items-center justify-center rounded-[13px]',
            accent ? 'bg-accent text-white' : 'bg-bg-2 text-ink-2',
          )}
        >
          <Icon name={icon} size={22} />
        </div>
        <span
          className={cn(
            'rounded-full px-[9px] py-1 font-mono text-[11px] font-bold',
            accent ? 'bg-accent-soft text-accent-strong' : 'bg-bg-2 text-ink-3',
          )}
        >
          {badge}
        </span>
      </div>
      <div className="flex flex-col gap-[5px]">
        <span className="text-[16.5px] font-bold text-ink">{title}</span>
        <span className="text-[13px] leading-[1.45] text-ink-2">{desc}</span>
      </div>
      <span
        className={cn(
          'mt-auto flex items-center gap-2 text-[13.5px] font-semibold',
          accent ? 'text-accent' : 'text-ink-2',
        )}
      >
        Devam et <Icon name="arrowR" size={16} />
      </span>
    </button>
  );
}
