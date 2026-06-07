'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from './session-provider';
import { clsx } from './clsx';

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/search', label: 'Search' },
  { href: '/decisions', label: 'Decisions' },
  { href: '/reflect', label: 'Reflect' },
  { href: '/graph', label: 'Graph' },
];

export function Nav() {
  const pathname = usePathname();
  const { session, memberships, activeOrgId, setActiveOrgId, signOut } =
    useSession();

  if (!session) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          OrgBrain
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active =
              l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
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
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none"
            >
              {memberships.map((m) => (
                <option
                  key={m.organization_id}
                  value={m.organization_id}
                  className="bg-[#16161a]"
                >
                  {m.organization?.name ?? m.organization_id.slice(0, 8)} · {m.role}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => void signOut()}
            className="text-sm text-white/50 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
