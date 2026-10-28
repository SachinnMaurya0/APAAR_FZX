import { useState } from 'react';
import AddTab from './records/AddTab';
import ImportTab from './records/ImportTab';
import ProgrammesTab from './records/ProgrammesTab';
import StudentsTab from './records/StudentsTab';

const tabs = [
  { id: 'students', label: 'Students' },
  { id: 'add', label: 'Add one' },
  { id: 'import', label: 'Import CSV' },
  { id: 'programmes', label: 'Programmes' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Records() {
  const [tab, setTab] = useState<TabId>('students');

  return (
    <div>
      <h1 className="text-xl font-semibold">Student records</h1>
      <p className="text-sm text-slate-500">Add, import, correct and remove records for your institution.</p>

      <div className="mt-4 inline-flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5 text-sm" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'students' && <StudentsTab />}
        {tab === 'add' && <AddTab />}
        {tab === 'import' && <ImportTab />}
        {tab === 'programmes' && <ProgrammesTab />}
      </div>
    </div>
  );
}
