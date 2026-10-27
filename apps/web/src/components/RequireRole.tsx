import { Navigate, Outlet, useNavigate } from 'react-router-dom';
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