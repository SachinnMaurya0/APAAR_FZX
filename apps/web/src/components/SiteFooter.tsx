import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

const a = 'rounded text-sm text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e07b00]';

export default function SiteFooter() {
  const ref = useRef<HTMLElement>(null);
  // Reduced motion: start in the final state so nothing animates.
  const [seen, setSeen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);

  // Each block rises into place, one after another.
  const rise = (i: number): CSSProperties => ({
    transform: seen ? 'translateY(0)' : 'translateY(24px)',
    opacity: seen ? 1 : 0,
    transition: `transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 120}ms, opacity 600ms ease-out ${i * 120}ms`,
  });

  return (
    <footer ref={ref} className="bg-[#0f2a47] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-2" style={rise(0)}>
          <p className="text-base font-semibold text-white">APAAR FZX</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed">
            A prototype for Smart India Hackathon 2026 (PS 26263). It runs on demo data only, so please do not enter real student records.
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed">
            Not affiliated with or endorsed by AICTE, the Ministry of Education or DigiLocker.
          </p>
        </div>
        <nav aria-label="Explore" style={rise(1)}>
          <p className="text-sm font-semibold text-white">Explore</p>
          <ul className="mt-3 space-y-2">
            <li><Link className={a} to="/#about">About APAAR</Link></li>
            <li><Link className={a} to="/#faq">FAQ</Link></li>
            <li><Link className={a} to="/about">About us</Link></li>
            <li><Link className={a} to="/resources">Resources</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal and code" style={rise(2)}>
          <p className="text-sm font-semibold text-white">Legal and code</p>
          <ul className="mt-3 space-y-2">
            <li><Link className={a} to="/terms">Terms of use</Link></li>
            <li><Link className={a} to="/privacy">Privacy policy</Link></li>
            <li><a className={a} href="https://github.com/SachinnMaurya0/APAAR_FZX" target="_blank" rel="noreferrer">Source on GitHub</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs" style={rise(3)}>
        © 2026 APAAR FZX team. Prototype, not an official government service.
      </div>
    </footer>
  );
}
