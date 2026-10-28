import { useEffect, useRef, useState } from 'react';

const SAMPLE_ID = '123456789012'; // fake, for illustration only
const CELL = 3.5; // rem, must equal the h-14 class below

function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  // With reduced motion the digits start in their final position, so nothing animates.
  const [seen, setSeen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

/** The motion moment between hero and About: twelve digits roll into place like an odometer. */
export default function IdRollBand() {
  const [ref, seen] = useSeen<HTMLDivElement>();

  return (
    <section aria-labelledby="one-id" className="bg-[#0f2a47] py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-10 px-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <h2 id="one-id" className="text-3xl font-semibold leading-tight tracking-tight">
            One ID follows a student through every institution.
          </h2>
          <p className="mt-3 text-slate-300">
            Twelve digits are all that link a student's records across colleges, programmes and years.
          </p>
        </div>

        <div>
          <div ref={ref} role="img" aria-label="Sample APAAR ID: 1234 5678 9012"
            className="flex flex-wrap gap-x-5 gap-y-3">
            {[0, 1, 2].map(g => (
              <div key={g} className="flex gap-1.5" aria-hidden="true">
                {SAMPLE_ID.slice(g * 4, g * 4 + 4).split('').map((d, j) => {
                  const i = g * 4 + j;
                  return (
                    <div key={j} className="h-14 w-9 overflow-hidden rounded bg-white/10 text-3xl font-semibold tabular-nums sm:w-11">
                      <div
                        style={{
                          transform: `translateY(-${seen ? Number(d) * CELL : 0}rem)`,
                          transition: `transform ${900 + i * 70}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 60}ms`,
                        }}>
                        {Array.from({ length: 10 }, (_, n) => (
                          <div key={n} className="flex h-14 items-center justify-center">{n}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Sample ID for illustration. Not a real student.</p>
        </div>
      </div>
    </section>
  );
}
