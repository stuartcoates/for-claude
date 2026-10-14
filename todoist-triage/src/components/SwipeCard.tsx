import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { SWIPE_DISTANCE as DISTANCE, resolveSwipe, type SwipeDir } from '../lib/swipe';

export type { SwipeDir };
export type ExitDir = SwipeDir | 'fade';

export const EXIT_MS = 260;

interface Props {
  /** Set when this card should leave the deck; the card animates out, then calls onExited. */
  exit: ExitDir | null;
  onExited: () => void;
  onSwipe: (dir: SwipeDir) => void;
  children: ReactNode;
}

interface Drag {
  pointerId: number;
  x: number;
  y: number;
  t: number;
}

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function SwipeCard({ exit, onExited, onSwipe, children }: Props) {
  const drag = useRef<Drag | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!exit) return;
    const timer = setTimeout(onExited, reducedMotion() ? 0 : EXIT_MS);
    return () => clearTimeout(timer);
  }, [exit, onExited]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (exit || e.button !== 0) return;
    // Links and buttons on the card keep working as taps.
    if ((e.target as HTMLElement).closest('a, button')) return;
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
    setOffset({ x: 0, y: 0, active: true });
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    setOffset({ x: e.clientX - d.x, y: e.clientY - d.y, active: true });
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    const dir = resolveSwipe(e.clientX - d.x, e.clientY - d.y, performance.now() - d.t);
    setOffset({ x: 0, y: 0, active: false });
    if (dir) onSwipe(dir);
  }

  function onPointerCancel() {
    drag.current = null;
    setOffset({ x: 0, y: 0, active: false });
  }

  let transform = `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)`;
  let transition = offset.active ? 'none' : 'transform 220ms cubic-bezier(.2,.8,.3,1.2)';
  let opacity = 1;
  if (exit) {
    const w = typeof window === 'undefined' ? 500 : window.innerWidth;
    const h = typeof window === 'undefined' ? 800 : window.innerHeight;
    const to = {
      left: `translate(${-w * 1.1}px, 40px) rotate(-18deg)`,
      right: `translate(${w * 1.1}px, 40px) rotate(18deg)`,
      up: `translate(0, ${-h * 0.9}px) rotate(-3deg)`,
      down: `translate(0, ${h * 0.9}px) rotate(3deg)`,
      fade: 'scale(0.94)',
    }[exit];
    transform = to;
    transition = `transform ${EXIT_MS}ms ease-in, opacity ${EXIT_MS}ms ease-in`;
    opacity = exit === 'fade' ? 0 : 1;
  }

  // Stamp strength follows the drag (or the programmatic exit direction).
  const ink = (dir: SwipeDir) => {
    if (exit) return exit === dir ? 1 : 0;
    const { x, y } = offset;
    const horizontal = Math.abs(x) >= Math.abs(y) * 0.9;
    if (dir === 'left' && horizontal && x < 0) return Math.min(1, -x / DISTANCE);
    if (dir === 'right' && horizontal && x > 0) return Math.min(1, x / DISTANCE);
    if (dir === 'up' && !horizontal && y < 0) return Math.min(1, -y / DISTANCE);
    if (dir === 'down' && !horizontal && y > 0) return Math.min(1, y / DISTANCE);
    return 0;
  };

  const style: CSSProperties = { transform, transition, opacity };
  return (
    <div
      className={`card-slot top${offset.active ? ' dragging' : ''}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {children}
      <span className="stamp keep" style={{ opacity: ink('left') }} aria-hidden>
        Keep
      </span>
      <span className="stamp done" style={{ opacity: ink('right') }} aria-hidden>
        Done
      </span>
      <span className="stamp later" style={{ opacity: ink('up') }} aria-hidden>
        Later
      </span>
      <span className="stamp delete" style={{ opacity: ink('down') }} aria-hidden>
        Delete
      </span>
    </div>
  );
}
