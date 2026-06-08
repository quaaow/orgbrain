'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/session-provider';
import { Badge, Button, Card, SkeletonCard } from '@/components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import { api } from '@/lib/api';
import type { Knowledge, KnowledgeType, SearchHit } from '@/lib/types';

const TYPES: KnowledgeType[] = ['fact', 'note', 'document', 'policy'];

export default function SearchPage() {
  const { activeOrgId } = useSession();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const data = await api.get<Knowledge[]>('/knowledge?limit=50', activeOrgId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !activeOrgId) return;
    setSearching(true);
    setError(null);
    try {
      const data = await api.post<SearchHit[]>(
        '/knowledge/search',
        { query, top_k: 10 },
        activeOrgId,
      );
      setHits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function review(id: string) {
    if (!activeOrgId) return;
    await api.post(`/knowledge/${id}/review`, {}, activeOrgId);
    await loadList();
  }

  if (!activeOrgId) {
    return <p className="text-white/50">Select or create an organisation first.</p>;
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge</h1>
        <p className="mt-1 text-white/50">Semantic search across your org.</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <form onSubmit={runSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask by meaning, e.g. 'how do we handle migrations'"
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <Button type="submit" disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </form>
      </FadeIn>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {hits && (
        <FadeIn>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-white/70">
                Results ({hits.length})
              </h2>
              <button
                onClick={() => setHits(null)}
                className="text-sm text-white/40 hover:text-white"
              >
                Clear
              </button>
            </div>
            {hits.length === 0 && (
              <p className="text-sm text-white/40">No matches.</p>
            )}
            <StaggerContainer className="space-y-3">
              {hits.map((h) => (
                <StaggerItem key={h.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {String(h.payload.title ?? 'Untitled')}
                        </div>
                        <div className="mt-1 text-sm text-white/60">
                          {String(h.payload.content ?? '')}
                        </div>
                      </div>
                      <Badge tone="info">{h.score.toFixed(3)}</Badge>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        </FadeIn>
      )}

      <FadeIn delay={0.2}>
        <CreateKnowledge orgId={activeOrgId} onCreated={loadList} />
      </FadeIn>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-white/70">Recent</h2>
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : items.length === 0 ? (
          <FadeIn>
            <p className="text-sm text-white/40">No knowledge yet.</p>
          </FadeIn>
        ) : (
          <StaggerContainer className="space-y-3">
            {items.map((k) => (
              <StaggerItem key={k.id}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{k.title}</span>
                        <Badge>{k.type}</Badge>
                        <Badge tone={k.source === 'reflect' ? 'info' : 'neutral'}>
                          {k.source}
                        </Badge>
                        {k.stale && <Badge tone="warning">stale</Badge>}
                      </div>
                      <div className="mt-1 text-sm text-white/60">{k.content}</div>
                    </div>
                    {k.stale && (
                      <Button variant="subtle" onClick={() => void review(k.id)}>
                        Mark reviewed
                      </Button>
                    )}
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}

function CreateKnowledge({
  orgId,
  onCreated,
}: {
  orgId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<KnowledgeType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/knowledge', { type, title, content }, orgId);
      setTitle('');
      setContent('');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed (need member role?)');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        + Add knowledge
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as KnowledgeType)}
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-sm outline-none"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#16161a]">
                {t}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          required
          rows={3}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
