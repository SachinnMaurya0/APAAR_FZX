import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { errorText } from '../../lib/errors';
import { downloadTemplate, readImportFile, type ImportRow } from '../../lib/csv';

interface RowResult {
  row: number;
  ok: boolean;
  error?: string;
}
interface ImportResponse {
  dryRun: boolean;
  total: number;
  ok: number;
  failed: number;
  results: RowResult[];
}

export default function ImportTab() {
  const qc = useQueryClient();
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [report, setReport] = useState<ImportResponse | null>(null);

  const run = useMutation({
    mutationFn: async (dryRun: boolean) =>
      (await api.post<ImportResponse>('/records/import', { rows, dryRun })).data,
    onSuccess: (data) => {
      setReport(data);
      if (!data.dryRun) {
        qc.invalidateQueries({ queryKey: ['enrolments'] });
        qc.invalidateQueries({ queryKey: ['overview'] });
      }
    },
  });

  async function onFile(file: File | undefined) {
    setReport(null);
    run.reset();
    if (!file) return;
    setFileName(file.name);
    const parsed = readImportFile(await file.text());
    setRows(parsed.rows);
    setProblem(parsed.problem);
  }

  const failures = report?.results.filter((r) => !r.ok) ?? [];

  return (
    <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Import from a CSV file</h2>
      <p className="mt-1 text-sm text-slate-500">
        One row per student enrolment, up to 1000 rows. Check the file first: nothing is saved until you import.
      </p>

      <button onClick={downloadTemplate} className="mt-3 text-sm font-medium text-indigo-700 underline underline-offset-4">
        Download the template
      </button>

      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-700" htmlFor="csv">
          CSV file
        </label>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="mt-1 block text-sm"
        />
      </div>

      {problem && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {problem}
        </p>
      )}
      {fileName && !problem && (
        <p className="mt-4 text-sm text-slate-600">
          {fileName}: {rows.length} {rows.length === 1 ? 'row' : 'rows'} found.
        </p>
      )}
      {run.isError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorText(run.error)}
        </p>
      )}

      {rows.length > 0 && !problem && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => run.mutate(true)}
            disabled={run.isPending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60"
          >
            {run.isPending && run.variables === true ? 'Checking…' : 'Check file'}
          </button>
          <button
            onClick={() => run.mutate(false)}
            disabled={run.isPending || (report?.dryRun === true && report.ok === 0)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {run.isPending && run.variables === false ? 'Importing…' : 'Import'}
          </button>
        </div>
      )}

      {report && (
        <div className="mt-5" role="status">
          <p className="text-sm font-medium">
            {report.dryRun
              ? `Check complete: ${report.ok} ready, ${report.failed} with problems.`
              : `Import complete: ${report.ok} added, ${report.failed} skipped.`}
          </p>
          {report.dryRun && report.failed > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Rows with problems are skipped when you import. Fix them in the file and check again, or import the rest.
            </p>
          )}
          {failures.length > 0 && (
            <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Problem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failures.slice(0, 100).map((f) => (
                    <tr key={f.row}>
                      <td className="px-3 py-2 whitespace-nowrap">{f.row + 1}</td>
                      <td className="px-3 py-2 text-red-700">{f.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {failures.length > 100 && (
            <p className="mt-2 text-xs text-slate-500">Showing the first 100 problems.</p>
          )}
        </div>
      )}
    </div>
  );
}
