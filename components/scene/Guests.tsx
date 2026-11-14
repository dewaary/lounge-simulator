"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GuestSpot, rand } from "@/lib/store";

/*
  Guests are built like architectural-visualisation people: real body proportions
  (≈7.5 heads tall), tapered limbs with joints, men and women, dresses and trousers,
  everyday clothing colours. Every body part is an InstancedMesh, so 100 guests are
  ~15 draw calls and stay smooth on phones.
*/

// ---------- palettes (real clothing, not toy colours) ----------
const SKIN = ["#f3d2b8", "#e8bd9c", "#d6a07a", "#b97e57", "#8e5a3a", "#6b4128"];
const HAIR = ["#16110d", "#2a1c13", "#4a3222", "#6d4a2e", "#a07a4f", "#c9b08a", "#7d7873"];
const TOPS = ["#f2efe8", "#e6dccb", "#1f2a3d", "#2b2b2e", "#56603f", "#8a4a32", "#a9bfd3", "#c8b597", "#3f4a55", "#6e2f3a", "#9aa58c", "#ffffff"];
const BOTTOMS = ["#2a2c31", "#1f2633", "#141414", "#c9b99d", "#3c5170", "#7b7058", "#e9e4da"];
const DRESSES = ["#141414", "#1f4d3d", "#a4543b", "#1d2a45", "#d8c3a0", "#c99a9a", "#5a2e3c"];
const SHOES = ["#1a1a1a", "#3a2a1f", "#5b3e2b", "#e8e4dc"];

type Part = "skin" | "top" | "bottom" | "hair" | "shoe" | "glass";
type GeoId = "sphere" | "limb" | "torsoM" | "torsoF" | "skirt" | "hairCap" | "cyl";

const PART_MATS: Record<Part, THREE.MeshStandardMaterial> = {
  skin: new THREE.MeshStandardMaterial({ roughness: 0.55 }),
  top: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
  bottom: new THREE.MeshStandardMaterial({ roughness: 0.92 }),
  hair: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
  shoe: new THREE.MeshStandardMaterial({ roughness: 0.45 }),
  glass: new THREE.MeshStandardMaterial({ roughness: 0.1, transparent: true, opacity: 0.55 }),
};

function lathe(points: [number, number][], segs = 20) {
  const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segs);
  g.computeVertexNormals();
  return g;
}

const GEOS: Record<GeoId, THREE.BufferGeometry> = {
  sphere: new THREE.SphereGeometry(1, 18, 14),
  // tapered limb, unit length along +y from 0 to 1
  limb: new THREE.CylinderGeometry(0.8, 1, 1, 12, 1).translate(0, 0.5, 0),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12, 1),
  // torso profiles (radius, height) — shoulders, chest, waist, hips
  torsoM: lathe([
    [0.0, 0],
    [0.135, 0.0],
    [0.15, 0.08],
    [0.14, 0.24],
    [0.152, 0.38],
    [0.175, 0.5],
    [0.19, 0.56],
    [0.15, 0.6],
    [0.06, 0.63],
    [0.0, 0.63],
  ]),
  torsoF: lathe([
    [0.0, 0],
    [0.145, 0.0],
    [0.158, 0.07],
    [0.12, 0.24],
    [0.148, 0.38],
    [0.155, 0.47],
    [0.162, 0.53],
    [0.13, 0.57],
    [0.05, 0.6],
    [0.0, 0.6],
  ]),
  // A-line skirt from the waist down, unit height
  skirt: lathe([
    [0.13, 1],
    [0.16, 0.8],
    [0.21, 0.35],
    [0.24, 0.0],
    [0.0, 0.0],
  ]),
  hairCap: new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
};

interface Inst {
  person: number;
  geo: GeoId;
  part: Part;
  color: THREE.Color;
  local: THREE.Matrix4;
  head: boolean;
}

const UP = new THREE.Vector3(0, 1, 0);
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// matrix placing the unit limb from a to b with radius r
function seg(a: THREE.Vector3, b: THREE.Vector3, r: number) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  return new THREE.Matrix4().compose(a, q, new THREE.Vector3(r, len, r));
}
const blob = (p: THREE.Vector3, s: [number, number, number], rx = 0) =>
  new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(...s));

const pick = <T,>(arr: T[], seed: number) => arr[Math.floor(rand(seed) * arr.length) % arr.length];

function buildPerson(i: number, spot: GuestSpot, out: Inst[]) {
  const female = rand(i + 5) > 0.5;
  const dress = female && rand(i + 9) > 0.45;
  const scale = (female ? 0.94 : 1) * (0.95 + rand(i + 17) * 0.09);
  const c = (hex: string) => new THREE.Color(hex);
  const skin = c(pick(SKIN, i + 7));
  const hair = c(pick(HAIR, i + 11));
  const bottom = c(dress ? pick(DRESSES, i + 13) : pick(BOTTOMS, i + 13));
  const top = dress ? bottom : c(pick(TOPS, i + 3));
  const shoe = c(pick(SHOES, i + 21));
  const S = new THREE.Matrix4().makeScale(scale, scale, scale);
  const add = (geo: GeoId, part: Part, color: THREE.Color, m: THREE.Matrix4, head = false) =>
    out.push({ person: i, geo, part, color, local: S.clone().multiply(m), head });

  const seated = spot.seated;
  const hipW = female ? 0.095 : 0.1;
  const shW = female ? 0.175 : 0.2;
  const legR = female ? 0.055 : 0.062;
  const armR = female ? 0.036 : 0.042;

  // body landmarks (person faces +z)
  const hipY = seated ? 0.52 : 0.93;
  const torsoBase = seated ? 0.5 : 0.9;
  const torsoH = female ? 0.6 : 0.63;
  const shY = torsoBase + torsoH - 0.07;
  const neckY = torsoBase + torsoH - 0.02;
  const headC = v(0, neckY + 0.15, 0.01);
  const lean = seated ? 0.04 : 0;

  // legs
  for (const side of [-1, 1]) {
    const hip = v(side * hipW, hipY, seated ? -0.02 : 0);
    const knee = seated ? v(side * hipW * 1.05, hipY + 0.01, 0.42) : v(side * hipW * 0.95, 0.5, 0.015);
    const ankle = seated ? v(side * hipW * 1.1, 0.09, 0.47) : v(side * hipW * 0.9, 0.09, 0);
    const legColor = dress ? (seated ? bottom : skin) : bottom;
    const thighColor = dress ? bottom : bottom;
    add("limb", "bottom", thighColor, seg(hip, knee, legR * 1.25));
    add("sphere", "bottom", thighColor, blob(knee, [legR * 1.05, legR * 1.05, legR * 1.05]));
    add("limb", dress && !seated ? "skin" : "bottom", legColor, seg(knee, ankle, legR));
    add("sphere", "shoe", shoe, blob(v(ankle.x, 0.045, ankle.z + 0.05), [0.048, 0.042, 0.125]));
  }
  if (dress && !seated) add("skirt", "bottom", bottom, blob(v(0, 0.52, 0), [1.05, 0.46, 0.82]));

  // torso (elliptical: wider than deep)
  const torsoM = new THREE.Matrix4().compose(v(0, torsoBase, lean), new THREE.Quaternion(), v(1, 1, 0.66));
  add(female ? "torsoF" : "torsoM", "top", top, torsoM);

  // arms
  const sleeveColor = dress && rand(i + 31) > 0.5 ? skin : top;
  const holdsDrink = !seated && rand(i + 23) > 0.45;
  for (const side of [-1, 1]) {
    const sh = v(side * shW, shY, lean);
    let elbow: THREE.Vector3;
    let wrist: THREE.Vector3;
    if (seated && !spot.sofa) {
      // forearms resting on the table edge
      elbow = v(side * (shW + 0.02), shY - 0.27, 0.13);
      wrist = v(side * 0.13, 0.78, 0.38);
    } else if (seated) {
      elbow = v(side * (shW + 0.03), shY - 0.28, 0.06);
      wrist = v(side * 0.12, hipY + 0.06, 0.3);
    } else if (holdsDrink && side === 1) {
      elbow = v(side * (shW + 0.03), shY - 0.28, 0.02);
      wrist = v(side * (shW - 0.04), shY - 0.24, 0.2);
      add("cyl", "glass", c("#e9f2f2"), blob(v(wrist.x, wrist.y + 0.05, wrist.z + 0.02), [0.026, 0.09, 0.026]));
    } else {
      elbow = v(side * (shW + 0.04), shY - 0.29, -0.01);
      wrist = v(side * (shW + 0.03), shY - 0.55, 0.03);
    }
    add("sphere", sleeveColor === skin ? "skin" : "top", sleeveColor, blob(sh, [armR * 1.25, armR * 1.25, armR * 1.25]));
    add("limb", sleeveColor === skin ? "skin" : "top", sleeveColor, seg(sh, elbow, armR * 1.2));
    add("sphere", sleeveColor === skin ? "skin" : "top", sleeveColor, blob(elbow, [armR * 1.02, armR * 1.02, armR * 1.02]));
    add("limb", "skin", skin, seg(elbow, wrist, armR * 0.9));
    add("sphere", "skin", skin, blob(wrist.clone().add(v(0, -0.02, 0.01)), [0.032, 0.05, 0.022]));
  }

  // neck, head, hair (marked head = true so they can turn)
  add("cyl", "skin", skin, blob(v(0, neckY + 0.03, lean * 0.5), [0.045, 0.09, 0.045]), true);
  add("sphere", "skin", skin, blob(headC, [0.088, 0.112, 0.1]), true);
  const style = Math.floor(rand(i + 41) * 3);
  add("hairCap", "hair", hair, blob(headC.clone().add(v(0, 0.012, -0.008)), [0.094, 0.108, 0.104], -0.25), true);
  if (female && style !== 2) {
    // long hair down the back, or a low bun
    if (style === 0) add("sphere", "hair", hair, blob(headC.clone().add(v(0, -0.1, -0.055)), [0.095, 0.16, 0.06]), true);
    else add("sphere", "hair", hair, blob(headC.clone().add(v(0, -0.04, -0.1)), [0.05, 0.045, 0.045]), true);
  }
}

export function Guests({ spots, party }: { spots: GuestSpot[]; party: boolean }) {
  const { groups, persons } = useMemo(() => {
    const insts: Inst[] = [];
    spots.forEach((s, i) => buildPerson(i, s, insts));
    const map = new Map<string, Inst[]>();
    for (const it of insts) {
      const k = `${it.geo}|${it.part}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return { groups: [...map.entries()], persons: spots.map((_, i) => rand(i + 101) * Math.PI * 2) };
  }, [spots]);

  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);

  useEffect(() => {
    groups.forEach(([, list], gi) => {
      const mesh = refs.current[gi];
      if (!mesh) return;
      list.forEach((it, k) => mesh.setColorAt(k, it.color));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [groups]);

  const tmp = useMemo(
    () => ({ P: new THREE.Matrix4(), H: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), out: new THREE.Matrix4(), pivot: new THREE.Matrix4(), unpivot: new THREE.Matrix4() }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const personM: THREE.Matrix4[] = [];
    const headM: THREE.Matrix4[] = [];
    spots.forEach((s, i) => {
      const ph = persons[i] ?? 0;
      let y = 0;
      let rotY = s.rot;
      let rotZ = 0;
      if (!s.seated && party) {
        y = Math.abs(Math.sin(t * 4.2 + ph)) * 0.035;
        rotY += Math.sin(t * 2.1 + ph) * 0.22;
        rotZ = Math.sin(t * 4.2 + ph) * 0.03;
      } else if (!s.seated) {
        rotY += Math.sin(t * 0.5 + ph) * 0.06;
      }
      tmp.e.set(0, rotY, rotZ);
      tmp.q.setFromEuler(tmp.e);
      personM[i] = new THREE.Matrix4().compose(new THREE.Vector3(s.x, y, s.z), tmp.q, new THREE.Vector3(1, 1, 1));
      // head turns around the neck
      const neckY = s.seated ? 1.04 : 1.44;
      const yaw = Math.sin(t * 0.6 + ph * 2) * 0.5;
      const nod = Math.sin(t * 1.3 + ph) * 0.04;
      tmp.pivot.makeTranslation(0, neckY, 0);
      tmp.unpivot.makeTranslation(0, -neckY, 0);
      tmp.e.set(nod, yaw, 0);
      headM[i] = new THREE.Matrix4().multiplyMatrices(tmp.pivot, new THREE.Matrix4().makeRotationFromEuler(tmp.e)).multiply(tmp.unpivot);
    });
    groups.forEach(([, list], gi) => {
      const mesh = refs.current[gi];
      if (!mesh) return;
      list.forEach((it, k) => {
        tmp.out.copy(personM[it.person]);
        if (it.head) tmp.out.multiply(headM[it.person]);
        tmp.out.multiply(it.local);
        mesh.setMatrixAt(k, tmp.out);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      {groups.map(([key, list], gi) => {
        const [geo, part] = key.split("|") as [GeoId, Part];
        return (
          <instancedMesh
            key={`${key}-${list.length}`}
            ref={(m) => {
              refs.current[gi] = m;
            }}
            args={[GEOS[geo], PART_MATS[part], list.length]}
            castShadow={part !== "glass"}
            receiveShadow
            frustumCulled={false}
            raycast={() => null}
          />
        );
      })}
    </group>
  );
}
