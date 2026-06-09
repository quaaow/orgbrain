import { Suspense } from 'react';
import AuthCallbackClient from './client';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-sm text-white/50">Completing sign in…</span>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
