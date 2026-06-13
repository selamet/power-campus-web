import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Icon } from '@/components/ui';
import { inputBase } from '@/components/ui';
import { selectTheme, toggleTheme } from '@/features/ui/uiSlice';
import { cn } from '@/utils/cn';

interface TopbarProps {
  title: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onMenu: () => void;
  onAdd: () => void;
  /** Whether the signed-in user may start the add-student / invite flow. */
  canAdd?: boolean;
}

export function Topbar({
  title,
  subtitle,
  search,
  onSearchChange,
  onMenu,
  onAdd,
  canAdd = true,
}: TopbarProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);

  return (
    <header className="topbar sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-[hsl(30_24%_97%/0.8)] px-7 py-3.5 backdrop-blur-[12px] dark:bg-[hsl(24_12%_8%/0.8)]">
      <Button
        variant="quiet"
        onClick={onMenu}
        className="topbar-menu p-[9px]"
        aria-label="Menü"
      >
        <Icon name="menu" size={20} />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="m-0 text-[21px] font-bold tracking-[-0.02em]">{title}</h1>
        {subtitle && <span className="text-[13px] text-ink-3">{subtitle}</span>}
      </div>

      <div className="topbar-search relative w-[260px]">
        <Icon
          name="search"
          size={17}
          className="absolute top-1/2 left-[13px] -translate-y-1/2 text-ink-3"
        />
        <input
          className={cn(inputBase, 'h-[42px] pl-[38px]')}
          placeholder="Öğrenci, ID, telefon ara…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <Button
        variant="ghost"
        onClick={() => dispatch(toggleTheme())}
        className="size-[42px] p-2.5"
        aria-label="Tema"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
      </Button>

      <Button variant="ghost" className="topbar-bell relative size-[42px] p-2.5" aria-label="Bildirimler">
        <Icon name="bell" size={19} />
        <span className="absolute top-[9px] right-2.5 size-2 rounded-full border-2 border-surface bg-accent" />
      </Button>

      {canAdd && (
        <Button variant="primary" onClick={onAdd} className="topbar-add">
          <Icon name="plus" size={18} />
          <span>Öğrenci Ekle</span>
        </Button>
      )}
    </header>
  );
}
