'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/session-provider';
import { Badge, Button, Card, SkeletonCard } from '@/components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import { useToast } from '@/components/toast';
import { api } from '@/lib/api';
import type { Decision, DecisionStatus } from '@/lib/types';

const STATUS_TONE: Record<
  DecisionStatus,
  'neutral' | 'success' | 'warning' | 'danger' | 'info'
> = {
  proposed: 'warning',
  accepted: 'success',
  implemented: 'info',
  rejected: 'danger',
};

export default function DecisionsPage() {
  const { activeOrgId } = useSession();
  const [items, setItems] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const data = await api.get<Decision[]>('/decisions?limit=50', activeOrgId);
    setItems(data);
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activeOrgId) {
    return <p className="text-white/50">Select or create an organisation first.</p>;
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
            <p className="mt-1 text-white/50">Why we decided what we decided.</p>
          </div>
          <Button onClick={() => setOpen(!open)}>
            {open ? 'Close' : '+ New decision'}
          </Button>
        </div>
      </FadeIn>

      {open && (
        <FadeIn>
          <NewDecision
            orgId={activeOrgId}
            onDone={() => {
              setOpen(false);
              void load();
            }}
          />
        </FadeIn>
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <FadeIn>
          <p className="text-sm text-white/40">No decisions yet.</p>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3">
          {items.map((d) => (
            <StaggerItem key={d.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{d.title}</div>
                  <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-white/40">Why: </span>
                    <span className="text-white/80">{d.reason}</span>
                  </p>
                  {d.outcome && (
                    <p>
                      <span className="text-white/40">Outcome: </span>
                      <span className="text-white/80">{d.outcome}</span>
                    </p>
                  )}
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}

function NewDecision({
  orgId,
  onDone,
}: {
  orgId: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(
        '/decisions',
        { title, reason, outcome: outcome || undefined, status: 'accepted' },
        orgId,
      );
      onDone();
      toast.show('Decision saved', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed (need member role?)');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Decision title"
          required
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why did we decide this?"
          required
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <input
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Outcome (optional)"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save decision'}
        </Button>
      </form>
    </Card>
  );
}
