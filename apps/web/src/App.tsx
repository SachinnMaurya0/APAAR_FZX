import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { roleHome } from './types';
import RequireRole from './components/RequireRole';
import Login from './pages/Login';
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
      <Route path="/login" element={<Login />} />
      <Route element={<RequireRole roles={['AICTE_ADMIN']} />}>
        <Route path="/aicte" element={<Overview scope="aicte" />} />
      </Route>
      <Route element={<RequireRole roles={['INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR']} />}>
        <Route path="/institution" element={<Overview scope="institution" />} />
      </Route>
      <Route element={<RequireRole roles={['STUDENT', 'VERIFIER']} />}>
        <Route path="/portal" element={<Portal />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}