import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { roleHome } from './types';
import RequireRole from './components/RequireRole';
import Login from './pages/Login';
import Cases from './pages/Cases';
import Landing from './pages/Landing';
import Records from './pages/Records';
import Overview from './pages/Overview';
import Portal from './pages/Portal';
import SiteLayout from './components/SiteLayout';
import About from './pages/About';
import Resources from './pages/Resources';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import CursorDot from './components/CursorDot';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHome[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <>
      <CursorDot />
      <Routes>
        {/* Everything else gets the header + footer */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route element={<RequireRole roles={['AICTE_ADMIN']} />}>
            <Route path="/aicte" element={<Overview scope="aicte" />} />
          </Route>
          <Route element={<RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR']} />}>
            <Route path="/institution" element={<Overview scope="institution" />} />
          </Route>
          <Route element={<RequireRole roles={['AICTE_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR']} />}>
            <Route path="/cases" element={<Cases />} />
          </Route>
          <Route element={<RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR']} />}>
            <Route path="/records" element={<Records />} />
          </Route>
          <Route element={<RequireRole roles={['STUDENT', 'VERIFIER']} />}>
            <Route path="/portal" element={<Portal />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}