import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * App shell: sticky header, a flexible main region for the active view, and a
 * footer carrying the honesty disclaimer. Views that own the full 3D canvas
 * render edge-to-edge; 2D views get padded content width.
 */
export function Layout({ children }: { children: ReactNode }) {
  // Side effect: keeps the store's lowPower flag in sync with viewport width.
  useResponsive();

  return (
    <div className="flex min-h-screen flex-col bg-pitch-950">
      <Header />
      <main className="relative flex-1">{children}</main>
      <Footer />
    </div>
  );
}
