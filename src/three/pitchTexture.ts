import * as THREE from 'three';

/**
 * Procedurally draws a mown-grass pitch with markings onto a canvas and returns
 * it as a texture — no downloaded asset needed.
 */
export function makePitchTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Mowing stripes.
    const stripes = 8;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#0f3d28' : '#0c3322';
      ctx.fillRect(0, (i * size) / stripes, size, size / stripes);
    }
    // Markings.
    ctx.strokeStyle = 'rgba(244,241,232,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, size - 48, size - 48);
    ctx.beginPath();
    ctx.moveTo(24, size / 2);
    ctx.lineTo(size - 24, size / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244,241,232,0.6)';
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
