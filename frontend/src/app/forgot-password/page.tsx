'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button, Card } from '@/components/ui';
import { FadeIn } from '@/components/motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/login`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="mt-1 text-sm text-white/50">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-400">
                Check your inbox for a password reset link.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-white/50 transition-colors hover:text-white"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:bg-white/[0.07]"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Sending…' : 'Send reset link'}
              </Button>
              <Link
                href="/login"
                className="block text-center text-xs text-white/40 transition-colors hover:text-white/70"
              >
                ← Back to sign in
              </Link>
            </form>
          )}
        </Card>
      </FadeIn>
    </div>
  );
}
