// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/hooks/useAuth.ts
// DOMAIN:      auth
// CONCEPT:     Client auth state — is someone signed in, and who
// RELATIONS:   queries /api/auth/user; used by App.tsx (route gate) and pages
// KEY EXPORTS: useAuth
// PURPOSE:     Returns { user, isLoading, isAuthenticated } from the session.
// LLM EDIT GUIDE: 401 resolves to null (not an error) via getQueryFn on401:'returnNull'.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';
import { getQueryFn } from '@/lib/queryClient';
import { CONFIG } from '@/config';

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: [CONFIG.API_ROUTES.authUser],
    queryFn: getQueryFn<User | null>({ on401: 'returnNull' }),
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: Boolean(user),
  };
}
