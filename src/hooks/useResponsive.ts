import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

/**
 * Tracks viewport width and flips the store's `lowPower` flag below 768px.
 * Below that breakpoint, r3f on phones tanks, so the UI degrades 3D to 2D.
 */
export function useResponsive(): { isMobile: boolean } {
  const setLowPower = useStore((s) => s.setLowPower);
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setIsMobile(mq.matches);
      setLowPower(mq.matches);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [setLowPower]);

  return { isMobile };
}
