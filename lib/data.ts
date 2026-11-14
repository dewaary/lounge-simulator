// All venue data lives here so the real numbers from The Lounge can be dropped in later.
// PRICES ARE ILLUSTRATIVE (dummy) until the client sends their price list.

export const VENUE = {
  name: "The Lounge",
  by: "Meet me Cafe",
  area: "Kerobokan, Bali",
  // Room interior in metres (placeholder until real measurements arrive)
  width: 16, // x
  depth: 8, // z
  height: 3.2,
  maxStanding: 80,
  maxSeated: 50,
  whatsapp: "6281330907839", // TODO: confirm The Lounge events number
  email: "events@meetmebali.com",
  serviceTax: 0.21, // service charge + PB1
};

export type MoodId = "day" | "sunset" | "night";

export type EventId = "meeting" | "birthday" | "dinner" | "launch" | "social";

export interface EventType {
  id: EventId;
  name: string;
  blurb: string;
  venue: number; // venue hire per day
  fnbName: string;
  fnb: number; // per guest
  guests: number;
  mood: MoodId;
  theme: string;
  party: boolean; // guests move more
  layout: { type: ItemTypeId; x: number; z: number; rot: number }[];
  extras: ExtraId[];
}

export type ItemTypeId =
  | "longTable"
  | "roundTable"
  | "cocktail"
  | "sofaSet"
  | "mahjong"
  | "buffet"
  | "stage"
  | "balloons"
  | "flowers"
  | "backdrop"
  | "plant"
  | "sign";

export interface Seat {
  x: number;
  z: number;
  rot: number; // direction the guest faces (radians, local)
}

export interface ItemType {
  id: ItemTypeId;
  group: "furniture" | "decor";
  name: string;
  note: string;
  price: number;
  w: number; // footprint incl. chairs (x, before rotation)
  d: number; // footprint (z)
  seats: Seat[];
  standing: Seat[]; // spots for standing guests
}

const around = (n: number, r: number, offset = 0): Seat[] =>
  Array.from({ length: n }, (_, i) => {
    const a = offset + (i / n) * Math.PI * 2;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, rot: Math.atan2(-Math.cos(a), -Math.sin(a)) };
  });

// facing toward -z = rot 0 means guest looks along +z ... we use atan2(dx, dz) convention:
// rot = atan2(dirX, dirZ), guest model faces +z at rot 0.
const face = (x: number, z: number, tx = 0, tz = 0): Seat => ({ x, z, rot: Math.atan2(tx - x, tz - z) });

export const ITEMS: Record<ItemTypeId, ItemType> = {
  longTable: {
    id: "longTable",
    group: "furniture",
    name: "Long table",
    note: "Seats 8 · meetings & dinners",
    price: 250_000,
    w: 3.3,
    d: 2.3,
    seats: [-1.125, -0.375, 0.375, 1.125].flatMap((x) => [face(x, -0.78, x, 0), face(x, 0.78, x, 0)]),
    standing: [],
  },
  roundTable: {
    id: "roundTable",
    group: "furniture",
    name: "Round table",
    note: "Seats 6 · celebrations",
    price: 150_000,
    w: 2.7,
    d: 2.7,
    seats: around(6, 1.08).map((s) => face(s.x, s.z)),
    standing: [],
  },
  cocktail: {
    id: "cocktail",
    group: "furniture",
    name: "Cocktail table",
    note: "4 standing guests",
    price: 75_000,
    w: 1.6,
    d: 1.6,
    seats: [],
    standing: around(4, 0.62, Math.PI / 4).map((s) => face(s.x, s.z)),
  },
  sofaSet: {
    id: "sofaSet",
    group: "furniture",
    name: "Velvet lounge set",
    note: "Blue velvet sofa + armchair · 4 seats",
    price: 200_000,
    w: 2.6,
    d: 2.2,
    seats: [
      { x: -0.6, z: -0.55, rot: 0 },
      { x: 0, z: -0.55, rot: 0 },
      { x: 0.6, z: -0.55, rot: 0 },
      { x: 0.1, z: 0.75, rot: Math.PI },
    ],
    standing: [],
  },
  mahjong: {
    id: "mahjong",
    group: "furniture",
    name: "Mahjong table",
    note: "Seats 4 · games night",
    price: 100_000,
    w: 2.0,
    d: 2.0,
    seats: [face(0, -0.7), face(0.7, 0), face(0, 0.7), face(-0.7, 0)],
    standing: [],
  },
  buffet: {
    id: "buffet",
    group: "furniture",
    name: "Buffet station",
    note: "Food & drinks from the cafe",
    price: 300_000,
    w: 2.6,
    d: 1.4,
    seats: [],
    standing: [face(-0.7, 0.75, -0.7, 0), face(0.5, 0.75, 0.5, 0)],
  },
  stage: {
    id: "stage",
    group: "furniture",
    name: "Stage & screen",
    note: "Presentations, speeches, DJ",
    price: 750_000,
    w: 3.2,
    d: 1.8,
    seats: [],
    standing: [],
  },
  balloons: {
    id: "balloons",
    group: "decor",
    name: "Balloon cluster",
    note: "In your theme colours",
    price: 150_000,
    w: 0.7,
    d: 0.7,
    seats: [],
    standing: [],
  },
  flowers: {
    id: "flowers",
    group: "decor",
    name: "Flower stand",
    note: "Fresh arrangement",
    price: 250_000,
    w: 0.7,
    d: 0.7,
    seats: [],
    standing: [],
  },
  backdrop: {
    id: "backdrop",
    group: "decor",
    name: "Photo backdrop",
    note: "2.4 m wall for photos",
    price: 600_000,
    w: 2.6,
    d: 0.8,
    seats: [],
    standing: [face(-0.4, 0.9, 0, 3), face(0.4, 0.9, 0, 3)],
  },
  plant: {
    id: "plant",
    group: "decor",
    name: "Large plant",
    note: "Tropical potted palm",
    price: 100_000,
    w: 0.8,
    d: 0.8,
    seats: [],
    standing: [],
  },
  sign: {
    id: "sign",
    group: "decor",
    name: "Welcome sign",
    note: "Easel with your event name",
    price: 150_000,
    w: 0.8,
    d: 0.6,
    seats: [],
    standing: [],
  },
};

export type ExtraId = "stringLights" | "centerpieces" | "sound";

export const EXTRAS: { id: ExtraId; name: string; note: string; price: number }[] = [
  { id: "stringLights", name: "String lights", note: "Warm garlands across the ceiling", price: 350_000 },
  { id: "centerpieces", name: "Candles & centrepieces", note: "On every table", price: 50_000 },
  { id: "sound", name: "Sound system & mic", note: "Speakers, wireless mic, playlist", price: 500_000 },
];

export interface Theme {
  id: string;
  name: string;
  cloth: string;
  chair: string;
  accents: [string, string, string];
  price: number;
}

export const THEMES: Theme[] = [
  { id: "velvet", name: "Velvet Blue", cloth: "#f3eee4", chair: "#2c4290", accents: ["#2c4290", "#c9a45c", "#f3eee4"], price: 0 },
  { id: "sunset", name: "Tropical Sunset", cloth: "#f5e2c6", chair: "#c96d3d", accents: ["#e8743b", "#f2b544", "#d9485f"], price: 750_000 },
  { id: "blush", name: "Blush & Gold", cloth: "#f6e2dd", chair: "#d9aca4", accents: ["#e9a6a6", "#d4af37", "#ffffff"], price: 750_000 },
  { id: "garden", name: "Garden Party", cloth: "#eef1e4", chair: "#7c9a5e", accents: ["#5f8f4e", "#f3eed2", "#e7a3b5"], price: 600_000 },
  { id: "mono", name: "Monochrome", cloth: "#232326", chair: "#2b2b2e", accents: ["#151517", "#ffffff", "#9a9a9e"], price: 500_000 },
];

export const MOODS: { id: MoodId; name: string }[] = [
  { id: "day", name: "Daylight" },
  { id: "sunset", name: "Golden hour" },
  { id: "night", name: "Evening" },
];

export const EVENTS: EventType[] = [
  {
    id: "meeting",
    name: "Meeting & workshop",
    blurb: "Team days, presentations and workshops around the long table.",
    venue: 2_500_000,
    fnbName: "Coffee break & lunch",
    fnb: 175_000,
    guests: 14,
    mood: "day",
    theme: "velvet",
    party: false,
    layout: [
      { type: "longTable", x: -1.7, z: 0, rot: 0 },
      { type: "longTable", x: 1.7, z: 0, rot: 0 },
      { type: "stage", x: 5.8, z: 0, rot: -Math.PI / 2 },
      { type: "buffet", x: -5.6, z: -2.7, rot: 0 },
      { type: "plant", x: 4.2, z: -3.1, rot: 0 },
    ],
    extras: ["sound"],
  },
  {
    id: "birthday",
    name: "Birthday",
    blurb: "Balloons, a photo wall and room for everyone you love.",
    venue: 3_500_000,
    fnbName: "Party buffet & drinks",
    fnb: 250_000,
    guests: 24,
    mood: "night",
    theme: "sunset",
    party: true,
    layout: [
      { type: "roundTable", x: -3.6, z: 0.6, rot: 0 },
      { type: "roundTable", x: 0, z: 0.6, rot: 0 },
      { type: "roundTable", x: 3.6, z: 0.6, rot: 0 },
      { type: "backdrop", x: 6.4, z: -1.2, rot: -Math.PI / 2 },
      { type: "buffet", x: -1.8, z: -2.9, rot: 0 },
      { type: "balloons", x: 6.6, z: 1.3, rot: 0 },
      { type: "balloons", x: 2.4, z: -3.0, rot: 0 },
      { type: "balloons", x: -6.4, z: 2.6, rot: 0 },
      { type: "sign", x: -6.2, z: 0.4, rot: Math.PI / 2 },
    ],
    extras: ["stringLights", "centerpieces", "sound"],
  },
  {
    id: "dinner",
    name: "Private dinner",
    blurb: "One long candlelit table, set menu from the kitchen downstairs.",
    venue: 3_000_000,
    fnbName: "Three-course set menu",
    fnb: 450_000,
    guests: 16,
    mood: "sunset",
    theme: "blush",
    party: false,
    layout: [
      { type: "longTable", x: -1.6, z: 0, rot: 0 },
      { type: "longTable", x: 1.6, z: 0, rot: 0 },
      { type: "flowers", x: -4.3, z: -2.9, rot: 0 },
      { type: "flowers", x: 4.3, z: -2.9, rot: 0 },
      { type: "sofaSet", x: 5.4, z: 1.8, rot: Math.PI },
    ],
    extras: ["centerpieces", "stringLights"],
  },
  {
    id: "launch",
    name: "Launch & mixer",
    blurb: "Cocktail tables, a stage moment and a crowd that keeps moving.",
    venue: 5_000_000,
    fnbName: "Canapés & free-flow drinks",
    fnb: 300_000,
    guests: 50,
    mood: "night",
    theme: "mono",
    party: true,
    layout: [
      { type: "stage", x: 6.0, z: 0, rot: -Math.PI / 2 },
      { type: "cocktail", x: -4.5, z: -1.5, rot: 0 },
      { type: "cocktail", x: -4.5, z: 1.6, rot: 0 },
      { type: "cocktail", x: -1.5, z: -1.5, rot: 0 },
      { type: "cocktail", x: -1.5, z: 1.6, rot: 0 },
      { type: "cocktail", x: 1.5, z: -1.5, rot: 0 },
      { type: "cocktail", x: 1.5, z: 1.6, rot: 0 },
      { type: "buffet", x: -6.4, z: -0.1, rot: Math.PI / 2 },
      { type: "backdrop", x: 3.8, z: -3.2, rot: 0 },
    ],
    extras: ["stringLights", "sound"],
  },
  {
    id: "social",
    name: "Get-together & mahjong",
    blurb: "Sofas, games tables and a slow evening with friends.",
    venue: 2_000_000,
    fnbName: "Sharing plates & drinks",
    fnb: 150_000,
    guests: 16,
    mood: "sunset",
    theme: "garden",
    party: false,
    layout: [
      { type: "mahjong", x: -3.2, z: -1.0, rot: 0 },
      { type: "mahjong", x: -0.8, z: -1.0, rot: 0 },
      { type: "mahjong", x: 1.6, z: -1.0, rot: 0 },
      { type: "sofaSet", x: -2.0, z: 2.0, rot: Math.PI },
      { type: "sofaSet", x: 1.4, z: 2.0, rot: Math.PI },
      { type: "plant", x: 4.4, z: -3.1, rot: 0 },
    ],
    extras: ["centerpieces"],
  },
];

export const eventById = (id: EventId) => EVENTS.find((e) => e.id === id)!;
export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

export const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
