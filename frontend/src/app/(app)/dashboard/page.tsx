'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/session-provider';
import { Button, Card } from '@/components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import { useToast } from '@/components/toast';
import { api } from '@/lib/api';
import type { Organization } from '@/lib/types';

export default function OverviewPage() {
  const { me, memberships, activeOrgId, refreshMe, setActiveOrgId } =
    useSession();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
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
      toast.show('Organisation created', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{me?.user.email ? `, ${me.user.email}` : ''}
        </h1>
        <p className="mt-1 text-white/50">
          Your organisation&apos;s memory — knowledge, decisions and lessons.
        </p>
      </FadeIn>

      {memberships.length === 0 ? (
        <FadeIn delay={0.1}>
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
        </FadeIn>
      ) : (
        <>
          <FadeIn delay={0.05}>
            <Card className="border-indigo-500/20 bg-indigo-500/[0.03]">
              <h2 className="mb-2 text-sm font-medium text-indigo-300">
                👋 Welcome to your workspace
              </h2>
              <p className="mb-3 text-sm text-white/60">
                We&apos;ve added demo data so you can explore right away. Try these:
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <OnboardingStep
                  n={1}
                  title="Search"
                  desc='Try "Postgres" in semantic search'
                  href="/search"
                />
                <OnboardingStep
                  n={2}
                  title="Reflect"
                  desc="Paste meeting notes and watch AI extract insights"
                  href="/reflect"
                />
                <OnboardingStep
                  n={3}
                  title="Graph"
                  desc="Visualise how knowledge connects"
                  href="/graph"
                />
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.1}>
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
          </FadeIn>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StaggerItem>
              <QuickLink
                href="/search"
                title="Search"
                desc="Find anything by meaning"
              />
            </StaggerItem>
            <StaggerItem>
              <QuickLink
                href="/decisions"
                title="Decisions"
                desc="Why we decided things"
              />
            </StaggerItem>
            <StaggerItem>
              <QuickLink
                href="/lessons"
                title="Lessons"
                desc="What we learned"
              />
            </StaggerItem>
            <StaggerItem>
              <QuickLink
                href="/reflect"
                title="Reflect"
                desc="Extract knowledge from text"
              />
            </StaggerItem>
            <StaggerItem>
              <QuickLink
                href="/graph"
                title="Graph"
                desc="Visualise connections"
              />
            </StaggerItem>
            <StaggerItem>
              <QuickLink
                href="/api-keys"
                title="API Keys"
                desc="Programmatic access"
              />
            </StaggerItem>
          </StaggerContainer>

          <FadeIn delay={0.4}>
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
          </FadeIn>
        </>
      )}
    </div>
  );
}

function OnboardingStep({
  n,
  title,
  desc,
  href,
}: {
  n: number;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-indigo-400/40 hover:bg-white/[0.05]">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300">
          {n}
        </span>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-white/50">{desc}</div>
        </div>
      </div>
    </Link>
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
