import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { errorText, inputClass } from '../../lib/errors';
import type { Programme } from '../../types';

function ProgrammeEdit({ p, onClose }: { p: Programme; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(p.name);
  const [academicYear, setAcademicYear] = useState(String(p.academicYear));
  const [shift, setShift] = useState(String(p.shift));
  const [error, setError] = useState('');

  const save = useMutation({
    // Intake is never sent: only AICTE can change it
    mutationFn: async () =>
      (await api.patch(`/programmes/${p.id}`, { name, academicYear: Number(academicYear), shift: Number(shift) })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programmes'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      onClose();
    },
    onError: (e) => setError(errorText(e)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Programme name
          <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Academic year
          <input required type="number" min={1990} max={2100} className={inputClass} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Shift
          <input required type="number" min={1} max={5} className={inputClass} value={shift} onChange={(e) => setShift(e.target.value)} />
        </label>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Approved intake ({p.approvedIntake}) and lateral intake ({p.lateralIntake}) are set by AICTE and cannot be edited here.
      </p>
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

export default function ProgrammesTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'INSTITUTION_ADMIN';
  const [editing, setEditing] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<Programme[]>({
    queryKey: ['programmes'],
    queryFn: async () => (await api.get<Programme[]>('/programmes')).data,
  });

  return (
    <div>
      <p className="text-sm text-slate-500">
        {isAdmin
          ? 'You can edit a programme’s name, year and shift. Intake numbers are set by AICTE.'
          : 'Programme details can be changed by your institution admin.'}
      </p>
      {isLoading && <p className="mt-6 text-slate-500">Loading…</p>}
      {isError && <p className="mt-6 text-red-600">Could not load programmes.</p>}
      <ul className="mt-4 space-y-3">
        {(data ?? []).map((p) => (
          <li key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-slate-500">
                  Academic year {p.academicYear} · shift {p.shift}
                </div>
              </div>
              <div className="text-sm text-slate-700">
                Approved intake <span className="font-semibold">{p.approvedIntake}</span>
                {p.lateralIntake > 0 && <> · lateral {p.lateralIntake}</>}
                <span className="ml-2 text-xs text-slate-500">set by AICTE</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setEditing(editing === p.id ? null : p.id)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                >
                  {editing === p.id ? 'Close' : 'Edit'}
                </button>
              )}
            </div>
            {editing === p.id && <ProgrammeEdit p={p} onClose={() => setEditing(null)} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
