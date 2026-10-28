import { useEffect, useRef } from 'react';

// Interactive things that make the dot grow.
const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [role="tab"], [tabindex]:not([tabindex="-1"])';

const SMALL = 14; // px, resting size
const LARGE = 44; // px, size over interactive elements

/**
 * A small translucent yellow dot that follows the mouse and grows over
 * anything clickable. Mount it ONCE, outside <Routes>, so it shows on every page.
 * It is decorative: it never blocks clicks and is hidden from screen readers.
 * It does not render on touch devices, which have no cursor.
 */
export default function CursorDot() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No mouse (phones/tablets): do nothing.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = dot.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x = -100, y = -100;   // target (mouse)
    let cx = -100, cy = -100; // drawn position (eased)
    let size = SMALL;
    let raf = 0;
    let visible = false;

    const draw = () => {
      // Ease toward the mouse for a soft trailing feel (instant if reduced motion).
      cx += (x - cx) * (reduce ? 1 : 0.25);
      cy += (y - cy) * (reduce ? 1 : 0.25);
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(draw);
    };

    const setSize = (s: number) => {
      size = s;
      el.style.width = `${s}px`;
      el.style.height = `${s}px`;
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        // First move: jump straight to the cursor instead of flying in.
        cx = x;
        cy = y;
        visible = true;
        el.style.opacity = '1';
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      setSize(t && t.closest(INTERACTIVE) ? LARGE : SMALL);
    };

    const onDown = () => setSize(size === LARGE ? LARGE - 8 : SMALL - 4);
    const onUp = (e: MouseEvent) => {
      const t = e.target as Element | null;
      setSize(t && t.closest(INTERACTIVE) ? LARGE : SMALL);
    };

    const onLeave = () => {
      visible = false;
      el.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SMALL,
        height: SMALL,
        borderRadius: '9999px',
        background: 'rgba(250, 204, 21, 0.45)',
        border: '1px solid rgba(234, 179, 8, 0.7)',
        pointerEvents: 'none',
        zIndex: 2147483647,
        opacity: 0,
        transition: 'width 180ms ease, height 180ms ease, opacity 200ms ease',
        willChange: 'transform, width, height',
      }}
    />
  );
}
