import { useEffect, useState } from 'react';

/**
 * Word-by-word reveal. Put it INSIDE your existing heading so its styles stay:
 *   <h1 className="...your classes..."><AnimatedText text="One student. One college at a time." /></h1>
 */
export default function AnimatedText({ text, stepMs = 110 }: { text: string; stepMs?: number }) {
  const [on, setOn] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (on) return;
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [on]);

  const words = text.split(' ');

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <span
              className="inline-block"
              style={{
                transform: on ? 'translateY(0)' : 'translateY(110%)',
                opacity: on ? 1 : 0,
                transition: `transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * stepMs}ms, opacity 500ms ease-out ${i * stepMs}ms`,
              }}
            >
              {w}
            </span>
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        ))}
      </span>
    </>
  );
}
