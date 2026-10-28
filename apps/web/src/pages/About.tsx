import StaticPage from '../components/StaticPage';

export default function About() {
  return (
    <StaticPage title="About us" intro="We are a team of three building a prototype for Smart India Hackathon 2026, problem statement 26263.">
      <p>The problem: AICTE-approved institutions submit student data, and someone has to catch duplicate records, invalid APAAR IDs, intake that exceeds approved seats, and students enrolled in two places at once.</p>
      <p>Our prototype keys every record by APAAR ID, enforces the no-overlap rule in the database, and gives AICTE and each institution a dashboard scoped to what they are allowed to see.</p>
      <p>It is a prototype running on demo data. It is not an official service, and it is not affiliated with AICTE, the Ministry of Education or DigiLocker.</p>
    </StaticPage>
  );
}
