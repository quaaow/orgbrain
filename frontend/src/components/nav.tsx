'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from './session-provider';
import { clsx } from './clsx';

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/search', label: 'Search' },
  { href: '/decisions', label: 'Decisions' },
  { href: '/lessons', label: 'Lessons' },
  { href: '/reflect', label: 'Reflect' },
  { href: '/graph', label: 'Graph' },
  { href: '/members', label: 'Members' },
  { href: '/api-keys', label: 'API Keys' },
];

export function Nav() {
  const pathname = usePathname();
  const { session, memberships, activeOrgId, setActiveOrgId, signOut } =
    useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          OrgBrain
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {memberships.length > 0 && (
            <select
              value={activeOrgId ?? ''}
              onChange={(e) => setActiveOrgId(e.target.value)}
              className="max-w-[140px] truncate rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none sm:max-w-[200px]"
            >
              {memberships.map((m) => (
                <option
                  key={m.organization.id}
                  value={m.organization.id}
                  className="bg-[#16161a]"
                >
                  {m.organization.name ?? m.organization.id.slice(0, 8)} · {m.role}
                </option>
              ))}
            </select>
          )}

          {/* Mobile burger */}
          <button
            className="flex h-8 w-8 flex-col items-center justify-center gap-1 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={clsx('block h-0.5 w-5 bg-white/70 transition-transform', menuOpen && 'translate-y-1.5 rotate-45')} />
            <span className={clsx('block h-0.5 w-5 bg-white/70 transition-opacity', menuOpen && 'opacity-0')} />
            <span className={clsx('block h-0.5 w-5 bg-white/70 transition-transform', menuOpen && '-translate-y-1.5 -rotate-45')} />
          </button>

          <button
            onClick={() => void signOut()}
            className="hidden text-sm text-white/50 hover:text-white sm:block"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#0a0a0b]/95 px-5 pb-4 pt-2 md:hidden">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={() => void signOut()}
            className="mt-2 block w-full px-3 py-2 text-left text-sm text-white/50 hover:text-white sm:hidden"
          >
            Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
