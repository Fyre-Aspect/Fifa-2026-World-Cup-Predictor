import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useResponsive } from '@/hooks/useResponsive';
import { useTournamentData } from '@/hooks/useTournamentData';
import { useModel } from '@/hooks/useModel';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import { DebugPanel } from '@/components/model/DebugPanel';
import { FieldBackground } from '@/components/field/FieldBackground';

/** The three main tabs that sit on the shared 3D pitch background. */
function showsField(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/bracket') || pathname.startsWith('/teams');
}

/**
 * App shell: sticky header, a flexible main region for the active view, and a
 * footer carrying the honesty disclaimer. The three main tabs render over a
 * shared pitch background that the page scrolls down.
 */
export function Layout({ children }: { children: ReactNode }) {
  // Side effect: keeps the store's lowPower flag in sync with viewport width.
  useResponsive();
  // Loads fixtures/teams (live API with mock fallback).
  useTournamentData();
  // Runs the prediction model over the loaded fixtures.
  useModel();
  // Advances the sample live-match clock (no-op with real live data).
  useLiveClock();
  // Raises browser notifications when opted-in matches go live or finish.
  useMatchNotifications();

  const { pathname } = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col">
      {showsField(pathname) && <FieldBackground />}
      <Header />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <DebugPanel />
    </div>
  );
}
