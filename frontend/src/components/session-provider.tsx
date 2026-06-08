'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { api, ApiError } from '@/lib/api';
import type { Me, Membership } from '@/lib/types';

const ORG_KEY = 'orgbrain.activeOrg';

interface SessionContextValue {
  session: Session | null;
  me: Me | null;
  loading: boolean;
  activeOrgId: string | null;
  memberships: Membership[];
  setActiveOrgId: (id: string) => void;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);

  const setActiveOrgId = useCallback((id: string) => {
    setActiveOrgIdState(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ORG_KEY, id);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const data = await api.get<Me>('/auth/me');
      setMe(data);
      const stored =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(ORG_KEY)
          : null;
      const valid = data.memberships.find(
        (m) => m.organization.id === stored,
      );
      if (valid && stored) {
        setActiveOrgIdState(stored);
      } else if (data.memberships.length > 0) {
        setActiveOrgId(data.memberships[0].organization.id);
      } else {
        setActiveOrgIdState(null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setMe(null);
      }
    }
  }, [setActiveOrgId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      void refreshMe();
    } else {
      setMe(null);
    }
  }, [session, refreshMe]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMe(null);
    setActiveOrgIdState(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ORG_KEY);
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      me,
      loading,
      activeOrgId,
      memberships: me?.memberships ?? [],
      setActiveOrgId,
      refreshMe,
      signOut,
    }),
    [session, me, loading, activeOrgId, setActiveOrgId, refreshMe, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
