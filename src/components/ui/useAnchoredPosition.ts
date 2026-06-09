import { useLayoutEffect, useState, type RefObject } from 'react';

export interface AnchoredPosition {
  left: number;
  top: number;
  width: number;
  /** True when the popover should flip above the anchor (not enough room below). */
  openUp: boolean;
}

/**
 * Computes fixed-position coordinates for a popover anchored to `anchorRef`.
 * Flips upward when the estimated panel height won't fit below the anchor.
 * Meant for popovers rendered through a portal so they escape any clipping or
 * stacking context of the form they live in.
 */
export function useAnchoredPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  estimatedHeight = 360,
  gap = 6,
): AnchoredPosition {
  const [pos, setPos] = useState<AnchoredPosition>({ left: 0, top: 0, width: 0, openUp: false });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    setPos({
      left: rect.left,
      top: openUp ? rect.top - gap : rect.bottom + gap,
      width: rect.width,
      openUp,
    });
  }, [open, anchorRef, estimatedHeight, gap]);

  return pos;
}
