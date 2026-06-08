'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/session-provider';
import { Button, Card } from '@/components/ui';
import { api } from '@/lib/api';
import type { Organization } from '@/lib/types';

export default function OverviewPage() {
  const { me, memberships, activeOrgId, refreshMe, setActiveOrgId } =
    useSession();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMembership = memberships.find(
    (m) => m.organization.id === activeOrgId,
  );

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const org = await api.post<Organization>('/organizations', { name });
      await refreshMe();
      setActiveOrgId(org.id);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{me?.user.email ? `, ${me.user.email}` : ''}
        </h1>
        <p className="mt-1 text-white/50">
          Your organisation&apos;s memory — knowledge, decisions and lessons.
        </p>
      </div>

      {memberships.length === 0 ? (
        <Card className="max-w-md">
          <h2 className="mb-1 font-medium">Create your first organisation</h2>
          <p className="mb-4 text-sm text-white/50">
            You&apos;ll be its owner. Everything is scoped per organisation.
          </p>
          <form onSubmit={createOrg} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <Button type="submit" disabled={busy}>
              {busy ? '…' : 'Create'}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/50">Active organisation</div>
                <div className="text-lg font-medium">
                  {activeMembership?.organization.name ?? activeOrgId}
                </div>
              </div>
              <div className="text-sm text-white/50">
                Role: <span className="text-white">{activeMembership?.role}</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              href="/search"
              title="Search"
              desc="Find anything by meaning"
            />
            <QuickLink
              href="/decisions"
              title="Decisions"
              desc="Why we decided things"
            />
            <QuickLink
              href="/lessons"
              title="Lessons"
              desc="What we learned"
            />
            <QuickLink
              href="/reflect"
              title="Reflect"
              desc="Extract knowledge from text"
            />
            <QuickLink
              href="/graph"
              title="Graph"
              desc="Visualise connections"
            />
            <QuickLink
              href="/api-keys"
              title="API Keys"
              desc="Programmatic access"
            />
          </div>

          <Card className="max-w-md">
            <h2 className="mb-3 text-sm font-medium text-white/70">
              Create another organisation
            </h2>
            <form onSubmit={createOrg} className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New org name"
                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <Button type="submit" variant="ghost" disabled={busy}>
                {busy ? '…' : 'Create'}
              </Button>
            </form>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </Card>
        </>
      )}
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-indigo-400/50 hover:bg-white/[0.05]">
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm text-white/50">{desc}</div>
      </Card>
    </Link>
  );
}
