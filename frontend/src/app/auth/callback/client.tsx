'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (!code) {
      router.replace('/login');
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (exchangeError) throw exchangeError;
        router.replace(next);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : 'Authentication failed',
        );
        setTimeout(() => router.replace('/login'), 3000);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <p className="text-sm text-red-400">
          {error}. Redirecting to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label="Completing sign in…" />
    </div>
  );
}
