'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from './session-provider';
import { Nav } from './nav';
import { Spinner } from './ui';

const PUBLIC_PATHS = ['/login'];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!loading && !session && !isPublic) {
      router.replace('/login');
    }
    if (!loading && session && isPublic) {
      router.replace('/');
    }
  }, [loading, session, isPublic, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (!session && !isPublic) {
    return null;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </>
  );
}
