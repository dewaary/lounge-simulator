"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MoodId, VENUE } from "@/lib/data";
import { Box, Cyl, Ball } from "./Models";
import { GEO, mat } from "./materials";

const W = VENUE.width;
const D = VENUE.depth;
const H = VENUE.height;
const WINDOWS = [-6, -3, 0, 3, 6];
const WIN_W = 2.1;
const SILL = 0.85;
const HEAD = 2.55;

export const MOOD_LOOK: Record<
  MoodId,
  { skyTop: string; skyBottom: string; amb: number; hemi: number; sun: number; sunColor: string; sunPos: [number, number, number]; lamps: number; bg: string; windowsLit: number }
> = {
  day: { skyTop: "#7fb2e6", skyBottom: "#e8f0f4", amb: 0.55, hemi: 0.75, sun: 2.4, sunColor: "#fff4e2", sunPos: [-5, 10, -12], lamps: 0, bg: "#d9e2e6", windowsLit: 0 },
  sunset: { skyTop: "#5b6aa8", skyBottom: "#f6b26b", amb: 0.32, hemi: 0.45, sun: 2.6, sunColor: "#ffab66", sunPos: [-14, 4.5, -10], lamps: 2.2, bg: "#2a2433", windowsLit: 0.4 },
  night: { skyTop: "#070b1c", skyBottom: "#26304f", amb: 0.16, hemi: 0.2, sun: 0.25, sunColor: "#9fb3ff", sunPos: [-6, 9, -10], lamps: 5, bg: "#0d0f17", windowsLit: 1 },
};

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, repeat?: [number, number]) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);
}

function Floor({ onClick }: { onClick: () => void }) {
  const tex = useCanvasTexture(
    (ctx, w, h) => {
      // light oak planks
      ctx.fillStyle = "#c7a982";
      ctx.fillRect(0, 0, w, h);
      const rows = 8;
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = -((r * 137) % 300);
        while (x < w) {
          const len = 260 + ((r * 53 + x) % 180);
          const tone = 190 + ((r * 31 + Math.abs(x)) % 30);
          ctx.fillStyle = `rgb(${tone + 8},${tone - 18},${tone - 58})`;
          ctx.fillRect(x + 1, r * rh + 1, len - 2, rh - 2);
          for (let g = 0; g < 6; g++) {
            ctx.strokeStyle = "rgba(90,60,30,0.07)";
            ctx.beginPath();
            const gy = r * rh + 4 + g * (rh / 6);
            ctx.moveTo(x + 4, gy);
            ctx.bezierCurveTo(x + len / 3, gy + 2, x + (2 * len) / 3, gy - 2, x + len - 4, gy + 1);
            ctx.stroke();
          }
          x += len;
        }
      }
    },
    1024,
    512,
    [W / 4, D / 4]
  );
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(e) => {
        if (e.delta < 6) onClick();
      }}
    >
      <planeGeometry args={[W, D]} />
      <meshStandardMaterial map={tex} roughness={0.55} />
    </mesh>
  );
}

function Plaster({ p, s, r }: { p: [number, number, number]; s: [number, number]; r?: [number, number, number] }) {
  // single-sided: visible from inside the room only, so walls cut away automatically
  return <mesh geometry={GEO.plane} material={mat("#ece5d8", { rough: 0.95 })} position={p} rotation={r} scale={[s[0], s[1], 1]} receiveShadow />;
}

function BackWall({ mood }: { mood: MoodId }) {
  const z = -D / 2;
  const piers: [number, number][] = [];
  let x0 = -W / 2;
  for (const c of WINDOWS) {
    piers.push([x0, c - WIN_W / 2]);
    x0 = c + WIN_W / 2;
  }
  piers.push([x0, W / 2]);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#cfe3ee", transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.1, depthWrite: false }), []);
  return (
    <group>
      <Plaster p={[0, SILL / 2, z]} s={[W, SILL]} />
      <Plaster p={[0, (HEAD + H) / 2, z]} s={[W, H - HEAD]} />
      {piers.map(([a, b], i) => (
        <Plaster key={i} p={[(a + b) / 2, (SILL + HEAD) / 2, z]} s={[b - a, HEAD - SILL]} />
      ))}
      {WINDOWS.map((c) => (
        <group key={c} position={[c, 0, z]}>
          <Box p={[0, SILL, 0.05]} s={[WIN_W + 0.06, 0.05, 0.14]} c="#efe9df" />
          <Box p={[0, HEAD, 0.02]} s={[WIN_W, 0.05, 0.08]} c="#2d2b29" shadow={false} />
          <Box p={[-WIN_W / 2, (SILL + HEAD) / 2, 0.02]} s={[0.05, HEAD - SILL, 0.08]} c="#2d2b29" shadow={false} />
          <Box p={[WIN_W / 2, (SILL + HEAD) / 2, 0.02]} s={[0.05, HEAD - SILL, 0.08]} c="#2d2b29" shadow={false} />
          <Box p={[0, (SILL + HEAD) / 2, 0.02]} s={[0.04, HEAD - SILL, 0.06]} c="#2d2b29" shadow={false} />
          <mesh geometry={GEO.plane} material={glass} position={[0, (SILL + HEAD) / 2, 0]} scale={[WIN_W, HEAD - SILL, 1]} />
        </group>
      ))}
      <Outside mood={mood} />
    </group>
  );
}

function Outside({ mood }: { mood: MoodId }) {
  const look = MOOD_LOOK[mood];
  const sky = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, look.skyTop);
    g.addColorStop(1, look.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [look.skyTop, look.skyBottom]);

  // Kerobokan rooftops: low houses with terracotta roofs and palms
  const houses = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const r = (n: number) => {
          const s = Math.sin((i + 1) * n * 12.9898) * 43758.5453;
          return s - Math.floor(s);
        };
        return { x: -17 + i * 1.6 + r(1) * 0.8, z: -7 - r(2) * 9, w: 1.6 + r(3) * 1.8, d: 1.6 + r(4) * 1.6, h: -1.2 + r(5) * 1.6, lit: r(6) > 0.55, palm: r(7) > 0.6 };
      }),
    []
  );
  const roof = mat("#a4553a", { rough: 0.9 });
  return (
    <group>
      <mesh position={[0, 3, -24]} scale={[90, 30, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={sky} fog={false} />
      </mesh>
      {houses.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]}>
          <Box p={[0, h.h - 1.5, 0]} s={[h.w, 3, h.d]} c={mood === "night" ? "#3a3a44" : "#e6dccb"} shadow={false} />
          <mesh position={[0, h.h + 0.4, 0]} rotation={[0, Math.PI / 4, 0]} scale={[h.w * 0.78, 0.9, h.d * 0.78]} material={roof}>
            <coneGeometry args={[1, 1, 4]} />
          </mesh>
          {h.lit && look.windowsLit > 0 && <Box p={[0, h.h - 0.6, h.d / 2 + 0.01]} s={[0.35, 0.3, 0.01]} c="#ffd28a" emissive="#ffb85c" ei={2 * look.windowsLit} shadow={false} />}
          {h.palm && (
            <group position={[h.w / 2 + 0.4, 0, 0]}>
              <Cyl p={[0, h.h + 0.6, 0]} rt={0.06} h={4} c="#7b6145" low shadow={false} />
              {Array.from({ length: 6 }, (_, k) => (
                <group key={k} position={[0, h.h + 2.6, 0]} rotation={[0, (k / 6) * Math.PI * 2, 0]}>
                  <mesh geometry={GEO.sphereLow} material={mat(mood === "night" ? "#1d2b22" : "#3d6b3a")} position={[0, -0.15, 0.6]} rotation={[0.5, 0, 0]} scale={[0.15, 0.04, 0.75]} />
                </group>
              ))}
            </group>
          )}
        </group>
      ))}
      {mood !== "night" && (
        <mesh position={[0, -2, -12]} rotation={[-Math.PI / 2, 0, 0]} scale={[60, 30, 1]}>
          <planeGeometry />
          <meshBasicMaterial color={mood === "day" ? "#7a9a63" : "#5b4b3b"} />
        </mesh>
      )}
    </group>
  );
}

function Ceiling({ mood }: { mood: MoodId }) {
  const slats = useMemo(() => Array.from({ length: Math.floor(W / 0.32) }, (_, i) => -W / 2 + 0.16 + i * 0.32), []);
  const look = MOOD_LOOK[mood];
  const down: [number, number, number] = [Math.PI / 2, 0, 0];
  const pendants = useRef<THREE.Group>(null);
  // pendants would only clutter the floor plan, so hide them when looking from high above
  useFrame(({ camera }) => {
    if (pendants.current) pendants.current.visible = camera.position.y < 7.5;
  });
  return (
    <group>
      <mesh geometry={GEO.plane} material={mat("#2b1f16", { rough: 1 })} position={[0, H + 0.08, 0]} rotation={down} scale={[W, D, 1]} />
      {slats.map((x) => (
        <mesh key={x} geometry={GEO.plane} material={mat("#a8784b", { rough: 0.7 })} position={[x, H, 0]} rotation={down} scale={[0.16, D, 1]} />
      ))}
      {/* pendant lamps (rendered from below only, shades are single-sided) */}
      <group ref={pendants}>
      {[-5, -1.7, 1.7, 5].map((x) => (
        <group key={x} position={[x, 0, -0.2]}>
          <mesh position={[0, H - 0.35, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.7, 3]} />
            <meshBasicMaterial color="#222" />
          </mesh>
          <mesh position={[0, H - 0.78, 0]} material={mat("#1f1f1f", { rough: 0.6 })}>
            <coneGeometry args={[0.2, 0.18, 20, 1, true]} />
          </mesh>
          <Ball p={[0, H - 0.86, 0]} r={0.06} c="#fff3d6" emissive="#ffcf8a" ei={look.lamps > 0 ? 3 : 0.3} shadow={false} />
        </group>
      ))}
      </group>
    </group>
  );
}

function Stairs() {
  const x0 = -8;
  const x1 = -5.9;
  const z0 = 2.2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.005, (z0 + D / 2) / 2]} scale={[x1 - x0, D / 2 - z0, 1]} material={mat("#3b2d22")}>
        <planeGeometry />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} p={[(x0 + x1) / 2, -0.01, z0 + 0.2 + i * 0.34]} s={[x1 - x0 - 0.2, 0.02, 0.04]} c="#6d5440" shadow={false} />
      ))}
      <mesh position={[x1, 0.5, (z0 + D / 2) / 2]} rotation={[0, Math.PI / 2, 0]} scale={[D / 2 - z0, 1, 1]}>
        <planeGeometry />
        <meshStandardMaterial color="#d7e6ec" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[(x0 + x1) / 2, 0.5, z0]} scale={[x1 - x0, 1, 1]}>
        <planeGeometry />
        <meshStandardMaterial color="#d7e6ec" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Box p={[x1, 1.0, (z0 + D / 2) / 2]} s={[0.05, 0.04, D / 2 - z0]} c="#2d2b29" />
      <Box p={[(x0 + x1) / 2, 1.0, z0]} s={[x1 - x0, 0.04, 0.05]} c="#2d2b29" />
    </group>
  );
}

function WallDetails() {
  // shelf with trailing plants and wall lights on the side walls, above head height
  return (
    <group>
      <Box p={[-W / 2 + 0.12, 2.0, -1.2]} s={[0.24, 0.04, 2.6]} c="#8a5a36" />
      {[-2.2, -1.4, -0.6, 0.2].map((z, i) => (
        <group key={i} position={[-W / 2 + 0.14, 2.02, z]}>
          <Cyl p={[0, 0.1, 0]} rt={0.09} h={0.2} c="#e9e2d6" low />
          <Ball p={[0, 0.25, 0]} r={[0.14, 0.12, 0.14]} c="#4e8b47" low />
          <Ball p={[0.02, 0.02, 0]} r={[0.06, 0.25, 0.08]} c="#3f7a3d" low />
        </group>
      ))}
      <Box p={[0, 0.06, -D / 2 + 0.02]} s={[W, 0.12, 0.03]} c="#d9d0c0" shadow={false} />
    </group>
  );
}

export function StringLights({ on }: { on: boolean }) {
  const bulbs = useMemo(() => {
    const out: [number, number, number][] = [];
    const lines = [-2.6, 0, 2.4];
    for (const z of lines) {
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = -W / 2 + 0.3 + t * (W - 0.6);
        const sag = Math.sin(t * Math.PI * 4) ** 2 * 0.35;
        out.push([x, H - 0.25 - sag, z + Math.sin(t * 9) * 0.05]);
      }
    }
    return out;
  }, []);
  if (!on) return null;
  return (
    <group>
      {bulbs.map((p, i) => (
        <Ball key={i} p={p} r={0.028} c="#fff0c8" emissive="#ffc46b" ei={4} low shadow={false} />
      ))}
    </group>
  );
}

export function Lights({ mood, stringLights }: { mood: MoodId; stringLights: boolean }) {
  const l = MOOD_LOOK[mood];
  return (
    <>
      <ambientLight intensity={l.amb} />
      <hemisphereLight args={[l.skyTop, "#7a5e40", l.hemi]} />
      <directionalLight
        position={l.sunPos}
        intensity={l.sun}
        color={l.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
      />
      {l.lamps > 0 &&
        [-4.5, 0, 4.5].map((x) => <pointLight key={x} position={[x, H - 0.9, -0.2]} intensity={l.lamps * (stringLights ? 1.3 : 1)} distance={9} decay={1.6} color="#ffc98a" />)}
      {stringLights && mood !== "day" && <pointLight position={[0, H - 0.5, 0]} intensity={2.2} distance={12} decay={1.4} color="#ffb860" />}
    </>
  );
}

export function Room({ mood, onFloorClick }: { mood: MoodId; onFloorClick: () => void }) {
  return (
    <group>
      <Floor onClick={onFloorClick} />
      <BackWall mood={mood} />
      <Plaster p={[-W / 2, H / 2, 0]} s={[D, H]} r={[0, Math.PI / 2, 0]} />
      <Plaster p={[W / 2, H / 2, 0]} s={[D, H]} r={[0, -Math.PI / 2, 0]} />
      <Ceiling mood={mood} />
      <Stairs />
      <WallDetails />
      {/* floor edge so the cut-away reads as a model */}
      <Box p={[0, -0.15, D / 2 + 0.05]} s={[W + 0.2, 0.3, 0.1]} c="#3a2e26" shadow={false} />
      <Box p={[0, -0.15, 0]} s={[W + 0.2, 0.28, D + 0.1]} c="#2e2520" shadow={false} />
    </group>
  );
}
