'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/session-provider';
import { Badge, Button, Card, SkeletonCard } from '@/components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import { useToast } from '@/components/toast';
import { api } from '@/lib/api';
import type { ApiKey } from '@/lib/types';

export default function ApiKeysPage() {
  const { activeOrgId, memberships } = useSession();
  const toast = useToast();
  const role = memberships.find((m) => m.organization.id === activeOrgId)?.role;
  const isAdmin = role === 'owner' || role === 'admin';

  const [items, setItems] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const data = await api.get<ApiKey[]>('/api-keys', activeOrgId);
      setItems(data);
    } catch {
      // silently fail — page is admin-only
    }
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activeOrgId) {
    return <p className="text-white/50">Select or create an organisation first.</p>;
  }

  if (!isAdmin) {
    return (
      <FadeIn>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-white/50">Only owners and admins can manage API keys.</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
            <p className="mt-1 text-white/50">Programmatic access to your organisation.</p>
          </div>
          <Button onClick={() => { setOpen(!open); setNewKey(null); }}>
            {open ? 'Close' : '+ New key'}
          </Button>
        </div>
      </FadeIn>

      {open && (
        <FadeIn>
          <NewApiKey
            orgId={activeOrgId}
            onCreated={(key) => {
              setNewKey(key);
              void load();
            }}
          />
        </FadeIn>
      )}

      {newKey && (
        <FadeIn>
          <Card className="border-amber-400/30">
            <p className="text-sm font-medium text-amber-300">Copy this key now — it won&apos;t be shown again.</p>
            <code className="mt-2 block break-all rounded bg-white/5 px-3 py-2 text-sm text-white/90">{newKey}</code>
          </Card>
        </FadeIn>
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <FadeIn>
          <p className="text-sm text-white/40">No API keys yet.</p>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3">
          {items.map((k) => (
            <StaggerItem key={k.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{k.name}</div>
                    <div className="mt-1 text-xs text-white/40">
                      {k.key_prefix}… · {k.role} · created {k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {k.revoked_at ? (
                      <Badge tone="danger">revoked</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm('Revoke this key? It cannot be undone.')) return;
                          await api.del(`/api-keys/${k.id}`, activeOrgId);
                          void load();
                          toast.show('API key revoked', 'info');
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}

function NewApiKey({
  orgId,
  onCreated,
}: {
  orgId: string;
  onCreated: (key: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ key: string }>(
        '/api-keys',
        { name },
        orgId,
      );
      setName('');
      onCreated(res.key);
      toast.show('API key created', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. CI pipeline)"
          required
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create key'}
        </Button>
      </form>
    </Card>
  );
}
