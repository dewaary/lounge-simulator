"use client";

import { ITEMS, ItemTypeId, Theme } from "@/lib/data";
import { GEO, METAL, VELVET, WOOD, WOOD_DARK, mat } from "./materials";

type V3 = [number, number, number];

interface Look {
  theme: Theme;
  accent: string; // primary accent (custom or theme)
  centerpieces: boolean;
}

export function Box({ p, s, c, r, rough, metal, emissive, ei, shadow = true }: { p: V3; s: V3; c: string; r?: V3; rough?: number; metal?: number; emissive?: string; ei?: number; shadow?: boolean }) {
  return (
    <mesh geometry={GEO.box} material={mat(c, { rough, metal, emissive, emissiveIntensity: ei })} position={p} scale={s} rotation={r} castShadow={shadow} receiveShadow />
  );
}

export function Cyl({ p, rt, h, c, rb, r, low, rough, metal, emissive, ei, shadow = true }: { p: V3; rt: number; h: number; c: string; rb?: number; r?: V3; low?: boolean; rough?: number; metal?: number; emissive?: string; ei?: number; shadow?: boolean }) {
  // radiusTop/bottom via non-uniform scale only works for equal radii; tapered pieces get their own geometry
  if (rb !== undefined && rb !== rt) {
    return (
      <mesh position={p} rotation={r} castShadow={shadow} receiveShadow material={mat(c, { rough, metal, emissive, emissiveIntensity: ei })}>
        <cylinderGeometry args={[rt, rb, h, low ? 10 : 28]} />
      </mesh>
    );
  }
  return (
    <mesh geometry={low ? GEO.cylLow : GEO.cyl} material={mat(c, { rough, metal, emissive, emissiveIntensity: ei })} position={p} scale={[rt, h, rt]} rotation={r} castShadow={shadow} receiveShadow />
  );
}

export function Ball({ p, r, c, rough, emissive, ei, low, shadow = true }: { p: V3; r: number | V3; c: string; rough?: number; emissive?: string; ei?: number; low?: boolean; shadow?: boolean }) {
  return (
    <mesh geometry={low ? GEO.sphereLow : GEO.sphere} material={mat(c, { rough, emissive, emissiveIntensity: ei })} position={p} scale={typeof r === "number" ? [r, r, r] : r} castShadow={shadow} />
  );
}

export function Chair({ x, z, rot, color }: { x: number; z: number; rot: number; color: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.46, -0.02]} s={[0.44, 0.06, 0.42]} c={color} rough={0.95} />
      <Box p={[0, 0.74, -0.22]} s={[0.44, 0.46, 0.05]} c={color} rough={0.95} />
      {[
        [-0.19, -0.19],
        [0.19, -0.19],
        [-0.19, 0.15],
        [0.19, 0.15],
      ].map(([lx, lz], i) => (
        <Cyl key={i} p={[lx, 0.22, lz]} rt={0.016} h={0.44} c={WOOD_DARK} low shadow={false} />
      ))}
    </group>
  );
}

function Candles({ xs, y }: { xs: number[]; y: number }) {
  return (
    <>
      {xs.map((x, i) => (
        <group key={i} position={[x, y, 0]}>
          <Cyl p={[0, 0.06, 0]} rt={0.03} h={0.12} c="#f6efe0" low shadow={false} />
          <Ball p={[0, 0.14, 0]} r={[0.016, 0.03, 0.016]} c="#ffcf7a" emissive="#ffb347" ei={3} low shadow={false} />
        </group>
      ))}
    </>
  );
}

function Posy({ p, look }: { p: V3; look: Look }) {
  const a = look.theme.accents;
  return (
    <group position={p}>
      <Cyl p={[0, 0.06, 0]} rt={0.05} h={0.12} c="#e8e2d6" rough={0.3} low shadow={false} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Ball key={i} p={[Math.cos(i * 1.3) * 0.06, 0.16 + (i % 2) * 0.03, Math.sin(i * 1.3) * 0.06]} r={0.05} c={i === 0 ? look.accent : a[i % 3]} low shadow={false} />
      ))}
    </group>
  );
}

function LongTable({ look }: { look: Look }) {
  const t = look.theme;
  return (
    <group>
      <Box p={[0, 0.37, 0]} s={[3.06, 0.74, 1.06]} c={t.cloth} rough={1} />
      <Box p={[0, 0.745, 0]} s={[2.9, 0.012, 0.32]} c={look.accent} rough={0.9} />
      {ITEMS.longTable.seats.map((s, i) => (
        <Chair key={i} x={s.x} z={s.z} rot={s.rot} color={t.chair} />
      ))}
      {look.centerpieces && (
        <>
          <Candles xs={[-1.2, -0.4, 0.4, 1.2]} y={0.75} />
          <Posy p={[-0.8, 0.75, 0]} look={look} />
          <Posy p={[0.8, 0.75, 0]} look={look} />
        </>
      )}
    </group>
  );
}

function RoundTable({ look }: { look: Look }) {
  const t = look.theme;
  return (
    <group>
      <Cyl p={[0, 0.37, 0]} rt={0.82} rb={0.9} h={0.74} c={t.cloth} rough={1} />
      <Cyl p={[0, 0.745, 0]} rt={0.82} h={0.01} c={t.cloth} rough={1} shadow={false} />
      {ITEMS.roundTable.seats.map((s, i) => (
        <Chair key={i} x={s.x} z={s.z} rot={s.rot} color={t.chair} />
      ))}
      {look.centerpieces ? (
        <>
          <Posy p={[0, 0.75, 0]} look={look} />
          <Candles xs={[-0.28, 0.28]} y={0.75} />
        </>
      ) : (
        <Cyl p={[0, 0.76, 0]} rt={0.25} h={0.02} c={look.accent} shadow={false} />
      )}
    </group>
  );
}

function Cocktail({ look }: { look: Look }) {
  const t = look.theme;
  return (
    <group>
      <Cyl p={[0, 0.54, 0]} rt={0.37} rb={0.46} h={1.06} c={t.cloth} rough={1} />
      <Cyl p={[0, 1.075, 0]} rt={0.37} h={0.02} c={t.cloth} rough={1} shadow={false} />
      <Cyl p={[0, 0.72, 0]} rt={0.31} h={0.06} c={look.accent} low shadow={false} />
      {look.centerpieces && <Candles xs={[0]} y={1.08} />}
      <Cyl p={[0.14, 1.14, 0.1]} rt={0.03} h={0.12} c="#d8efe9" rough={0.1} low shadow={false} />
    </group>
  );
}

function SofaSet() {
  const v = VELVET;
  const v2 = "#34499c";
  return (
    <group>
      {/* sofa */}
      <Box p={[0, 0.21, -0.62]} s={[1.9, 0.42, 0.86]} c={v} rough={1} />
      <Box p={[0, 0.46, -0.56]} s={[1.7, 0.1, 0.72]} c={v2} rough={1} />
      <Box p={[0, 0.64, -0.98]} s={[1.9, 0.56, 0.2]} c={v} rough={1} />
      <Box p={[-1.0, 0.3, -0.62]} s={[0.18, 0.6, 0.86]} c={v} rough={1} />
      <Box p={[1.0, 0.3, -0.62]} s={[0.18, 0.6, 0.86]} c={v} rough={1} />
      {/* coffee table */}
      <Cyl p={[0, 0.2, 0.08]} rt={0.42} h={0.4} c={WOOD} rough={0.6} />
      <Cyl p={[0.12, 0.45, 0.06]} rt={0.04} h={0.1} c="#efe7d8" low shadow={false} />
      {/* armchair */}
      <group position={[0.1, 0, 0.78]} rotation={[0, Math.PI, 0]}>
        <Box p={[0, 0.21, -0.05]} s={[0.82, 0.42, 0.76]} c={v} rough={1} />
        <Box p={[0, 0.62, -0.38]} s={[0.82, 0.5, 0.16]} c={v} rough={1} />
        <Box p={[-0.38, 0.3, -0.05]} s={[0.12, 0.56, 0.76]} c={v} rough={1} />
        <Box p={[0.38, 0.3, -0.05]} s={[0.12, 0.56, 0.76]} c={v} rough={1} />
      </group>
    </group>
  );
}

function Mahjong({ look }: { look: Look }) {
  const tiles: V3[] = [];
  for (let side = 0; side < 4; side++) {
    for (let i = -3; i <= 3; i++) {
      const a = (side * Math.PI) / 2;
      const lx = i * 0.07;
      const lz = 0.28;
      tiles.push([lx * Math.cos(a) + lz * Math.sin(a), 0.77, -lx * Math.sin(a) + lz * Math.cos(a)]);
    }
  }
  return (
    <group>
      <Box p={[0, 0.72, 0]} s={[0.92, 0.05, 0.92]} c={WOOD} rough={0.6} />
      <Box p={[0, 0.748, 0]} s={[0.8, 0.008, 0.8]} c="#2f6b47" rough={1} shadow={false} />
      {[
        [-0.4, -0.4],
        [0.4, -0.4],
        [-0.4, 0.4],
        [0.4, 0.4],
      ].map(([x, z], i) => (
        <Box key={i} p={[x, 0.35, z]} s={[0.05, 0.7, 0.05]} c={WOOD_DARK} shadow={false} />
      ))}
      {tiles.map((p, i) => (
        <Box key={i} p={p} s={[0.055, 0.035, 0.04]} c="#f4efe2" rough={0.4} shadow={false} />
      ))}
      {ITEMS.mahjong.seats.map((s, i) => (
        <Chair key={i} x={s.x} z={s.z} rot={s.rot} color={look.theme.chair} />
      ))}
    </group>
  );
}

function Buffet({ look }: { look: Look }) {
  return (
    <group>
      <Box p={[0, 0.37, -0.1]} s={[2.4, 0.74, 0.76]} c={look.theme.cloth} rough={1} />
      <Box p={[0, 0.745, 0.18]} s={[2.4, 0.012, 0.18]} c={look.accent} shadow={false} />
      {[-0.75, 0, 0.75].map((x, i) => (
        <group key={i} position={[x, 0.74, -0.12]}>
          <Box p={[0, 0.06, 0]} s={[0.5, 0.1, 0.34]} c="#c9cbd0" metal={0.8} rough={0.25} />
          <Cyl p={[0, 0.12, 0]} rt={0.17} h={0.5} r={[0, 0, Math.PI / 2]} c="#d8dade" metal={0.8} rough={0.2} low />
        </group>
      ))}
      <Cyl p={[1.05, 0.8, 0.12]} rt={0.12} h={0.12} c="#f7f5f0" low shadow={false} />
    </group>
  );
}

function Stage({ look }: { look: Look }) {
  return (
    <group>
      <Box p={[0, 0.125, 0]} s={[3.0, 0.25, 1.6]} c="#2b2724" rough={0.7} />
      <Box p={[0, 0.252, 0.79]} s={[3.0, 0.006, 0.04]} c={look.accent} shadow={false} />
      {/* screen */}
      <Box p={[0, 1.65, -0.62]} s={[2.3, 1.3, 0.06]} c={METAL} />
      <Box p={[0, 1.65, -0.585]} s={[2.18, 1.18, 0.01]} c="#dfe7f5" emissive="#bcd0f2" ei={0.9} shadow={false} />
      <Box p={[0, 1.65, -0.578]} s={[0.6, 0.12, 0.005]} c={look.accent} emissive={look.accent} ei={0.4} shadow={false} />
      <Cyl p={[-0.9, 0.62, -0.62]} rt={0.025} h={0.8} c={METAL} low />
      <Cyl p={[0.9, 0.62, -0.62]} rt={0.025} h={0.8} c={METAL} low />
      {/* speakers + mic */}
      <Box p={[-1.3, 0.62, -0.35]} s={[0.32, 0.75, 0.3]} c="#151515" />
      <Box p={[1.3, 0.62, -0.35]} s={[0.32, 0.75, 0.3]} c="#151515" />
      <Cyl p={[0.75, 0.82, 0.35]} rt={0.012} h={1.15} c={METAL} low />
      <Ball p={[0.75, 1.42, 0.35]} r={0.035} c="#333" low />
    </group>
  );
}

function Balloons({ look }: { look: Look }) {
  const colors = [look.accent, ...look.theme.accents];
  const ps: V3[] = [
    [0, 2.15, 0],
    [0.22, 1.95, 0.08],
    [-0.2, 1.9, -0.1],
    [0.05, 1.7, 0.2],
    [-0.12, 2.3, 0.15],
    [0.18, 2.32, -0.14],
    [-0.25, 1.62, 0.1],
  ];
  return (
    <group>
      <Box p={[0, 0.04, 0]} s={[0.12, 0.08, 0.12]} c={colors[1]} />
      {ps.map((p, i) => (
        <group key={i}>
          <Ball p={p} r={[0.2, 0.24, 0.2]} c={colors[i % colors.length]} rough={0.25} />
          <mesh position={[p[0] / 2, p[1] / 2, p[2] / 2]} rotation={[Math.atan2(p[2], p[1]), 0, -Math.atan2(p[0], p[1])]}>
            <cylinderGeometry args={[0.003, 0.003, p[1], 3]} />
            <meshBasicMaterial color="#ddd" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Flowers({ look }: { look: Look }) {
  const a = look.theme.accents;
  return (
    <group>
      <Cyl p={[0, 0.02, 0]} rt={0.18} h={0.04} c="#c8b28a" metal={0.6} rough={0.35} />
      <Cyl p={[0, 0.55, 0]} rt={0.025} h={1.05} c="#c8b28a" metal={0.6} rough={0.35} low />
      <Cyl p={[0, 1.15, 0]} rt={0.14} rb={0.09} h={0.22} c="#e9e4da" rough={0.3} />
      {Array.from({ length: 14 }, (_, i) => {
        const ang = i * 2.4;
        const rr = 0.08 + (i % 4) * 0.05;
        return <Ball key={i} p={[Math.cos(ang) * rr, 1.32 + (i % 3) * 0.07, Math.sin(ang) * rr]} r={0.07} c={i % 4 === 0 ? look.accent : a[i % 3]} rough={0.9} low />;
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <Ball key={`l${i}`} p={[Math.cos(i) * 0.24, 1.28, Math.sin(i) * 0.24]} r={[0.11, 0.035, 0.06]} c="#4e7a43" low />
      ))}
    </group>
  );
}

function Backdrop({ look }: { look: Look }) {
  const a = look.theme.accents;
  return (
    <group>
      <Box p={[-1.22, 1.2, 0]} s={[0.06, 2.4, 0.06]} c={METAL} />
      <Box p={[1.22, 1.2, 0]} s={[0.06, 2.4, 0.06]} c={METAL} />
      <Box p={[0, 0.02, 0]} s={[2.6, 0.04, 0.5]} c={METAL} />
      <Box p={[0, 1.3, 0]} s={[2.4, 2.2, 0.04]} c={look.accent} rough={0.9} />
      {[
        [-0.6, 1.8, 0.32],
        [0.55, 1.25, 0.42],
        [-0.3, 0.75, 0.24],
        [0.75, 2.05, 0.18],
      ].map(([x, y, r], i) => (
        <mesh key={i} geometry={GEO.circle} material={mat(i % 2 ? a[1] : a[2], { rough: 0.5 })} position={[x, y, 0.025]} scale={[r, r, 1]} />
      ))}
      <Box p={[0, 2.25, 0.03]} s={[1.2, 0.08, 0.01]} c={a[1]} shadow={false} />
    </group>
  );
}

function Plant() {
  return (
    <group>
      <Cyl p={[0, 0.24, 0]} rt={0.27} rb={0.21} h={0.48} c="#b8653c" rough={0.9} />
      <Cyl p={[0, 0.8, 0]} rt={0.035} h={0.8} c="#6a5136" low />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[0, 1.2 + (i % 2) * 0.12, 0]} rotation={[0, a, 0]}>
            <mesh geometry={GEO.sphereLow} material={mat(i % 2 ? "#3f7a3d" : "#4f8b46")} position={[0, 0, 0.34]} rotation={[0.55, 0, 0]} scale={[0.12, 0.03, 0.42]} castShadow />
          </group>
        );
      })}
    </group>
  );
}

function Sign({ look }: { look: Look }) {
  return (
    <group>
      <Cyl p={[-0.22, 0.75, 0.08]} rt={0.015} h={1.55} r={[-0.12, 0, 0.06]} c={WOOD} low />
      <Cyl p={[0.22, 0.75, 0.08]} rt={0.015} h={1.55} r={[-0.12, 0, -0.06]} c={WOOD} low />
      <Cyl p={[0, 0.72, -0.2]} rt={0.015} h={1.5} r={[0.3, 0, 0]} c={WOOD} low />
      <group position={[0, 1.15, 0.12]} rotation={[-0.12, 0, 0]}>
        <Box p={[0, 0, 0]} s={[0.62, 0.82, 0.03]} c={look.theme.cloth} />
        <Box p={[0, 0.2, 0.02]} s={[0.44, 0.07, 0.005]} c={look.accent} shadow={false} />
        <Box p={[0, 0.05, 0.02]} s={[0.36, 0.03, 0.005]} c={look.theme.accents[1]} shadow={false} />
        <Box p={[0, -0.05, 0.02]} s={[0.3, 0.03, 0.005]} c={look.theme.accents[1]} shadow={false} />
      </group>
    </group>
  );
}

export function ItemModel({ type, look }: { type: ItemTypeId; look: Look }) {
  switch (type) {
    case "longTable":
      return <LongTable look={look} />;
    case "roundTable":
      return <RoundTable look={look} />;
    case "cocktail":
      return <Cocktail look={look} />;
    case "sofaSet":
      return <SofaSet />;
    case "mahjong":
      return <Mahjong look={look} />;
    case "buffet":
      return <Buffet look={look} />;
    case "stage":
      return <Stage look={look} />;
    case "balloons":
      return <Balloons look={look} />;
    case "flowers":
      return <Flowers look={look} />;
    case "backdrop":
      return <Backdrop look={look} />;
    case "plant":
      return <Plant />;
    case "sign":
      return <Sign look={look} />;
  }
}

export type { Look };
