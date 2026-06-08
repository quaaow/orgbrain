'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from './session-provider';
import { Nav } from './nav';
import { Spinner } from './ui';

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </>
  );
}
