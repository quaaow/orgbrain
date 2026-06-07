'use client';

import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
  get: <T>(path: string, orgId?: string | null) =>
    request<T>(path, { orgId }),
  post: <T>(path: string, body?: unknown, orgId?: string | null) =>
    request<T>(path, { method: 'POST', body, orgId }),
  patch: <T>(path: string, body?: unknown, orgId?: string | null) =>
    request<T>(path, { method: 'PATCH', body, orgId }),
  put: <T>(path: string, body?: unknown, orgId?: string | null) =>
    request<T>(path, { method: 'PUT', body, orgId }),
  del: <T>(path: string, orgId?: string | null) =>
    request<T>(path, { method: 'DELETE', orgId }),
};
