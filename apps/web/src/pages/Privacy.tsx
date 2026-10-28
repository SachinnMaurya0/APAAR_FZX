import StaticPage from '../components/StaticPage';

export default function Privacy() {
  return (
    <StaticPage title="Privacy policy" intro="What this prototype stores. This is a draft, not legal advice.">
      <p><strong>Data we hold.</strong> Fake demo records (names, dates of birth, APAAR-style IDs, enrolments) and demo user accounts. No real personal data should be entered.</p>
      <p><strong>Sign-in.</strong> After you sign in, we set one cookie that keeps your session. It is needed for the site to work and expires after 7 days.</p>
      <p><strong>Tracking.</strong> We do not use analytics or advertising trackers. The home page loads fonts from Google Fonts.</p>
      <p><strong>Access.</strong> Each role sees only the data its role allows: AICTE sees all institutions, institutions see their own, and students see their own record.</p>
    </StaticPage>
  );
}
