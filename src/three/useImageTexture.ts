import { useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Loads an image into a THREE.Texture without suspending, returning null while
 * loading and null on failure. This keeps the 3D scene robust: if a remote
 * texture (Earth map, flag) is blocked or 404s, the caller falls back to a
 * solid color instead of crashing a Suspense boundary.
 */
export function useImageTexture(url: string | null): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (!active) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        setTexture(tex);
      },
      undefined,
      () => {
        // Swallow errors — caller renders a fallback color.
        if (active) setTexture(null);
      },
    );
    return () => {
      active = false;
    };
  }, [url]);

  return texture;
}
