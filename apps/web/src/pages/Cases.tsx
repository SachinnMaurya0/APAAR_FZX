import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '../api';
import { useAuth } from '../auth';
import type { CaseItem, CaseStatus } from '../types';

const typeLabel: Record<CaseItem['type'], string> = {
  OVERLAP: 'Overlapping enrolment',
  INTAKE_EXCEEDED: 'Intake exceeded',
  MISSING_APAAR: 'Missing APAAR ID',
  OTHER: 'Other',
};

const statusStyle: Record<CaseStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  ESCALATED: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-slate-200 text-slate-700',
};

const closed: CaseStatus[] = ['RESOLVED', 'REJECTED'];
const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN');

function ResolveForm({ item, onDone }: { item: CaseItem; onDone: () => void }) {
  const [status, setStatus] = useState<CaseStatus>('RESOLVED');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const m = useMutation({
    mutationFn: async () =>
      (await api.patch(`/cases/${item.id}/resolve`, { status, resolutionNotes: notes })).data,
    onSuccess: onDone,
    onError: (e) =>
      setError(
        axios.isAxiosError(e) && e.response?.status === 403
          ? 'You do not have permission to update this case.'
          : 'Could not save. Try again.',
      ),
  });

  return (
    <form
      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        m.mutate();
      }}
    >
      <div className="flex flex-wrap gap-3">
        <label className="text-sm text-slate-600">
          Outcome
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CaseStatus)}
            className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalate</option>
            <option value="REJECTED">Reject</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-sm text-slate-600" htmlFor={`notes-${item.id}`}>
        Notes
      </label>
      <textarea
        id={`notes-${item.id}`}
        required
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={m.isPending}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {m.isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

export default function Cases() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const [openId, setOpenId] = useState<string | null>(null);

  const canResolve = user?.role === 'AICTE_ADMIN' || user?.role === 'INSTITUTION_ADMIN';
  const isAicte = user?.role === 'AICTE_ADMIN';

  const { data, isLoading, isError } = useQuery<CaseItem[]>({
    queryKey: ['cases'],
    queryFn: async () => (await api.get<CaseItem[]>('/cases')).data,
  });

  const all = data ?? [];
  const rows = all.filter((c) => (filter === 'open' ? !closed.includes(c.status) : closed.includes(c.status)));
  const openCount = all.filter((c) => !closed.includes(c.status)).length;

  return (
    <div>
      <h1 className="text-xl font-semibold">Cases</h1>
      <p className="text-sm text-slate-500">
        {isAicte
          ? 'Problems across all institutions that need a decision.'
          : 'Problems involving your institution that need a decision.'}
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm" role="tablist">
        {(['open', 'closed'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            {f === 'open' ? `Open (${openCount})` : `Closed (${all.length - openCount})`}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-slate-500">Loading…</p>}
      {isError && <p className="mt-6 text-red-600">Could not load cases.</p>}
      {!isLoading && !isError && rows.length === 0 && (
        <p className="mt-6 text-slate-500">
          {filter === 'open' ? 'No open cases. Nothing needs a decision right now.' : 'No closed cases yet.'}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rows.map((c) => (
          <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{typeLabel[c.type]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[c.status]}`}>
                {c.status.replace('_', ' ')}
              </span>
              <span className="ml-auto text-xs text-slate-500">Opened {fmt(c.createdAt)}</span>
            </div>

            {c.enrolment && (
              <p className="mt-2 text-sm text-slate-700">
                {c.enrolment.student.fullName}
                {c.enrolment.student.apaarId ? ` (${c.enrolment.student.apaarId})` : ' (no APAAR ID)'}
                {' · '}
                {c.enrolment.programme.name} {c.enrolment.programme.academicYear},{' '}
                {c.enrolment.programme.institution.name}
              </p>
            )}
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{c.description}</p>

            {c.resolutionNotes && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Decision:</span> {c.resolutionNotes}
              </p>
            )}

            {canResolve && !closed.includes(c.status) && (
              <div className="mt-3">
                {openId === c.id ? (
                  <ResolveForm
                    item={c}
                    onDone={() => {
                      setOpenId(null);
                      qc.invalidateQueries({ queryKey: ['cases'] });
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setOpenId(c.id)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    Decide
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
