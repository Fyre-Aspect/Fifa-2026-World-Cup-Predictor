import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useResponsive } from '@/hooks/useResponsive';
import { useTournamentData } from '@/hooks/useTournamentData';
import { useModel } from '@/hooks/useModel';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import { DebugPanel } from '@/components/model/DebugPanel';

/**
 * App shell: sticky header, a flexible main region for the active view, and a
 * footer carrying the honesty disclaimer. Views that own the full 3D canvas
 * render edge-to-edge; 2D views get padded content width.
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

  return (
    <div className="flex min-h-screen flex-col bg-pitch-950">
      <Header />
      <main className="relative flex-1">{children}</main>
      <Footer />
      <DebugPanel />
    </div>
  );
}
