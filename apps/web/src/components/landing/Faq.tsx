import { useState } from 'react';

const items = [
  ['What is an APAAR ID?', 'A permanent 12-digit academic ID for a student in India. It links a student\'s academic records across schools and institutions.'],
  ['Does this platform issue APAAR IDs?', 'No. Students get their ID through the official APAAR route. This platform only uses the ID to key the records that institutions submit.'],
  ['What happens if a student is enrolled in two places at once?', 'The database refuses the second confirmed enrolment when the dates overlap. A transfer that starts the day the previous enrolment ends is allowed.'],
  ['Who can see which data?', 'AICTE staff see all institutions. Institution users see only their own institution. Students see only their own record.'],
  ['Can I enter real student data?', 'No. This is a hackathon prototype with fake demo data only. Please do not enter real student information.'],
  ['What is not built yet?', 'Verifiable certificates, QR credentials, verifier lookup and automatic case creation are planned but not built. The home page lists what works today.'],
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-white py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 id="faq-title" className="text-3xl font-semibold tracking-tight text-[#0f2a47]">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {items.map(([q, a], i) => {
            const open = openIdx === i;
            return (
              <div key={q}>
                <h3>
                  <button type="button" aria-expanded={open} aria-controls={`faq-${i}`}
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e07b00]">
                    {q}
                    <span aria-hidden="true"
                      className={`shrink-0 text-xl leading-none text-[#e07b00] transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-45' : ''}`}>+</span>
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region"
                  className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="pb-4 leading-relaxed text-slate-600">{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
