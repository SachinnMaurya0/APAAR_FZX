import { useSeen } from './useSeen';

export type Slice = { label: string; value: number; color: string };

const S = 220, C = S / 2, R = 100;

function point(angle: number) {
  return [C + R * Math.cos(angle), C + R * Math.sin(angle)] as const;
}

export default function PieChart({ data, ariaLabel }: { data: Slice[]; ariaLabel: string }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0);

  if (total === 0) return <p className="py-10 text-center text-sm text-slate-500">No approved registrations yet.</p>;

  let start = -Math.PI / 2;
  const paths = slices.map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const [x1, y1] = point(start);
    const [x2, y2] = point(start + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
    start += sweep;
    return { ...d, path };
  });

  return (
    <div ref={ref} className="flex flex-col items-center gap-6 sm:flex-row">
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={ariaLabel} className="h-52 w-52 shrink-0"
        style={{
          transform: seen ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-40deg)',
          opacity: seen ? 1 : 0,
          transition: 'transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 600ms ease-out',
        }}>
        {paths.length === 1 ? (
          <circle cx={C} cy={C} r={R} fill={paths[0].color}><title>{`${paths[0].label}: ${paths[0].value}`}</title></circle>
        ) : (
          paths.map((p) => (
            <path key={p.label} d={p.path} fill={p.color} stroke="#fff" strokeWidth="2">
              <title>{`${p.label}: ${p.value}`}</title>
            </path>
          ))
        )}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {slices.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} aria-hidden="true" />
              {d.label}
            </span>
            <span className="tabular-nums text-slate-600">
              {d.value.toLocaleString('en-IN')} ({Math.round((d.value / total) * 100)}%)
            </span>
          </li>
        ))}
        <li className="flex justify-between border-t border-slate-200 pt-2 font-medium">
          <span>Total approved</span>
          <span className="tabular-nums">{total.toLocaleString('en-IN')}</span>
        </li>
      </ul>
    </div>
  );
}
