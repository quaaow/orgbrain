'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/session-provider';
import { Badge, Button, Card, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Member, Role } from '@/lib/types';

const ROLES: Role[] = ['viewer', 'member', 'admin', 'owner'];
const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export default function MembersPage() {
  const { me, memberships, activeOrgId } = useSession();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [busy, setBusy] = useState(false);

  const myRole = memberships.find(
    (m) => m.organization.id === activeOrgId,
  )?.role;
  const canManage = myRole === 'admin' || myRole === 'owner';

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setError(null);
    try {
      const data = await api.get<Member[]>(
        `/organizations/${activeOrgId}/members`,
        activeOrgId,
      );
      setMembers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load members');
      setMembers([]);
    }
  }, [activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !activeOrgId) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(
        `/organizations/${activeOrgId}/members`,
        { email: email.trim(), role: inviteRole },
        activeOrgId,
      );
      setEmail('');
      setInviteRole('member');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add member');
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId: string, role: Role) {
    if (!activeOrgId) return;
    setError(null);
    try {
      await api.patch(
        `/organizations/${activeOrgId}/members/${userId}`,
        { role },
        activeOrgId,
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update role');
    }
  }

  async function remove(userId: string) {
    if (!activeOrgId) return;
    setError(null);
    try {
      await api.del(
        `/organizations/${activeOrgId}/members/${userId}`,
        activeOrgId,
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove member');
    }
  }

  if (!activeOrgId) {
    return (
      <p className="text-white/50">
        Create or select an organisation first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="mt-1 text-white/50">
          Manage who can access this organisation and their roles.
        </p>
      </div>

      {canManage && (
        <Card className="max-w-2xl">
          <h2 className="mb-3 text-sm font-medium text-white/70">
            Invite a member
          </h2>
          <p className="mb-3 text-xs text-white/40">
            They must have signed in to OrgBrain at least once with this email.
          </p>
          <form onSubmit={invite} className="flex flex-wrap gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="min-w-56 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-sm text-white outline-none"
            >
              {ROLES.filter(
                (r) => !myRole || ROLE_RANK[r] <= ROLE_RANK[myRole],
              ).map((r) => (
                <option key={r} value={r} className="bg-[#16161a]">
                  {r}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={busy}>
              {busy ? '…' : 'Invite'}
            </Button>
          </form>
        </Card>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {members === null ? (
        <Spinner label="Loading members…" />
      ) : (
        <Card className="max-w-2xl divide-y divide-white/10 p-0">
          {members.map((m) => {
            const isSelf = m.user_id === me?.user.id;
            const canEditTarget =
              canManage &&
              (!myRole || ROLE_RANK[m.role] <= ROLE_RANK[myRole]);
            return (
              <div
                key={m.user_id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">
                    {m.email ?? m.user_id}
                    {isSelf && (
                      <span className="ml-2 text-xs text-white/40">(you)</span>
                    )}
                  </div>
                  {m.name && (
                    <div className="truncate text-xs text-white/40">
                      {m.name}
                    </div>
                  )}
                </div>
                {canEditTarget && !isSelf ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      changeRole(m.user_id, e.target.value as Role)
                    }
                    className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none"
                  >
                    {ROLES.filter(
                      (r) => !myRole || ROLE_RANK[r] <= ROLE_RANK[myRole],
                    ).map((r) => (
                      <option key={r} value={r} className="bg-[#16161a]">
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone={m.role === 'owner' ? 'info' : 'neutral'}>
                    {m.role}
                  </Badge>
                )}
                {canEditTarget && !isSelf && (
                  <Button
                    variant="danger"
                    onClick={() => void remove(m.user_id)}
                    className="px-2.5 py-1 text-xs"
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="px-4 py-6 text-sm text-white/50">
              No members yet.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
