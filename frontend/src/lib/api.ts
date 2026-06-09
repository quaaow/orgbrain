'use client';

import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Active organisation id, sent as the X-Org-Id header. */
  orgId?: string | null;
  /** Abort signal for request cancellation / timeout. */
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.orgId) {
    headers['X-Org-Id'] = options.orgId;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (payload && (payload.message || payload.error)) || `HTTP ${res.status}`;
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(', ') : String(message),
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, orgId?: string | null, signal?: AbortSignal) =>
    request<T>(path, { orgId, signal }),
  post: <T>(path: string, body?: unknown, orgId?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body, orgId, signal }),
  patch: <T>(path: string, body?: unknown, orgId?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: 'PATCH', body, orgId, signal }),
  put: <T>(path: string, body?: unknown, orgId?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: 'PUT', body, orgId, signal }),
  del: <T>(path: string, orgId?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: 'DELETE', orgId, signal }),
};
