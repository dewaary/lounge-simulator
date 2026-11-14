"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { ITEMS, eventById, themeById } from "@/lib/data";
import { Placed, clampToRoom, footprint, guestPlacement, isValid, snap, useSim } from "@/lib/store";
import { ItemModel, Look } from "./Models";
import { Guests } from "./Guests";
import { Lights, MOOD_LOOK, Room, StringLights } from "./Room";

const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();

function SelectionRing({ item, valid }: { item: Placed; valid: boolean }) {
  const t = ITEMS[item.type];
  const geo = useMemo(() => {
    const w = t.w / 2;
    const d = t.d / 2;
    const shape = new THREE.Shape();
    const r = 0.12;
    shape.moveTo(-w + r, -d);
    shape.lineTo(w - r, -d);
    shape.quadraticCurveTo(w, -d, w, -d + r);
    shape.lineTo(w, d - r);
    shape.quadraticCurveTo(w, d, w - r, d);
    shape.lineTo(-w + r, d);
    shape.quadraticCurveTo(-w, d, -w, d - r);
    shape.lineTo(-w, -d + r);
    shape.quadraticCurveTo(-w, -d, -w + r, -d);
    const hole = new THREE.Path();
    const i = 0.05;
    hole.moveTo(-w + i + r, -d + i);
    hole.lineTo(w - i - r, -d + i);
    hole.quadraticCurveTo(w - i, -d + i, w - i, -d + i + r);
    hole.lineTo(w - i, d - i - r);
    hole.quadraticCurveTo(w - i, d - i, w - i - r, d - i);
    hole.lineTo(-w + i + r, d - i);
    hole.quadraticCurveTo(-w + i, d - i, -w + i, d - i - r);
    hole.lineTo(-w + i, -d + i + r);
    hole.quadraticCurveTo(-w + i, -d + i, -w + i + r, -d + i);
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
  }, [t.w, t.d]);
  return (
    <group>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <meshBasicMaterial color={valid ? "#c6f24e" : "#ff4d4d"} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} scale={[t.w, t.d, 1]}>
        <planeGeometry />
        <meshBasicMaterial color={valid ? "#c6f24e" : "#ff4d4d"} transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PlacedItem({ item, look, selected }: { item: Placed; look: Look; selected: boolean }) {
  const select = useSim((s) => s.select);
  const setDragging = useSim((s) => s.setDragging);
  const moveItem = useSim((s) => s.moveItem);
  const drag = useRef<{ dx: number; dz: number; last: { x: number; z: number } } | null>(null);
  const [valid, setValid] = useState(true);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    select(item.id);
    if (!e.ray.intersectPlane(floorPlane, hit)) return;
    drag.current = { dx: hit.x - item.x, dz: hit.z - item.z, last: { x: item.x, z: item.z } };
    (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(floorPlane, hit)) return;
    const p = clampToRoom(item.type, snap(hit.x - drag.current.dx), snap(hit.z - drag.current.dz), item.rot);
    const items = useSim.getState().items;
    const ok = isValid(items, { ...item, ...p });
    if (ok) drag.current.last = p;
    setValid(ok);
    moveItem(item.id, p.x, p.z);
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    e.stopPropagation();
    (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
    const items = useSim.getState().items;
    const cur = items.find((i) => i.id === item.id)!;
    if (!isValid(items, cur)) moveItem(item.id, drag.current.last.x, drag.current.last.z);
    drag.current = null;
    setValid(true);
    setDragging(false);
  };

  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, item.rot, 0]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <ItemModel type={item.type} look={look} />
      {selected && <SelectionRing item={item} valid={valid} />}
    </group>
  );
}

const PRESETS = {
  overview: { pos: [8.6, 8.2, 10.4], target: [0, 0.6, 0] },
  guest: { pos: [6.6, 1.6, 3.3], target: [-3, 1.15, -1.2] },
  top: { pos: [0, 21, 0.01], target: [0, 0, 0] },
} as const;

function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitImpl | null;
  const preset = useSim((s) => s.camera);
  const nonce = useSim((s) => s.cameraNonce);
  const anim = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; t: number } | null>(null);

  useEffect(() => {
    const p = PRESETS[preset];
    const portrait = size.width < size.height;
    const k = preset === "guest" ? 1 : portrait ? (preset === "top" ? 2.1 : 1.9) : size.width < 900 ? 1.2 : 1;
    const pos = new THREE.Vector3(...(preset === "overview" && portrait ? ([0.8, 11, 8.2] as const) : p.pos));
    const target = new THREE.Vector3(...p.target);
    if (k !== 1) pos.sub(target).multiplyScalar(k).add(target);
    anim.current = { pos, target, t: 0 };
  }, [preset, nonce, size.width, size.height]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.t += dt;
    const f = 1 - Math.pow(0.0015, dt);
    camera.position.lerp(a.pos, f);
    controls.target.lerp(a.target, f);
    controls.update();
    if (a.t > 1.6) anim.current = null;
  });
  return null;
}

function SceneContent() {
  const items = useSim((s) => s.items);
  const selectedId = useSim((s) => s.selectedId);
  const dragging = useSim((s) => s.dragging);
  const themeId = useSim((s) => s.themeId);
  const accent = useSim((s) => s.accent);
  const mood = useSim((s) => s.mood);
  const guests = useSim((s) => s.guests);
  const extras = useSim((s) => s.extras);
  const eventId = useSim((s) => s.eventId);
  const select = useSim((s) => s.select);

  const theme = themeById(themeId);
  const look: Look = { theme, accent: accent ?? theme.accents[0], centerpieces: extras.includes("centerpieces") };
  const spots = useMemo(() => guestPlacement(items, guests), [items, guests]);
  const party = eventById(eventId).party && mood !== "day";
  const bg = MOOD_LOOK[mood].bg;

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 30, 60]} />
      <Lights mood={mood} stringLights={extras.includes("stringLights")} />
      <Room mood={mood} onFloorClick={() => select(null)} />
      <StringLights on={extras.includes("stringLights")} />
      {items.map((it) => (
        <PlacedItem key={it.id} item={it} look={look} selected={it.id === selectedId} />
      ))}
      <Guests spots={spots} party={party} />
      <OrbitControls
        makeDefault
        enabled={!dragging}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.48}
        minDistance={2}
        maxDistance={32}
        target={[0, 0.6, 0]}
      />
      <CameraRig />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ fov: 42, position: [8.6, 8.2, 10.4], near: 0.1, far: 120 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerMissed={() => useSim.getState().select(null)}
    >
      <SceneContent />
    </Canvas>
  );
}

export { footprint };
