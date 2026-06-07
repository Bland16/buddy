// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/App.tsx
// DOMAIN:      ui
// CONCEPT:     Route table + the auth gate (wouter)
// RELATIONS:   uses useAuth; routes to all pages under client/src/pages
// KEY EXPORTS: App (default)
// PURPOSE:     Sends signed-out users to Landing, un-onboarded users to Onboarding, else the app.
// LLM EDIT GUIDE: Add a route here + a page in pages/. Page components use `export default`.
// DAY-OF CHANGES: add/remove a route.
// ─────────────────────────────────────────────────────────────────────────

import { Route, Switch, Redirect } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { BuddyAnim } from '@/components/BuddyAnim';
import LandingPage from '@/pages/LandingPage';
import OnboardingPage from '@/pages/OnboardingPage';
import MatchWaitingPage from '@/pages/MatchWaitingPage';
import ChatPage from '@/pages/ChatPage';
import MarketplacePage from '@/pages/MarketplacePage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import NotFoundPage from '@/pages/NotFoundPage';

function FullScreenLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <BuddyAnim animation="spinner" size={48} />
    </div>
  );
}

export default function App() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <FullScreenLoader />;

  // Signed out → only the landing page is reachable.
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  // Signed in but not onboarded → force onboarding.
  if (user && !user.onboardingComplete) {
    return (
      <Switch>
        <Route path="/onboarding" component={OnboardingPage} />
        <Route>
          <Redirect to="/onboarding" />
        </Route>
      </Switch>
    );
  }

  // Signed in + onboarded → the full app.
  return (
    <Switch>
      <Route path="/" component={MatchWaitingPage} />
      <Route path="/chat/:sessionId" component={ChatPage} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/onboarding">
        <Redirect to="/" />
      </Route>
      <Route component={NotFoundPage} />
    </Switch>
  );
}
