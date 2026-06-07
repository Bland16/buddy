// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/NavBar.tsx
// DOMAIN:      ui
// CONCEPT:     Shared top nav for the signed-in app (logo + icon links + sign out)
// RELATIONS:   used by MatchWaitingPage, MarketplacePage, ProfilePage, AdminPage
// KEY EXPORTS: NavBar
// PURPOSE:     One calm header with the Buddy logo and navigation; admins also see the gear.
// LLM EDIT GUIDE: Add a nav item by adding a <NavIcon>. Keep chrome minimal (brand §6).
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { Link, useLocation } from 'wouter';
import { CONFIG } from '@/config';
import { useAuth } from '@/hooks/useAuth';
import { Sprite } from './Sprite';
import { BuddyAnim } from './BuddyAnim';
import type { SpriteName } from '@/assets/sprites';

function NavIcon({ to, name, label, active }: { to: string; name: SpriteName; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition ${active ? 'bg-mint-soft/50' : 'hover:bg-mint-soft/30'}`}
    >
      <Sprite name={name} size={22} alt={label} />
    </Link>
  );
}

export function NavBar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-mint-soft/40 bg-canvas/85 px-4 py-2.5 backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <BuddyAnim animation="buddy-idle" size={32} />
        <span className="text-lg font-bold text-pine">{CONFIG.APP_NAME}</span>
      </Link>

      <nav className="flex items-center gap-1">
        <NavIcon to="/" name="home" label="Home" active={location === '/'} />
        {CONFIG.FEATURE_FLAGS.ENABLE_MARKETPLACE && (
          <NavIcon to="/marketplace" name="store" label="Marketplace" active={location === '/marketplace'} />
        )}
        <NavIcon to="/profile" name="profile" label="Profile" active={location === '/profile'} />
        {user?.isAdmin && <NavIcon to="/admin" name="gear" label="Admin" active={location === '/admin'} />}
        <a
          href={CONFIG.API_ROUTES.logout}
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-mint-soft/30"
          aria-label="Sign out"
        >
          <Sprite name="lock_privacy" size={20} alt="Sign out" />
        </a>
      </nav>
    </header>
  );
}
