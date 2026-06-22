import * as THREE from 'three';

/**
 * Convert latitude/longitude (degrees) to a point on a sphere of the given
 * radius, matching the UV layout of an equirectangular Earth texture mapped
 * onto a three SphereGeometry.
 */
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** The base Y rotation (radians) that brings a given longitude to face +Z. */
export function longitudeToYRotation(lon: number): number {
  return -((lon + 180) * (Math.PI / 180)) - Math.PI / 2;
}
