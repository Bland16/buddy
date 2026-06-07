// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/hooks/useMatch.ts
// DOMAIN:      matchmaking
// CONCEPT:     Matchmaking state — join the queue, poll for a pairing, leave
// RELATIONS:   calls /api/match/*; used by MatchWaitingPage + ChatPage
// KEY EXPORTS: useMatch
// PURPOSE:     Exposes join/leave mutations and the current match (polled while waiting).
// LLM EDIT GUIDE: Pairing happens server-side; this hook polls /api/match/current until status
//                 flips to 'active'. Tune the poll interval below.
// DAY-OF CHANGES: poll interval (ms).
// ─────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MatchSession } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { CONFIG } from '@/config';

interface JoinResult {
  match: MatchSession;
  paired: boolean;
}

export function useMatch(options: { poll?: boolean } = {}) {
  const qc = useQueryClient();

  const currentQuery = useQuery<{ match: MatchSession | null; partnerAlias: string | null }>({
    queryKey: [CONFIG.API_ROUTES.matchCurrent],
    // Poll only while we're explicitly waiting for a pairing. // DAY-OF CHANGE: 2s poll.
    refetchInterval: options.poll ? 2000 : false,
  });

  const join = useMutation({
    mutationFn: () => apiRequest<JoinResult>('POST', CONFIG.API_ROUTES.matchJoin),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONFIG.API_ROUTES.matchCurrent] }),
  });

  const leave = useMutation({
    mutationFn: () => apiRequest('DELETE', CONFIG.API_ROUTES.matchLeave),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONFIG.API_ROUTES.matchCurrent] }),
  });

  return {
    match: currentQuery.data?.match ?? null,
    partnerAlias: currentQuery.data?.partnerAlias ?? null,
    isLoading: currentQuery.isLoading,
    join,
    leave,
  };
}
