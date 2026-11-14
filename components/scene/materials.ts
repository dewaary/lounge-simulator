import * as THREE from "three";

// Shared geometries & materials keep draw setup cheap on phones.
const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(color: string, opts: { rough?: number; metal?: number; emissive?: string; emissiveIntensity?: number } = {}) {
  const key = `${color}|${opts.rough ?? 0.8}|${opts.metal ?? 0}|${opts.emissive ?? ""}|${opts.emissiveIntensity ?? 0}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.8,
      metalness: opts.metal ?? 0,
      emissive: new THREE.Color(opts.emissive ?? "#000000"),
      emissiveIntensity: opts.emissiveIntensity ?? 0,
    });
    matCache.set(key, m);
  }
  return m;
}

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
  cylLow: new THREE.CylinderGeometry(1, 1, 1, 10),
  sphere: new THREE.SphereGeometry(1, 20, 14),
  sphereLow: new THREE.SphereGeometry(1, 10, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  circle: new THREE.CircleGeometry(1, 32),
  legs: new THREE.CapsuleGeometry(0.075, 0.62, 4, 8),
  thigh: new THREE.CapsuleGeometry(0.075, 0.3, 4, 8),
  torso: new THREE.CapsuleGeometry(0.17, 0.34, 4, 10),
  arm: new THREE.CapsuleGeometry(0.05, 0.42, 3, 6),
  head: new THREE.SphereGeometry(0.11, 14, 10),
  hair: new THREE.SphereGeometry(0.115, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
};

export const WOOD = "#8a5a36";
export const WOOD_DARK = "#4b3322";
export const VELVET = "#2c4290";
export const METAL = "#2a2a2c";
