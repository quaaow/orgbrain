'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/components/session-provider';
import { Button, Card } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace('/dashboard');
    }
  }, [loading, session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Account created. If email confirmation is on, check your inbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">OrgBrain</h1>
        <p className="mb-6 text-sm text-white/50">
          {mode === 'login' ? 'Sign in to your workspace' : 'Create an account'}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {info && <p className="text-sm text-emerald-400">{info}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </Button>
        </form>
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full text-center text-sm text-white/50 hover:text-white"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
        <Link
          href="/"
          className="mt-2 block text-center text-xs text-white/30 hover:text-white/60"
        >
          ← Back to home
        </Link>
      </Card>
    </div>
  );
}
