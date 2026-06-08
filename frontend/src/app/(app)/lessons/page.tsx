'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/session-provider';
import { Badge, Button, Card, SkeletonCard } from '@/components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import { useToast } from '@/components/toast';
import { api } from '@/lib/api';
import type { Lesson } from '@/lib/types';

export default function LessonsPage() {
  const { activeOrgId } = useSession();
  const [items, setItems] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const data = await api.get<Lesson[]>('/lessons?limit=50', activeOrgId);
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
            <h1 className="text-2xl font-semibold tracking-tight">Lessons</h1>
            <p className="mt-1 text-white/50">What we learned and how we fixed it.</p>
          </div>
          <Button onClick={() => setOpen(!open)}>
            {open ? 'Close' : '+ New lesson'}
          </Button>
        </div>
      </FadeIn>

      {open && (
        <FadeIn>
          <NewLesson
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
          <p className="text-sm text-white/40">No lessons yet.</p>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3">
          {items.map((l) => (
            <StaggerItem key={l.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{l.problem}</div>
                  <Badge tone="info">{Math.round(l.confidence * 100)}% confidence</Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-white/40">Solution: </span>
                    <span className="text-white/80">{l.solution}</span>
                  </p>
                  {l.result && (
                    <p>
                      <span className="text-white/40">Result: </span>
                      <span className="text-white/80">{l.result}</span>
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

function NewLesson({
  orgId,
  onDone,
}: {
  orgId: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(
        '/lessons',
        { problem, solution, result: result || undefined, confidence: 0.7 },
        orgId,
      );
      onDone();
      toast.show('Lesson saved', 'success');
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
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="What was the problem?"
          required
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="How did we solve it?"
          required
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <input
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="Result (optional)"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save lesson'}
        </Button>
      </form>
    </Card>
  );
}
