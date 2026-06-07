// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/main.tsx
// DOMAIN:      ui
// CONCEPT:     React entrypoint — mounts <App /> inside the TanStack Query provider
// RELATIONS:   imports App + queryClient + index.css
// KEY EXPORTS: (none — side-effecting bootstrap)
// PURPOSE:     Boots the React app.
// LLM EDIT GUIDE: Add global providers here (e.g. a toast provider) wrapping <App />.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import App from '@/App';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
