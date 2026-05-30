interface LogoProps {
  height?: number;
}

/** Full Power Akademi wordmark; swaps automatically for the dark theme via CSS. */
export function Logo({ height = 30 }: LogoProps) {
  return (
    <div
      className="logo-img shrink-0"
      style={{ height, width: height * 3.5 }}
      role="img"
      aria-label="Power Akademi"
    />
  );
}

interface MarkProps {
  size?: number;
}

/** Compact brand mark used on dark/branded surfaces. */
export function Mark({ size = 34 }: MarkProps) {
  return (
    <div
      className="mark-img shrink-0"
      style={{ height: size, width: size * 1.18 }}
      role="img"
      aria-label="Power"
    />
  );
}
