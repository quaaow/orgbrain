'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/session-provider';
import { Badge, Button, Card, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type {
  ExtractionItem,
  ExtractionStatus,
  ReflectionRun,
  ReflectResult,
} from '@/lib/types';

const STATUS_TONE: Record<
  ExtractionStatus,
  'neutral' | 'success' | 'warning' | 'danger' | 'info'
> = {
  pending: 'neutral',
  approved: 'info',
  rejected: 'danger',
  applied: 'success',
  duplicate: 'warning',
};

export default function ReflectPage() {
  const { activeOrgId } = useSession();
  const MAX_CHARS = 15000;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<ReflectionRun[]>([]);
  const [openRun, setOpenRun] = useState<string | null>(null);
  const overLimit = text.length > MAX_CHARS;

  const loadRuns = useCallback(async () => {
    if (!activeOrgId) return;
    const data = await api.get<ReflectionRun[]>('/reflect/runs', activeOrgId);
    setRuns(data);
  }, [activeOrgId]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  async function runReflect() {
    if (!text.trim() || !activeOrgId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<ReflectResult>(
        '/reflect',
        { text },
        activeOrgId,
      );
      setText('');
      await loadRuns();
      setOpenRun(res.run.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('15000')) {
        setError('Text is too long. Maximum 15000 characters (~3000 words). Split into smaller parts.');
      } else {
        setError(
          msg || 'Reflect failed (LLM may be rate-limited)',
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (!activeOrgId) {
    return <p className="text-white/50">Select or create an organisation first.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reflect</h1>
        <p className="mt-1 text-white/50">
          Paste a postmortem, meeting notes or retro. We extract facts, decisions
          and lessons for you to review before saving.
        </p>
      </div>

      <Card>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste raw text here…"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={overLimit ? 'text-red-400' : 'text-white/40'}>
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </span>
          {overLimit && (
            <span className="text-red-400">Text is too long. Split into smaller parts.</span>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-3">
          <Button onClick={runReflect} disabled={busy || !text.trim() || overLimit}>
            {busy ? 'Extracting…' : 'Extract'}
          </Button>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70">Runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-white/40">No runs yet.</p>
        ) : (
          runs.map((r) => (
            <RunRow
              key={r.id}
              run={r}
              orgId={activeOrgId}
              open={openRun === r.id}
              onToggle={() => setOpenRun(openRun === r.id ? null : r.id)}
              onChanged={loadRuns}
            />
          ))
        )}
      </section>
    </div>
  );
}

function RunRow({
  run,
  orgId,
  open,
  onToggle,
  onChanged,
}: {
  run: ReflectionRun;
  orgId: string;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<ExtractionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ run: ReflectionRun; items: ExtractionItem[] }>(
      `/reflect/runs/${run.id}`,
      orgId,
    );
    setItems(res.items);
    setLoading(false);
  }, [run.id, orgId]);

  useEffect(() => {
    if (open && !items) {
      void loadItems();
    }
  }, [open, items, loadItems]);

  async function setItemStatus(id: string, status: 'approved' | 'rejected') {
    await api.patch(`/reflect/items/${id}`, { status }, orgId);
    await loadItems();
  }

  async function apply() {
    setBusy(true);
    try {
      await api.post(`/reflect/runs/${run.id}/apply`, {}, orgId);
      await loadItems();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    setBusy(true);
    try {
      await api.post(`/reflect/runs/${run.id}/discard`, {}, orgId);
      await loadItems();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const c = run.counts;

  return (
    <Card>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Badge tone={run.status === 'applied' ? 'success' : run.status === 'discarded' ? 'danger' : 'neutral'}>
            {run.status}
          </Badge>
          <span className="text-sm text-white/70">
            {c ? `${c.facts} facts · ${c.decisions} decisions · ${c.lessons} lessons` : '—'}
            {c && c.duplicates > 0 ? ` · ${c.duplicates} dup` : ''}
          </span>
        </div>
        <span className="text-xs text-white/40">
          {run.created_at ? new Date(run.created_at).toLocaleString() : ''}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          {loading || !items ? (
            <Spinner label="Loading items…" />
          ) : (
            <>
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onApprove={() => setItemStatus(it.id, 'approved')}
                  onReject={() => setItemStatus(it.id, 'rejected')}
                />
              ))}
              {run.status !== 'applied' && run.status !== 'discarded' && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={apply} disabled={busy}>
                    {busy ? '…' : 'Apply to knowledge base'}
                  </Button>
                  <Button variant="ghost" onClick={discard} disabled={busy}>
                    Discard
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function ItemRow({
  item,
  onApprove,
  onReject,
}: {
  item: ExtractionItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const p = item.payload;
  const title =
    item.kind === 'lesson'
      ? String(p.problem ?? '')
      : String(p.title ?? p.content ?? '');
  const detail =
    item.kind === 'decision'
      ? String(p.reason ?? '')
      : item.kind === 'lesson'
        ? String(p.solution ?? '')
        : '';
  const editable = item.status === 'pending' || item.status === 'approved';

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge>{item.kind}</Badge>
            <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
            {item.duplicate_score != null && (
              <span className="text-xs text-amber-300/80">
                ~{item.duplicate_score.toFixed(2)} similar
              </span>
            )}
          </div>
          <div className="mt-1.5 text-sm font-medium">{title}</div>
          {detail && (
            <div className="mt-0.5 text-sm text-white/55">{detail}</div>
          )}
        </div>
        {editable && (
          <div className="flex shrink-0 gap-1.5">
            <Button variant="subtle" onClick={onApprove}>
              Approve
            </Button>
            <Button variant="ghost" onClick={onReject}>
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
