// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/lib/queryClient.ts
// DOMAIN:      ui
// CONCEPT:     TanStack Query client + the apiRequest fetch helper + default fetcher
// RELATIONS:   used by every hook (useAuth, useMatch, usePoints) and mutations across pages
// KEY EXPORTS: queryClient, apiRequest, getQueryFn
// PURPOSE:     One configured Query client; same-origin fetch with credentials + JSON handling.
// LLM EDIT GUIDE: Query keys are the /api path (string) so the default fetcher just GETs the key.
//                 For writes use apiRequest(method, url, body).
// DAY-OF CHANGES: tweak staleTime/retry if the demo feels stale or chatty.
// ─────────────────────────────────────────────────────────────────────────

import { QueryClient, type QueryFunction } from '@tanstack/react-query';

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.clone().json();
      message = body.message ?? message;
    } catch {
      /* non-JSON error body — keep statusText */
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
}

/**
 * Fetch helper for mutations/writes. Always same-origin with credentials (session cookie).
 * // HOW TO EXTEND: add headers (e.g. CSRF) here in one place.
 */
export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  await throwIfNotOk(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Default query fetcher: the queryKey's first element is the URL to GET.
 * `on401: 'returnNull'` lets useAuth treat "not signed in" as null rather than an error.
 */
export function getQueryFn<T>(opts: { on401: 'returnNull' | 'throw' }): QueryFunction<T> {
  return async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const res = await fetch(url, { credentials: 'include' });
    if (opts.on401 === 'returnNull' && res.status === 401) {
      return null as T;
    }
    await throwIfNotOk(res);
    return res.json() as Promise<T>;
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'throw' }),
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000, // DAY-OF CHANGE: lower for fresher data, higher for fewer requests
    },
    mutations: { retry: 0 },
  },
});
