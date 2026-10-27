import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { roleHome } from '../types';

// ---- Timeline demo: dates are the same ones the seed data uses --------------------------
const AXIS_START = Date.UTC(2025, 7, 1); // 1 Aug 2025
const AXIS_END = Date.UTC(2026, 7, 1); // 1 Aug 2026
const pct = (y: number, m: number, d: number) =>
  ((Date.UTC(y, m - 1, d) - AXIS_START) / (AXIS_END - AXIS_START)) * 100;

const TRANSFER = pct(2026, 1, 12);
const CLASH_START = pct(2026, 3, 1);

const months = [
  { label: 'Aug', at: pct(2025, 8, 1) },
  { label: 'Nov', at: pct(2025, 11, 1) },
  { label: 'Feb', at: pct(2026, 2, 1) },
  { label: 'May', at: pct(2026, 5, 1) },
];

function Timeline() {
  return (
    <figure
      className="rounded-2xl border border-slate-300 bg-white p-5 sm:p-6"
      aria-label="Example: one student, two colleges, no overlap allowed"
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-display text-lg font-semibold">Riya Test</span>
        <span className="font-mono text-xs text-slate-500">APAAR 100000000001 · demo data</span>
      </figcaption>

      <div className="relative mt-6 h-[188px]">
        {/* month gridlines */}
        {months.map((m) => (
          <div
            key={m.label}
            className="absolute top-0 bottom-6 border-l border-dashed border-slate-200"
            style={{ left: `${m.at}%` }}
          >
            <span className="absolute -bottom-6 left-1 text-xs text-slate-500">{m.label}</span>
          </div>
        ))}

        {/* the transfer seam */}
        <div
          className="absolute top-0 bottom-6 w-px bg-slate-900"
          style={{ left: `${TRANSFER}%` }}
        />

        {/* enrolment 1 */}
        <div className="absolute top-0 h-11" style={{ left: 0, width: `${TRANSFER}%` }}>
          <div className="flex h-full items-center rounded-l-md bg-slate-200 px-3 text-xs font-medium text-slate-700">
            <span className="truncate">Test Institute · left</span>
          </div>
        </div>

        {/* enrolment 2 */}
        <div className="absolute top-14 h-11" style={{ left: `${TRANSFER}%`, right: 0 }}>
          <div className="flex h-full items-center rounded-r-md bg-emerald-700 px-3 text-xs font-medium text-white">
            <span className="truncate">Demo College · active</span>
          </div>
        </div>

        {/* the refused enrolment */}
        <div className="absolute top-28 h-11" style={{ left: `${CLASH_START}%`, right: 0 }}>
          <div className="clash-draw flex h-full items-center rounded-md border-2 border-dashed border-red-600 bg-red-50 px-3 text-xs font-medium text-red-800">
            <span className="truncate">Refused: overlaps</span>
          </div>
        </div>
      </div>

      <p className="mt-8 max-w-prose text-sm leading-relaxed text-slate-600">
        Leaving one college and joining another on the same day is accepted. A second college
        claiming the same student while the first enrolment is still confirmed is refused by the
        database itself.
      </p>
    </figure>
  );
}

// ---- Page -------------------------------------------------------------------------------
const built = [
  'Sign-in with separate access for AICTE, institutions, students and verifiers',
  'Approved intake against confirmed and pending enrolment, by programme, for any date',
  'Over-intake flagged automatically, with supernumerary seats counted apart',
  'Overlapping confirmed enrolments blocked at the database',
  'Students without an APAAR ID, such as foreign nationals, recorded properly',
  'A case register for problems that need a person to decide',
  'A student view of their own enrolment history, printable',
];

const planned = [
  'Bulk upload of student data from institutions',
  'Automatic checks on every upload',
  'Signed, QR-verifiable records',
  'Student consent before a verifier sees a record',
  'Verifier lookup',
  'Anomaly detection with reasons shown',
];

const roles = [
  {
    who: 'AICTE',
    does: 'See every institution and programme in one table. Spot over-intake without waiting for a report.',
  },
  {
    who: 'Institutions',
    does: 'See only your own programmes and students. Never another college’s.',
  },
  {
    who: 'Students',
    does: 'Open your own record, with every college you have been enrolled in, and print it.',
  },
  {
    who: 'Verifiers',
    does: 'Confirm that a student is enrolled. Coming next.',
  },
];

export default function Landing() {
  const { user, loading } = useAuth();

  const cta =
    !loading && user ? (
      <Link
        to={roleHome[user.role]}
        className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Open your dashboard
      </Link>
    ) : (
      <Link
        to="/login"
        className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Sign in
      </Link>
    );

  return (
    <div className="min-h-screen bg-slate-100 font-body text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="font-display text-base font-semibold">APAAR Student Verification</span>
        {!loading && user ? (
          <Link to={roleHome[user.role]} className="text-sm font-medium underline-offset-4 hover:underline">
            Dashboard
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        )}
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-16 lg:pb-24">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              One student. One college at a time.
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-slate-700">
              Institutions report enrolment against each student’s APAAR ID. The platform keeps
              the record straight: no double enrolment, no seats over approved intake, and a clear
              view for AICTE.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {cta}
              <a href="#status" className="text-sm font-medium underline underline-offset-4">
                What works today
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Prototype for Smart India Hackathon 2026, problem statement 26263. All data shown is
              fake.
            </p>
          </div>
          <Timeline />
        </section>

        {/* roles */}
        <section className="border-t border-slate-300 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Everyone sees what they should, and no more
            </h2>
            <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {roles.map((r) => (
                <div key={r.who} className="border-l-4 border-indigo-600 pl-4">
                  <dt className="font-display text-lg font-semibold">{r.who}</dt>
                  <dd className="mt-1 max-w-[46ch] leading-relaxed text-slate-700">{r.does}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* honest status */}
        <section id="status" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Where the prototype stands</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-emerald-800">Working now</h3>
              <ul className="mt-3 space-y-3">
                {built.map((t) => (
                  <li key={t} className="flex gap-3 leading-relaxed text-slate-800">
                    <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-emerald-700" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-600">Not built yet</h3>
              <ul className="mt-3 space-y-3">
                {planned.map((t) => (
                  <li key={t} className="flex gap-3 leading-relaxed text-slate-600">
                    <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full border-2 border-slate-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 sm:px-6">
          There is no public sign-up. Accounts are created by administrators.
        </div>
      </footer>
    </div>
  );
}
