import type { CSSProperties } from 'react';
import { ICONS } from './icons';

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/** Renders a refined stroked SVG icon from the shared icon set. */
export function Icon({ name, size = 18, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      style={style}
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? '' }}
    />
  );
}
