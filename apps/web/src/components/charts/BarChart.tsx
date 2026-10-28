import { useSeen } from './useSeen';

export type BarDatum = { label: string; value: number };

const W = 560, H = 300, L = 48, R = 12, T = 24, B = 34;

export default function BarChart({ data, color = '#4f46e5', ariaLabel }: { data: BarDatum[]; color?: string; ariaLabel: string }) {
  const [ref, seen] = useSeen<SVGSVGElement>();
  const max = Math.max(1, ...data.map((d) => d.value));
  const mag = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / mag) * mag;
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);
  const plotW = W - L - R, plotH = H - T - B;
  const slot = plotW / data.length, bw = Math.min(44, slot * 0.6);
  const y = (v: number) => T + plotH - (v / top) * plotH;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e2e8f0" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{t.toLocaleString('en-IN')}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = L + slot * i + (slot - bw) / 2;
        const h = (d.value / top) * plotH;
        return (
          <g key={d.label}>
            <rect
              x={x} y={y(d.value)} width={bw} height={h} rx="3" fill={color}
              style={{
                transformBox: 'fill-box', transformOrigin: 'bottom',
                transform: seen ? 'scaleY(1)' : 'scaleY(0)',
                transition: `transform 800ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 90}ms`,
              }}
            >
              <title>{`${d.label}: ${d.value.toLocaleString('en-IN')}`}</title>
            </rect>
            <text x={x + bw / 2} y={y(d.value) - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155"
              style={{ opacity: seen ? 1 : 0, transition: `opacity 400ms ease-out ${600 + i * 90}ms` }}>
              {d.value.toLocaleString('en-IN')}
            </text>
            <text x={x + bw / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="#475569">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
