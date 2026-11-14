"use client";

import { create } from "zustand";
import { EVENTS, ExtraId, EventId, ITEMS, ItemTypeId, MoodId, VENUE, eventById } from "./data";

export interface Placed {
  id: string;
  type: ItemTypeId;
  x: number;
  z: number;
  rot: number; // multiples of PI/2
}

export type Screen = "intro" | "simulator";
export type CameraPreset = "overview" | "guest" | "top";

interface State {
  screen: Screen;
  pickerOpen: boolean;
  eventId: EventId;
  items: Placed[];
  selectedId: string | null;
  dragging: boolean;
  themeId: string;
  accent: string | null; // custom accent overrides theme accent[0]
  mood: MoodId;
  guests: number;
  extras: ExtraId[];
  date: string;
  camera: CameraPreset;
  cameraNonce: number;

  openPicker: (open: boolean) => void;
  startEvent: (id: EventId) => void;
  backToIntro: () => void;
  addItem: (type: ItemTypeId) => void;
  moveItem: (id: string, x: number, z: number) => void;
  rotateSelected: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  select: (id: string | null) => void;
  setDragging: (v: boolean) => void;
  setTheme: (id: string) => void;
  setAccent: (c: string | null) => void;
  setMood: (m: MoodId) => void;
  setGuests: (n: number) => void;
  toggleExtra: (id: ExtraId) => void;
  setDate: (d: string) => void;
  setCamera: (c: CameraPreset) => void;
  resetLayout: () => void;
}

let counter = 0;
const uid = () => `it${Date.now().toString(36)}${(counter++).toString(36)}`;

// ---------- geometry helpers ----------
export const HALF_W = VENUE.width / 2 - 0.25;
export const HALF_D = VENUE.depth / 2 - 0.25;

// Fixed parts of the venue that nothing can be placed on (stair opening)
export const FIXED_OBSTACLES = [{ minX: -8, maxX: -5.9, minZ: 2.2, maxZ: 4 }];

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function footprint(type: ItemTypeId, x: number, z: number, rot: number): Rect {
  const t = ITEMS[type];
  const quarter = Math.round(rot / (Math.PI / 2));
  const swap = Math.abs(quarter) % 2 === 1;
  const w = swap ? t.d : t.w;
  const d = swap ? t.w : t.d;
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

const overlap = (a: Rect, b: Rect, pad = 0.02) =>
  a.minX < b.maxX - pad && a.maxX > b.minX + pad && a.minZ < b.maxZ - pad && a.maxZ > b.minZ + pad;

export function isValid(items: Placed[], cand: Placed): boolean {
  const r = footprint(cand.type, cand.x, cand.z, cand.rot);
  if (r.minX < -HALF_W - 0.2 || r.maxX > HALF_W + 0.2 || r.minZ < -HALF_D - 0.2 || r.maxZ > HALF_D + 0.2) return false;
  if (FIXED_OBSTACLES.some((o) => overlap(r, o))) return false;
  return !items.some((o) => o.id !== cand.id && overlap(r, footprint(o.type, o.x, o.z, o.rot)));
}

export const snap = (v: number, step = 0.25) => Math.round(v / step) * step;

export function clampToRoom(type: ItemTypeId, x: number, z: number, rot: number) {
  const r = footprint(type, 0, 0, rot);
  const hw = (r.maxX - r.minX) / 2;
  const hd = (r.maxZ - r.minZ) / 2;
  return {
    x: Math.min(HALF_W + 0.2 - hw, Math.max(-HALF_W - 0.2 + hw, x)),
    z: Math.min(HALF_D + 0.2 - hd, Math.max(-HALF_D - 0.2 + hd, z)),
  };
}

function findFreeSpot(items: Placed[], type: ItemTypeId, rot = 0, near?: { x: number; z: number }) {
  const cx = near?.x ?? 0;
  const cz = near?.z ?? 0;
  // spiral search on a 0.5 m grid
  for (let ring = 0; ring < 40; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (const [dx, dz] of [
        [i, -ring],
        [i, ring],
        [-ring, i],
        [ring, i],
      ]) {
        const p = clampToRoom(type, snap(cx + dx * 0.5), snap(cz + dz * 0.5), rot);
        const cand = { id: "_", type, x: p.x, z: p.z, rot };
        if (isValid(items, cand)) return p;
      }
    }
  }
  return null;
}

function layoutFor(id: EventId): Placed[] {
  return eventById(id).layout.map((l) => ({ id: uid(), ...l }));
}

export const useSim = create<State>((set, get) => ({
  screen: "intro",
  pickerOpen: false,
  eventId: "birthday",
  items: [],
  selectedId: null,
  dragging: false,
  themeId: "velvet",
  accent: null,
  mood: "night",
  guests: 20,
  extras: [],
  date: "",
  camera: "overview",
  cameraNonce: 0,

  openPicker: (open) => set({ pickerOpen: open }),
  startEvent: (id) => {
    const ev = eventById(id);
    set({
      screen: "simulator",
      pickerOpen: false,
      eventId: id,
      items: layoutFor(id),
      selectedId: null,
      themeId: ev.theme,
      accent: null,
      mood: ev.mood,
      guests: ev.guests,
      extras: [...ev.extras],
      camera: "overview",
      cameraNonce: get().cameraNonce + 1,
    });
  },
  backToIntro: () => set({ screen: "intro", pickerOpen: true, selectedId: null }),
  addItem: (type) => {
    const items = get().items;
    const spot = findFreeSpot(items, type);
    if (!spot) return;
    const it: Placed = { id: uid(), type, x: spot.x, z: spot.z, rot: 0 };
    set({ items: [...items, it], selectedId: it.id });
  },
  moveItem: (id, x, z) => set({ items: get().items.map((i) => (i.id === id ? { ...i, x, z } : i)) }),
  rotateSelected: () => {
    const { items, selectedId } = get();
    const it = items.find((i) => i.id === selectedId);
    if (!it) return;
    const rot = it.rot + Math.PI / 2;
    const p = clampToRoom(it.type, it.x, it.z, rot);
    let cand = { ...it, rot, ...p };
    if (!isValid(items, cand)) {
      const spot = findFreeSpot(items.filter((i) => i.id !== it.id), it.type, rot, it);
      if (!spot) return;
      cand = { ...cand, ...spot };
    }
    set({ items: items.map((i) => (i.id === it.id ? cand : i)) });
  },
  duplicateSelected: () => {
    const { items, selectedId } = get();
    const it = items.find((i) => i.id === selectedId);
    if (!it) return;
    const spot = findFreeSpot(items, it.type, it.rot, it);
    if (!spot) return;
    const copy = { ...it, id: uid(), ...spot };
    set({ items: [...items, copy], selectedId: copy.id });
  },
  deleteSelected: () => {
    const { items, selectedId } = get();
    set({ items: items.filter((i) => i.id !== selectedId), selectedId: null });
  },
  select: (id) => set({ selectedId: id }),
  setDragging: (v) => set({ dragging: v }),
  setTheme: (id) => set({ themeId: id, accent: null }),
  setAccent: (c) => set({ accent: c }),
  setMood: (m) => set({ mood: m }),
  setGuests: (n) => set({ guests: n }),
  toggleExtra: (id) => {
    const ex = get().extras;
    set({ extras: ex.includes(id) ? ex.filter((e) => e !== id) : [...ex, id] });
  },
  setDate: (d) => set({ date: d }),
  setCamera: (c) => set({ camera: c, cameraNonce: get().cameraNonce + 1 }),
  resetLayout: () => set({ items: layoutFor(get().eventId), selectedId: null }),
}));

// ---------- derived data ----------
export interface GuestSpot {
  x: number;
  z: number;
  rot: number;
  seated: boolean;
}

const rotate = (x: number, z: number, r: number) => ({
  x: x * Math.cos(r) + z * Math.sin(r),
  z: -x * Math.sin(r) + z * Math.cos(r),
});

export function worldSpots(items: Placed[]) {
  const seats: GuestSpot[] = [];
  const standing: GuestSpot[] = [];
  for (const it of items) {
    const t = ITEMS[it.type];
    for (const s of t.seats) {
      const p = rotate(s.x, s.z, it.rot);
      seats.push({ x: it.x + p.x, z: it.z + p.z, rot: s.rot + it.rot, seated: true });
    }
    for (const s of t.standing) {
      const p = rotate(s.x, s.z, it.rot);
      standing.push({ x: it.x + p.x, z: it.z + p.z, rot: s.rot + it.rot, seated: false });
    }
  }
  return { seats, standing };
}

// deterministic pseudo random
export const rand = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function guestPlacement(items: Placed[], count: number): GuestSpot[] {
  const { seats, standing } = worldSpots(items);
  const out: GuestSpot[] = [];
  const seatOrder = [...seats];
  for (let i = 0; i < seatOrder.length && out.length < count; i++) out.push(seatOrder[i]);
  for (let i = 0; i < standing.length && out.length < count; i++) out.push(standing[i]);
  // remaining guests mingle in pairs on free floor
  const rects = items.map((i) => footprint(i.type, i.x, i.z, i.rot));
  let k = 0;
  while (out.length < count && k < 4000) {
    k++;
    const x = (rand(k) * 2 - 1) * (HALF_W - 0.6);
    const z = (rand(k + 999) * 2 - 1) * (HALF_D - 0.6);
    const inside = rects.some((r) => x > r.minX - 0.15 && x < r.maxX + 0.15 && z > r.minZ - 0.15 && z < r.maxZ + 0.15);
    const stairs = FIXED_OBSTACLES.some((r) => x > r.minX - 0.3 && x < r.maxX && z > r.minZ - 0.3 && z < r.maxZ);
    const crowded = out.some((g) => (g.x - x) ** 2 + (g.z - z) ** 2 < 0.5 * 0.5);
    if (inside || stairs || crowded) continue;
    // a partner faces this guest
    const a = rand(k + 55) * Math.PI * 2;
    out.push({ x, z, rot: a, seated: false });
    if (out.length < count) {
      const px = x + Math.sin(a) * 0.7;
      const pz = z + Math.cos(a) * 0.7;
      const pInside = rects.some((r) => px > r.minX - 0.15 && px < r.maxX + 0.15 && pz > r.minZ - 0.15 && pz < r.maxZ + 0.15);
      if (!pInside && Math.abs(px) < HALF_W - 0.4 && Math.abs(pz) < HALF_D - 0.4)
        out.push({ x: px, z: pz, rot: a + Math.PI, seated: false });
    }
  }
  return out;
}

export function useCounts() {
  const items = useSim((s) => s.items);
  const { seats, standing } = worldSpots(items);
  return { seats: seats.length, standing: standing.length };
}

export { EVENTS };
