import StaticPage from '../components/StaticPage';

const links = [
  ['APAAR (official site)', 'https://apaar.education.gov.in', 'Information about the APAAR ID from the Ministry of Education.'],
  ['Academic Bank of Credits', 'https://www.abc.gov.in', 'The credit registry that students use to create and manage their ID.'],
  ['DigiLocker', 'https://www.digilocker.gov.in', 'Where students keep and share verified documents.'],
  ['AICTE', 'https://www.aicte-india.org', 'The regulator of technical education in India.'],
  ['Smart India Hackathon', 'https://www.sih.gov.in', 'The hackathon this prototype was built for.'],
  ['Source code', 'https://github.com/SachinnMaurya0/APAAR_FZX', 'This project\'s repository.'],
];

export default function Resources() {
  return (
    <StaticPage title="Resources" intro="Official sources for APAAR and the organisations around it. Links open in a new tab.">
      <ul className="divide-y divide-slate-200 border-y border-slate-200">
        {links.map(([t, u, d]) => (
          <li key={u} className="py-4">
            <a href={u} target="_blank" rel="noreferrer" className="font-medium text-[#0f2a47] underline underline-offset-2">{t}</a>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </li>
        ))}
      </ul>
    </StaticPage>
  );
}
