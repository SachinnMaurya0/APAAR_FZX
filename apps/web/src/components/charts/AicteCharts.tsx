import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import BarChart, { type BarDatum } from './BarChart';
import PieChart, { type Slice } from './PieChart';

// SAMPLE DATA for illustration, not from the database.
const monthly: BarDatum[] = [
  { label: 'Apr', value: 310 },
  { label: 'May', value: 460 },
  { label: 'Jun', value: 720 },
  { label: 'Jul', value: 1240 },
  { label: 'Aug', value: 1580 },
  { label: 'Sep', value: 940 },
  { label: 'Oct', value: 510 },
];

// ASSUMPTION: GET /enrolments returns rows with these fields (as an array, or { data | items }).
type Row = {
  status: string;
  seatType: string;
  isNri?: boolean;
  isOci?: boolean;
  isForeignNational?: boolean;
};

const COLORS: Record<string, string> = {
  Regular: '#4f46e5',
  'Lateral entry': '#0ea5e9',
  Supernumerary: '#10b981',
  NRI: '#f59e0b',
  OCI: '#8b5cf6',
  'Foreign national': '#ef4444',
};

function category(r: Row): string {
  if (r.isForeignNational) return 'Foreign national';
  if (r.isNri) return 'NRI';
  if (r.isOci) return 'OCI';
  if (r.seatType === 'LATERAL_ENTRY') return 'Lateral entry';
  if (r.seatType === 'SUPERNUMERARY') return 'Supernumerary';
  return 'Regular';
}

export default function AicteCharts() {
  const { data, isLoading, isError } = useQuery<Row[]>({
    queryKey: ['aicte-charts-enrolments'],
    queryFn: async () => {
      const res = (await api.get('/enrolments')).data;
      return Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
    },
    retry: false,
  });

  // "Approved" = confirmed enrolments (ACTIVE or ON_BREAK), the same rule the dashboard counts use.
  const counts: Record<string, number> = {};
  (data ?? [])
    .filter((r) => r.status === 'ACTIVE' || r.status === 'ON_BREAK')
    .forEach((r) => {
      const c = category(r);
      counts[c] = (counts[c] ?? 0) + 1;
    });
  const slices: Slice[] = Object.entries(counts).map(([label, value]) => ({ label, value, color: COLORS[label] }));

  const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';

  return (
    <section aria-label="Charts" className="grid gap-4 md:grid-cols-2">
      <div className={card}>
        <h2 className="font-semibold text-slate-900">Registrations per month</h2>
        <p className="mb-3 text-xs text-slate-500">Sample data for illustration, 2026.</p>
        <BarChart data={monthly} ariaLabel="Bar chart of sample registrations per month, April to October 2026" />
      </div>

      <div className={card}>
        <h2 className="font-semibold text-slate-900">Approved registrations by category</h2>
        <p className="mb-3 text-xs text-slate-500">Live data. Active and on-break enrolments only.</p>
        {isLoading && <p className="py-10 text-center text-sm text-slate-500">Loading…</p>}
        {isError && <p className="py-10 text-center text-sm text-red-600">Could not load enrolments.</p>}
        {!isLoading && !isError && (
          <PieChart data={slices} ariaLabel="Pie chart of approved registrations by category" />
        )}
      </div>
    </section>
  );
}
