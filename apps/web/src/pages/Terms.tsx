import StaticPage from '../components/StaticPage';

export default function Terms() {
  return (
    <StaticPage title="Terms of use" intro="Plain-language terms for this prototype. This is a draft, not legal advice.">
      <p><strong>Prototype only.</strong> This site is a hackathon demonstration. It is not an official government service and comes with no guarantee of accuracy or availability.</p>
      <p><strong>Demo data only.</strong> Use the demo accounts and fake data provided. Do not enter real student information.</p>
      <p><strong>Acceptable use.</strong> Do not try to break into accounts, read another institution's data, or disrupt the service.</p>
      <p><strong>No affiliation.</strong> We are not affiliated with or endorsed by AICTE, the Ministry of Education or DigiLocker.</p>
    </StaticPage>
  );
}
