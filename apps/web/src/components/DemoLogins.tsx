import { useEffect, useState } from 'react';

// DEMO ONLY: seeded fake accounts. Remove this component before any real deployment.
const PASSWORD = 'Password123!';
const accounts = [
  { role: 'AICTE admin', email: 'aicte.admin@apaar.gov.in' },
  { role: 'Institute admin', email: 'admin@insta.edu.in' },
  { role: 'Student', email: 'riya.student@example.com' },
  { role: 'Verifier', email: 'verifier@example.com' },
];

type Props = {
  /** Optional: if given, a "Use" button fills the login form. */
  onUse?: (email: string, password: string) => void;
};

export default function DemoLogins({ onUse }: Props) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(c => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard blocked: user can still select the text */
    }
  }

  const btn =
    'rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e07b00]';

  return (
    <aside
      aria-label="Demo accounts"
      className={`w-full max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e07b00] opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#e07b00]" />
        </span>
        <p className="font-semibold text-slate-900">Demo accounts</p>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Fake data for the hackathon demo. Password for all: <code className="font-mono">{PASSWORD}</code>
      </p>

      <ul className="mt-3 divide-y divide-amber-200">
        {accounts.map((a, i) => (
          <li
            key={a.email}
            style={{ transitionDelay: `${150 + i * 90}ms` }}
            className={`flex items-center justify-between gap-2 py-2 transition-opacity duration-500 motion-reduce:transition-none ${
              shown ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{a.role}</p>
              <p className="truncate font-mono text-xs text-slate-600">{a.email}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" className={btn} onClick={() => copy(a.email, a.email)}>
                {copied === a.email ? 'Copied' : 'Copy'}
              </button>
              {onUse && (
                <button type="button" className={btn} onClick={() => onUse(a.email, PASSWORD)}>
                  Use
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
