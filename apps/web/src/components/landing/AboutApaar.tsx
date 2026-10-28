const doing = [
  ['Keys records by APAAR ID', 'Institutions submit student and enrolment records against the 12-digit ID.'],
  ['Checks the format', 'IDs that are not 12 digits are rejected. Foreign nationals without an ID are handled separately.'],
  ['Blocks double enrolment', 'The database refuses overlapping confirmed enrolments for one student. Same-day transfers are allowed.'],
  ['Shows seat usage', 'AICTE and institutions see enrolments against approved intake for each programme.'],
];

export default function AboutApaar() {
  return (
    <section id="about" aria-labelledby="about-apaar" className="scroll-mt-16 bg-[#f5f7fa] py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2">
        <div>
          <h2 id="about-apaar" className="text-3xl font-semibold tracking-tight text-[#0f2a47]">About APAAR</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-slate-700">
            APAAR stands for Automated Permanent Academic Account Registry. It gives every student in India one lifelong
            12-digit ID, part of the "One Nation, One Student ID" initiative under the National Education Policy 2020.
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-slate-700">
            Because the same ID is used everywhere, a student's academic record can move with them from school to
            college, and institutions can tell when two records belong to the same person.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-[#0f2a47]">What this platform does with it</h3>
          <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
            {doing.map(([t, d]) => (
              <div key={t} className="py-4">
                <dt className="font-medium text-slate-900">{t}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
