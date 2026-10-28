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

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHome[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
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
    </Routes>
  );
}