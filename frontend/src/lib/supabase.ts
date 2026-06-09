'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser-side Supabase client (persists the session in localStorage). */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : createClient('http://localhost', 'anon', {
        auth: { persistSession: false },
      });

if (!url || !anonKey) {
  console.warn('Supabase env vars are missing; auth will not work.');
}
