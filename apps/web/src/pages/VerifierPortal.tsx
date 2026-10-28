import { useState, type FormEvent } from 'react';
import axios from 'axios';

type Enrolment = {
  id: string;
  institution: { name: string; aicteCode: string };
  programme: { name: string; academicYear: string };
  status: string;
  seatType: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
};
type Result = { apaarId: string; fullName: string; currentlyEnrolled: boolean; enrolments: Enrolment[] };

const day = (s: string | null) => (s ? s.slice(0, 10) : 'Open');

export default function VerifierPortal() {
  const [apaarId, setApaarId] = useState('');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      // Same-origin via the Vite proxy, so the session cookie is sent automatically.
      const { data } = await axios.post<Result>('/api/verify/lookup', { apaarId, dateOfBirth: dob });
      setResult(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const msg = err.response.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Lookup failed.');
      } else {
        setError('Could not reach the server. Is the API running?');
      }
    } finally {
      setBusy(false);
    }
  }

  const input =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Verify a student</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the student's APAAR ID and date of birth. Both must match to show a record.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="apaar" className="block text-sm font-medium text-slate-700">APAAR ID (12 digits)</label>
          <input id="apaar" inputMode="numeric" required pattern="[0-9 ]{12,14}" value={apaarId}
            onChange={(e) => setApaarId(e.target.value)} className={`${input} font-mono`} placeholder="1234 5678 9012" />
        </div>
        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-slate-700">Date of birth</label>
          <input id="dob" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className={input} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {busy ? 'Checking…' : 'Verify'}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="max-w-2xl rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {result && (
        <section aria-label="Verification result" className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">{result.fullName}</p>
              <p className="font-mono text-sm text-slate-500">{result.apaarId}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              result.currentlyEnrolled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
              {result.currentlyEnrolled ? 'Currently enrolled' : 'No current enrolment'}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Institution</th>
                  <th className="py-2 pr-4 font-medium">Programme</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">From</th>
                  <th className="py-2 font-medium">To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.enrolments.length === 0 && (
                  <tr><td colSpan={5} className="py-3 text-slate-500">No enrolments on record.</td></tr>
                )}
                {result.enrolments.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-4">{e.institution.name}</td>
                    <td className="py-2 pr-4">{e.programme.name} ({e.programme.academicYear})</td>
                    <td className="py-2 pr-4">{e.status.replace(/_/g, ' ').toLowerCase()}</td>
                    <td className="py-2 pr-4">{day(e.startDate)}</td>
                    <td className="py-2">{day(e.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="max-w-2xl text-xs text-slate-500">
        Prototype: student consent and a full audit log are not built yet. Demo data only.
      </p>
    </div>
  );
}
