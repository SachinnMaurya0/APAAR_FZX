import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth';
import { roleHome } from '../types';

const focus =
  'rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e07b00]';
const linkCls = `${focus} px-2 py-1 text-sm text-slate-700 hover:text-[#0f2a47]`;
const activeCls = 'font-semibold text-[#0f2a47]';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  // ASSUMPTION: useAuth() returns { user } where user.role is a key of roleHome.
  const { user } = useAuth();
  const close = () => setOpen(false);

  const nav = (
    <>
      <Link to="/" className={linkCls} onClick={close}>Home</Link>
      <Link to="/#about" className={linkCls} onClick={close}>About APAAR</Link>
      <Link to="/#faq" className={linkCls} onClick={close}>FAQ</Link>
      <NavLink to="/resources" className={({ isActive }) => `${linkCls} ${isActive ? activeCls : ''}`} onClick={close}>Resources</NavLink>
      <NavLink to="/about" className={({ isActive }) => `${linkCls} ${isActive ? activeCls : ''}`} onClick={close}>About us</NavLink>
    </>
  );

  const cta = user ? (
    <Link to={roleHome[user.role]} onClick={close}
      className={`${focus} rounded-md bg-[#0f2a47] px-4 py-2 text-sm font-medium text-white hover:bg-[#173a5f]`}>
      Open dashboard
    </Link>
  ) : (
    <Link to="/login" onClick={close}
      className={`${focus} rounded-md bg-[#0f2a47] px-4 py-2 text-sm font-medium text-white hover:bg-[#173a5f]`}>
      Sign in
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className={`${focus} flex flex-col leading-none text-[#0f2a47]`} aria-label="ANVAY, Academic Identity Network, home">
          <span className="text-lg font-bold tracking-wide">ANVAY</span>
          <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-widest text-slate-500 sm:block">
            Academic Identity Network
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-3 md:flex">{nav}</nav>
        <div className="hidden md:block">{cta}</div>
        <button type="button" className={`${focus} p-2 md:hidden`} aria-expanded={open}
          aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}>
          <span className="block h-0.5 w-5 bg-slate-800" />
          <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
          <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 md:hidden">
          {nav}
          <div className="pt-2">{cta}</div>
        </nav>
      )}
    </header>
  );
}
