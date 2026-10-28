import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../auth';
import type { StudentRecord } from '../types';
import VerifierPortal from './VerifierPortal';

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { timeZone: 'UTC' }) : 'Ongoing';

export default function Portal() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  const { data, isLoading, isError } = useQuery<StudentRecord>({
    queryKey: ['my-record'],
    queryFn: async () => (await api.get<StudentRecord>('/me/record')).data,
    enabled: isStudent,
    retry: false,
  });

  if (user?.role === 'VERIFIER') return <VerifierPortal />;
  if (!isStudent) return null;
  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (isError || !data) {
    return <p className="text-red-600">We could not find a student record linked to this account.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold">My academic record</h1>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Download / Print
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-slate-400 print:shadow-none">
        <div className="text-xs uppercase tracking-wide text-slate-500">APAAR ID</div>
        <div className="mt-1 font-mono text-2xl font-semibold">
          {data.apaarId ?? 'Not assigned'}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase text-slate-500">Name</div>
            <div className="font-medium">{data.fullName}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Date of birth</div>
            <div className="font-medium">{fmt(data.dateOfBirth)}</div>
          </div>
        </div>

        <h2 className="mt-6 text-sm font-semibold text-slate-700">Enrolment history</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Institution</th>
                <th className="py-2 pr-4">Programme</th>
                <th className="py-2 pr-4">From</th>
                <th className="py-2 pr-4">To</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.enrolments.map((e, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4">{e.programme.institution.name}</td>
                  <td className="py-2 pr-4">{e.programme.name} ({e.programme.academicYear})</td>
                  <td className="py-2 pr-4">{fmt(e.startDate)}</td>
                  <td className="py-2 pr-4">{fmt(e.endDate)}</td>
                  <td className="py-2">{e.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}