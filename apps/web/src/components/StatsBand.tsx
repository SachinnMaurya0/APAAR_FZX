import { useEffect, useRef, useState } from 'react';

type Stat = { value: number; suffix?: string; label: string; note: string };

// These match the seeded demo data. Update them if the seed changes.
const STATS: Stat[] = [
  { value: 12, label: 'digits in every APAAR ID', note: 'One lifelong number per student' },
  { value: 10, label: 'institutions in the demo', note: 'Each sees only its own records' },
  { value: 200, label: 'student records in the demo', note: 'Demo data only, no real people' },
];

function useCountUp(target: number, start: boolean, reduce: boolean, ms = 1600) {
  const [n, setN] = useState(reduce ? target : 0);
  useEffect(() => {
    if (!start || reduce) {
      if (reduce) setN(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, reduce, ms]);
  return n;
}

function StatCard({ stat, seen, reduce, index }: { stat: Stat; seen: boolean; reduce: boolean; index: number }) {
  const n = useCountUp(stat.value, seen, reduce);
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      style={{
        transform: seen ? 'translateY(0)' : 'translateY(24px)',
        opacity: seen ? 1 : 0,
        transition: `transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 120}ms, opacity 600ms ease-out ${index * 120}ms`,
      }}
    >
      <p className="text-6xl font-bold tabular-nums text-[#0f2a47] sm:text-7xl">
        {n}
        {stat.suffix}
      </p>
      <p className="mt-3 text-base font-semibold text-slate-800">{stat.label}</p>
      <p className="mt-1 text-sm text-slate-500">{stat.note}</p>
    </div>
  );
}

/** Three big animated numbers. Plays once when scrolled into view. */
export default function StatsBand() {
  const ref = useRef<HTMLElement>(null);
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [seen, setSeen] = useState(reduce);

  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);

  return (
    <section ref={ref} aria-label="Platform at a glance" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} seen={seen} reduce={reduce} index={i} />
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Figures from the prototype's demo data.</p>
      </div>
    </section>
  );
}
