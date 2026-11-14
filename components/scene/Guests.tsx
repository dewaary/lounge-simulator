"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GuestSpot, rand } from "@/lib/store";
import { GEO, mat } from "./materials";

const SHIRTS = ["#f4f1ea", "#1f2a44", "#c8553d", "#6b8f71", "#e0b04a", "#3b3b3f", "#8c6bb1", "#d98f8f", "#4f7ca8", "#efe0c8", "#2f5d50", "#b5838d"];
const SKIN = ["#f1c9a5", "#e0ac83", "#c68a62", "#9c6644", "#7a4b2f", "#f6d8bf"];
const HAIR = ["#1d1611", "#3b2a1e", "#6e4b2a", "#b08850", "#2a2a2a", "#8a8a8a"];
const PANTS = ["#2b2e36", "#4a4036", "#1d2433", "#6b6258", "#e7e0d2"];

function Guest({ spot, i, setRef }: { spot: GuestSpot; i: number; setRef: (i: number, g: THREE.Group | null) => void }) {
  const shirt = mat(SHIRTS[Math.floor(rand(i + 3) * SHIRTS.length)], { rough: 0.9 });
  const skin = mat(SKIN[Math.floor(rand(i + 7) * SKIN.length)], { rough: 0.7 });
  const hair = mat(HAIR[Math.floor(rand(i + 11) * HAIR.length)], { rough: 0.9 });
  const pants = mat(PANTS[Math.floor(rand(i + 13) * PANTS.length)], { rough: 0.9 });
  const s = 0.93 + rand(i + 17) * 0.12;
  const longHair = rand(i + 19) > 0.55;

  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.rot, 0]} scale={s}>
      <group ref={(g) => setRef(i, g)}>
        {spot.seated ? (
          <>
            {/* thighs forward, shins down */}
            <mesh geometry={GEO.thigh} material={pants} position={[-0.09, 0.53, 0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow />
            <mesh geometry={GEO.thigh} material={pants} position={[0.09, 0.53, 0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow />
            <mesh geometry={GEO.thigh} material={pants} position={[-0.09, 0.27, 0.32]} castShadow />
            <mesh geometry={GEO.thigh} material={pants} position={[0.09, 0.27, 0.32]} castShadow />
            <mesh geometry={GEO.torso} material={shirt} position={[0, 0.86, -0.04]} castShadow />
            <mesh geometry={GEO.arm} material={shirt} position={[-0.22, 0.85, 0.15]} rotation={[-0.95, 0, 0.05]} castShadow />
            <mesh geometry={GEO.arm} material={shirt} position={[0.22, 0.85, 0.15]} rotation={[-0.95, 0, -0.05]} castShadow />
            <group position={[0, 1.24, -0.03]} name="head">
              <mesh geometry={GEO.head} material={skin} castShadow />
              <mesh geometry={GEO.hair} material={hair} position={[0, 0.015, -0.01]} scale={longHair ? [1.05, 1.25, 1.1] : 1} />
            </group>
          </>
        ) : (
          <>
            <mesh geometry={GEO.legs} material={pants} position={[-0.085, 0.42, 0]} castShadow />
            <mesh geometry={GEO.legs} material={pants} position={[0.085, 0.42, 0]} castShadow />
            <mesh geometry={GEO.torso} material={shirt} position={[0, 1.08, 0]} castShadow />
            <mesh geometry={GEO.arm} material={shirt} position={[-0.23, 1.02, 0.02]} rotation={[0.15, 0, 0.12]} castShadow />
            <mesh geometry={GEO.arm} material={shirt} position={[0.23, 1.04, 0.08]} rotation={[-1.1 * rand(i + 23), 0, -0.12]} castShadow />
            <group position={[0, 1.47, 0]} name="head">
              <mesh geometry={GEO.head} material={skin} castShadow />
              <mesh geometry={GEO.hair} material={hair} position={[0, 0.015, -0.01]} scale={longHair ? [1.05, 1.25, 1.1] : 1} />
            </group>
          </>
        )}
      </group>
    </group>
  );
}

export function Guests({ spots, party }: { spots: GuestSpot[]; party: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const setRef = (i: number, g: THREE.Group | null) => {
    refs.current[i] = g;
  };
  const phases = useMemo(() => spots.map((_, i) => rand(i + 101) * Math.PI * 2), [spots]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((g, i) => {
      if (!g || i >= spots.length) return;
      const ph = phases[i] ?? 0;
      const standing = !spots[i].seated;
      const head = g.getObjectByName("head");
      if (standing && party) {
        // dancing / lively crowd
        g.position.y = Math.abs(Math.sin(t * 4.2 + ph)) * 0.05;
        g.rotation.y = Math.sin(t * 2.1 + ph) * 0.25;
        g.rotation.z = Math.sin(t * 4.2 + ph) * 0.04;
      } else if (standing) {
        g.position.y = Math.sin(t * 1.3 + ph) * 0.008;
        g.rotation.y = Math.sin(t * 0.6 + ph) * 0.12;
        g.rotation.z = 0;
      } else {
        g.rotation.x = Math.sin(t * 0.9 + ph) * 0.03 + (party ? Math.sin(t * 3 + ph) * 0.03 : 0);
      }
      if (head) head.rotation.y = Math.sin(t * 0.7 + ph * 2) * 0.45;
    });
  });

  return (
    <group>
      {spots.map((s, i) => (
        <Guest key={i} spot={s} i={i} setRef={setRef} />
      ))}
    </group>
  );
}
