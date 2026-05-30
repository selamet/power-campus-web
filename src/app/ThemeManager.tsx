import { useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectUi, type Density } from '@/features/ui/uiSlice';
import { hexToHsl } from '@/utils/color';

const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.62,
  regular: 1,
  comfy: 1.35,
};

/**
 * Side-effect-only component that reflects UI preferences from the store onto
 * the document root (theme attribute + accent/density/radius CSS variables).
 */
export function ThemeManager() {
  const { theme, accent, density, radius } = useAppSelector(selectUi);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement.style;
    const { h, s, l } = hexToHsl(accent);
    root.setProperty('--accent-h', String(h));
    root.setProperty('--accent-s', `${Math.max(s, 55)}%`);
    root.setProperty('--accent-l', `${l}%`);
    root.setProperty('--density', String(DENSITY_SCALE[density]));
    root.setProperty('--radius', `${radius}px`);
    root.setProperty('--radius-sm', `${radius - 4}px`);
    root.setProperty('--radius-lg', `${radius + 8}px`);
  }, [accent, density, radius]);

  return null;
}
