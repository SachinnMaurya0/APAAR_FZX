import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { roleHome, roleLabel, type Role } from '../types';

export default function RequireRole({ roles }: { roles: Role[] }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={roleHome[user.role]} replace />;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <div className="font-semibold">APAAR Student Verification</div>
            <div className="text-xs text-slate-500">
              {roleLabel[user.role]}
              {user.institution ? ` · ${user.institution.name}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(user.role === 'AICTE_ADMIN' ||
              user.role === 'INSTITUTION_ADMIN' ||
              user.role === 'INSTITUTION_OPERATOR') && (
              <nav className="flex gap-1 text-sm">
                {[
                  { to: roleHome[user.role], label: 'Overview' },
                  ...(user.role === 'AICTE_ADMIN' ? [] : [{ to: '/records', label: 'Records' }]),
                  { to: '/cases', label: 'Cases' },
                ].map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-1.5 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            )}
            <span className="hidden text-sm text-slate-600 sm:inline">{user.fullName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}