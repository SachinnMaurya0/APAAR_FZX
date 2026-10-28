import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { errorText, inputClass } from '../../lib/errors';
import { enrolmentStatuses, seatTypes, type Programme } from '../../types';

const empty = {
  fullName: '',
  dateOfBirth: '',
  apaarId: '',
  programmeId: '',
  status: 'ACTIVE',
  seatType: 'REGULAR',
  startDate: '',
  endDate: '',
  isNri: false,
  isOci: false,
  isForeignNational: false,
};

export default function AddTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const programmes = useQuery<Programme[]>({
    queryKey: ['programmes'],
    queryFn: async () => (await api.get<Programme[]>('/programmes')).data,
  });

  const save = useMutation({
    mutationFn: async () =>
      (
        await api.post('/records', {
          ...form,
          isNri: form.isNri ? 'yes' : 'no',
          isOci: form.isOci ? 'yes' : 'no',
          isForeignNational: form.isForeignNational ? 'yes' : 'no',
        })
      ).data,
    onSuccess: () => {
      setMessage({ kind: 'ok', text: `${form.fullName} was added.` });
      setForm({ ...empty, programmeId: form.programmeId });
      qc.invalidateQueries({ queryKey: ['enrolments'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (e) => setMessage({ kind: 'error', text: errorText(e) }),
  });

  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Add one student</h2>
      <p className="mt-1 text-sm text-slate-500">
        This records the student and their enrolment together. If the APAAR ID already exists, the name and date of
        birth must match.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Full name
          <input required className={inputClass} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Date of birth
          <input required type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          APAAR ID {form.isForeignNational ? '(optional)' : ''}
          <input
            inputMode="numeric"
            maxLength={12}
            placeholder="12 digits"
            className={inputClass}
            value={form.apaarId}
            onChange={(e) => set('apaarId', e.target.value.trim())}
          />
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Programme
          <select required className={inputClass} value={form.programmeId} onChange={(e) => set('programmeId', e.target.value)}>
            <option value="">Choose a programme</option>
            {(programmes.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.academicYear} · shift {p.shift}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Status
          <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {enrolmentStatuses.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Seat type
          <select className={inputClass} value={form.seatType} onChange={(e) => set('seatType', e.target.value)}>
            {seatTypes.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Start date
          <input required type="date" className={inputClass} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          End date (leave empty if ongoing)
          <input type="date" className={inputClass} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-700">
        {(
          [
            ['isNri', 'NRI'],
            ['isOci', 'OCI'],
            ['isForeignNational', 'Foreign national'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${message.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={save.isPending}
        className="mt-5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {save.isPending ? 'Saving…' : 'Add student'}
      </button>
    </form>
  );
}
