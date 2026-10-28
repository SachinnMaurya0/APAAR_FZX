import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../auth';
import type { ProgrammeOverview } from '../types';
import AicteCharts from '../components/charts/AicteCharts';

function Card({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${danger && value > 0 ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ row }: { row: ProgrammeOverview }) {
  if (row.overIntake) {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Over intake</span>;
  }
  if (row.pending.total > 0) {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pending review</span>;
  }
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Within intake</span>;
}

// Today's date in the user's own timezone, as YYYY-MM-DD.
// (toISOString() would give yesterday's date in India before 5:30 am.)
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Overview({ scope }: { scope: 'aicte' | 'institution' }) {
  const { user } = useAuth();
  const [asOf, setAsOf] = useState(todayLocal);

  const { data, isLoading, isError } = useQuery<ProgrammeOverview[]>({
    queryKey: ['overview', asOf],
    queryFn: async () =>
      (await api.get<ProgrammeOverview[]>('/dashboards/overview', { params: asOf ? { asOf } : {} })).data,
  });

  const rows = data ?? [];
  const institutions = new Set(rows.map((r) => r.institution.id)).size;
  const confirmed = rows.reduce((s, r) => s + r.confirmed.total, 0);
  const pending = rows.reduce((s, r) => s + r.pending.total, 0);
  const over = rows.filter((r) => r.overIntake).length;
  const isAicte = scope === 'aicte';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {isAicte ? 'National overview' : (user?.institution?.name ?? 'Institution dashboard')}
          </h1>
          <p className="text-sm text-slate-500">
            {isAicte
              ? 'Admissions against approved intake across all institutions.'
              : 'Your programmes: approved intake against enrolment.'}
          </p>
        </div>
        <label className="text-sm text-slate-600">
          As of date
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value || todayLocal())}
            className="ml-2 rounded-lg border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className={`mt-4 grid gap-3 ${isAicte ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
        {isAicte && <Card label="Institutions" value={institutions} />}
        <Card label="Programmes" value={rows.length} />
        <Card label="Confirmed enrolments" value={confirmed} />
        <Card label="Pending review" value={pending} />
        <Card label="Over-intake programmes" value={over} danger />
      </div>

      {isAicte && (
        <div className="mt-6">
          <AicteCharts />
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {isAicte && <th className="px-4 py-3">Institution</th>}
              <th className="px-4 py-3">Programme</th>
              <th className="px-4 py-3">Year · Shift</th>
              <th className="px-4 py-3 text-right">Approved intake</th>
              <th className="px-4 py-3 text-right">Confirmed</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Lateral</th>
              <th className="px-4 py-3 text-right">Supernumerary</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td className="px-4 py-6 text-slate-500" colSpan={9}>Loading…</td></tr>
            )}
            {isError && (
              <tr><td className="px-4 py-6 text-red-600" colSpan={9}>Could not load the dashboard.</td></tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr><td className="px-4 py-6 text-slate-500" colSpan={9}>No programmes found.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.programmeId} className={r.overIntake ? 'bg-red-50/40' : ''}>
                {isAicte && (
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.institution.name}</div>
                    <div className="text-xs text-slate-500">{r.institution.aicteCode}</div>
                  </td>
                )}
                <td className="px-4 py-3 font-medium">{r.programmeName}</td>
                <td className="px-4 py-3">{r.academicYear} · {r.shift}</td>
                <td className="px-4 py-3 text-right">{r.approvedIntake}</td>
                <td className="px-4 py-3 text-right">{r.confirmed.regular}</td>
                <td className="px-4 py-3 text-right">{r.pending.total}</td>
                <td className="px-4 py-3 text-right">{r.confirmed.lateral} / {r.lateralIntake}</td>
                <td className="px-4 py-3 text-right">{r.supernumerary}</td>
                <td className="px-4 py-3"><StatusBadge row={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}