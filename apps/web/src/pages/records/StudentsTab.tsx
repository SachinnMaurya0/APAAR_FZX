import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { errorText, inputClass } from '../../lib/errors';
import { enrolmentStatuses, seatTypes, type EnrolmentRow } from '../../types';

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { timeZone: 'UTC' }) : 'Ongoing');
const dateValue = (d: string | null) => (d ? d.slice(0, 10) : '');

function EditForm({ row, onClose }: { row: EnrolmentRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [f, setF] = useState({
    fullName: row.student.fullName,
    dateOfBirth: dateValue(row.student.dateOfBirth),
    apaarId: row.student.apaarId ?? '',
    status: row.status,
    seatType: row.seatType,
    startDate: dateValue(row.startDate),
    endDate: dateValue(row.endDate),
    isNri: row.isNri,
    isOci: row.isOci,
    isForeignNational: row.isForeignNational,
  });

  const save = useMutation({
    mutationFn: async () => {
      const studentChanged =
        f.fullName !== row.student.fullName ||
        f.dateOfBirth !== dateValue(row.student.dateOfBirth) ||
        f.apaarId !== (row.student.apaarId ?? '');
      if (studentChanged) {
        await api.patch(`/students/${row.student.id}`, {
          fullName: f.fullName,
          dateOfBirth: f.dateOfBirth,
          ...(row.student.apaarId ? {} : { apaarId: f.apaarId || null }),
        });
      }
      await api.patch(`/enrolments/${row.id}`, {
        status: f.status,
        seatType: f.seatType,
        startDate: f.startDate,
        endDate: f.endDate || null,
        isNri: f.isNri,
        isOci: f.isOci,
        isForeignNational: f.isForeignNational,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolments'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      onClose();
    },
    onError: (e) => setError(errorText(e)),
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
      <p className="text-xs text-slate-500">
        Name and date of birth belong to the student, so colleges that share this student see the change too.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Full name
          <input required className={inputClass} value={f.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Date of birth
          <input required type="date" className={inputClass} value={f.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          APAAR ID
          <input
            disabled={!!row.student.apaarId}
            maxLength={12}
            className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
            value={f.apaarId}
            onChange={(e) => set('apaarId', e.target.value.trim())}
          />
          {row.student.apaarId && <span className="text-xs font-normal text-slate-500">Only AICTE can change this.</span>}
        </label>
        <label className="text-sm font-medium text-slate-700">
          Status
          <select className={inputClass} value={f.status} onChange={(e) => set('status', e.target.value)}>
            {enrolmentStatuses.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toLowerCase()}
              </option>
            ))}
            {f.status === 'PENDING_REVIEW' && <option value="PENDING_REVIEW">pending review</option>}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Seat type
          <select className={inputClass} value={f.seatType} onChange={(e) => set('seatType', e.target.value)}>
            {seatTypes.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <div />
        <label className="text-sm font-medium text-slate-700">
          Start date
          <input required type="date" className={inputClass} value={f.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          End date
          <input type="date" className={inputClass} value={f.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-700">
        {(
          [
            ['isNri', 'NRI'],
            ['isOci', 'OCI'],
            ['isForeignNational', 'Foreign national'],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2">
            <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />
            {label}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {save.isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm hover:bg-white">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function StudentsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'INSTITUTION_ADMIN';
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError } = useQuery<EnrolmentRow[]>({
    queryKey: ['enrolments'],
    queryFn: async () => (await api.get<EnrolmentRow[]>('/enrolments')).data,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/enrolments/${id}`)).data,
    onSuccess: () => {
      setNotice({ kind: 'ok', text: 'The enrolment was removed.' });
      qc.invalidateQueries({ queryKey: ['enrolments'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (e) => setNotice({ kind: 'error', text: errorText(e) }),
  });

  const needle = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (r) =>
      !needle ||
      r.student.fullName.toLowerCase().includes(needle) ||
      (r.student.apaarId ?? '').includes(needle) ||
      r.programme.name.toLowerCase().includes(needle),
  );

  function confirmRemove(r: EnrolmentRow) {
    const ok = window.confirm(
      `Remove ${r.student.fullName} from ${r.programme.name} (${r.programme.academicYear})?\n\n` +
        'This deletes the enrolment record. To keep the history, change the status to withdrawn instead.',
    );
    if (ok) {
      setNotice(null);
      remove.mutate(r.id);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">
          Search
          <input
            className={`${inputClass} w-72`}
            placeholder="Name, APAAR ID or programme"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <p className="text-sm text-slate-500">{rows.length} enrolments</p>
      </div>

      {notice && (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${notice.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}
        >
          {notice.text}
        </p>
      )}
      {isLoading && <p className="mt-6 text-slate-500">Loading…</p>}
      {isError && <p className="mt-6 text-red-600">Could not load students.</p>}
      {!isLoading && !isError && rows.length === 0 && (
        <p className="mt-6 text-slate-500">
          {needle ? 'No students match your search.' : 'No students yet. Use Add one or Import CSV.'}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">{r.student.fullName}</div>
                <div className="font-mono text-xs text-slate-500">{r.student.apaarId ?? 'No APAAR ID'}</div>
              </div>
              <div className="text-sm text-slate-700">
                <div>
                  {r.programme.name} · {r.programme.academicYear} · shift {r.programme.shift}
                </div>
                <div className="text-slate-500">
                  {fmt(r.startDate)} to {fmt(r.endDate)}
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {r.status.replace('_', ' ').toLowerCase()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(editing === r.id ? null : r.id)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                >
                  {editing === r.id ? 'Close' : 'Edit'}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => confirmRemove(r)}
                    disabled={remove.isPending}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            {editing === r.id && (
              <div className="mt-4">
                <EditForm row={r} onClose={() => setEditing(null)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
