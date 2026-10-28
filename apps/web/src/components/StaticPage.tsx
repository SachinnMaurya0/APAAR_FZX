import type { ReactNode } from 'react';

export default function StaticPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-[#0f2a47]">{title}</h1>
      {intro && <p className="mt-3 text-lg leading-relaxed text-slate-600">{intro}</p>}
      <div className="mt-8 space-y-4 leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}
