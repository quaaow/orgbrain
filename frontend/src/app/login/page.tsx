'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/components/session-provider';
import { Button, Card } from '@/components/ui';
import { FadeIn } from '@/components/motion';

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

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

  async function handleOAuth(provider: 'github') {
    setError(null);
    setInfo(null);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
      // Browser will redirect; no need to clear busy.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign in failed');
    }
  }

  function normalizeAuthError(message: string): string {
    const lower = message.toLowerCase();
    if (
      lower.includes('already registered') ||
      lower.includes('user already registered') ||
      lower.includes('email already in use') ||
      lower.includes('user already exists')
    ) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (lower.includes('invalid login credentials')) {
      return 'Invalid email or password.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    return message;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const emailRedirectTo = `${siteUrl}/dashboard`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });
        if (signUpError) {
          throw new Error(normalizeAuthError(signUpError.message));
        }
        if (!data.user) {
          // Supabase silently drops duplicate signups when email confirmation is on.
          // We show a neutral message so an attacker cannot enumerate users.
          setInfo(
            'Please check your inbox to confirm your email address. If you already have an account, sign in below.',
          );
        } else {
          setInfo(
            'Account created. Please check your inbox to confirm your email address.',
          );
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw new Error(normalizeAuthError(signInError.message));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[100px]" />
      </div>

      <FadeIn className="relative z-10 w-full max-w-sm">
        <Card className="border-white/10">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">OrgBrain</h1>
            <p className="mt-1 text-sm text-white/50">
              {mode === 'login' ? 'Sign in to your workspace' : 'Create an account'}
            </p>
          </div>

          {/* OAuth button */}
          <Button
            type="button"
            variant="ghost"
            className="flex w-full items-center justify-center gap-2"
            onClick={() => handleOAuth('github')}
            disabled={busy}
          >
            <GitHubIcon className="h-4 w-4 fill-white" />
            Continue with GitHub
          </Button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:bg-white/[0.07]"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:bg-white/[0.07]"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </Button>
            {mode === 'login' && (
              <Link
                href="/forgot-password"
                className="block text-center text-xs text-white/40 transition-colors hover:text-white/70"
              >
                Forgot password?
              </Link>
            )}
          </form>

          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
              setInfo(null);
            }}
            className="mt-4 w-full text-center text-sm text-white/50 transition-colors hover:text-white"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
          <Link
            href="/"
            className="mt-2 block text-center text-xs text-white/30 transition-colors hover:text-white/60"
          >
            ← Back to home
          </Link>
        </Card>
      </FadeIn>
    </div>
  );
}
