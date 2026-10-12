export type SwipeDir = 'left' | 'right' | 'up' | 'down';

/** How far a drag must travel (px) before letting go counts as a swipe. */
export const SWIPE_DISTANCE = 110;
/** A quick flick counts even when it's shorter (px per ms). */
const FLICK_SPEED = 0.55;

/** Which way a released drag counts as, if any. Vertical swipes need a clearly vertical motion. */
export function resolveSwipe(dx: number, dy: number, ms: number): SwipeDir | null {
  const speed = Math.hypot(dx, dy) / Math.max(ms, 1);
  const far = (d: number) => Math.abs(d) > SWIPE_DISTANCE || (Math.abs(d) > 40 && speed > FLICK_SPEED);
  if (Math.abs(dx) >= Math.abs(dy) * 0.9) {
    return far(dx) ? (dx > 0 ? 'right' : 'left') : null;
  }
  return far(dy) ? (dy > 0 ? 'down' : 'up') : null;
}
