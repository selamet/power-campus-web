import { avatarColor, initialsFromName } from '@/utils/color';

interface AvatarProps {
  name: string;
  size?: number;
}

/** Circular avatar showing initials over a deterministic gradient. */
export function Avatar({ name, size = 38 }: AvatarProps) {
  const bg = avatarColor(name);
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        fontSize: size * 0.36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        color: '#fff',
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initialsFromName(name)}
    </span>
  );
}
