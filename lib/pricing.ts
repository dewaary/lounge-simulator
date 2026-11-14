import { EXTRAS, ITEMS, VENUE, eventById, rupiah, themeById } from "./data";
import type { Placed } from "./store";
import type { EventId, ExtraId } from "./data";

export interface Quote {
  lines: { label: string; detail: string; amount: number }[];
  subtotal: number;
  tax: number;
  total: number;
  perGuest: number;
}

const pcs = (n: number) => `${n} piece${n === 1 ? "" : "s"}`;

export function buildQuote(args: {
  eventId: EventId;
  items: Placed[];
  guests: number;
  themeId: string;
  accent: string | null;
  extras: ExtraId[];
}): Quote {
  const ev = eventById(args.eventId);
  const theme = themeById(args.themeId);
  const furniture = args.items.filter((i) => ITEMS[i.type].group === "furniture");
  const decor = args.items.filter((i) => ITEMS[i.type].group === "decor");
  const sum = (list: Placed[]) => list.reduce((a, i) => a + ITEMS[i.type].price, 0);
  const extras = EXTRAS.filter((e) => args.extras.includes(e.id) && e.id !== "sound");
  const sound = args.extras.includes("sound") ? EXTRAS.find((e) => e.id === "sound")!.price : 0;
  const tables = furniture.filter((i) => ITEMS[i.type].seats.length > 0 || i.type === "cocktail").length;
  const extrasTotal = extras.reduce((a, e) => a + (e.id === "centerpieces" ? e.price * Math.max(1, tables) : e.price), 0);
  const themePrice = theme.price + (args.accent ? 250_000 : 0);

  const lines = [
    { label: "Venue hire", detail: `${VENUE.name}, 1 day`, amount: ev.venue },
    { label: "Food & drinks", detail: `${ev.fnbName} × ${args.guests}`, amount: ev.fnb * args.guests },
    { label: "Furniture & equipment", detail: `${pcs(furniture.length)}${sound ? " + sound system" : ""}`, amount: sum(furniture) + sound },
    { label: "Decoration", detail: `${pcs(decor.length)}${extras.length ? ` + ${extras.map((e) => e.name.toLowerCase()).join(", ")}` : ""}`, amount: sum(decor) + extrasTotal },
    { label: "Theme styling", detail: theme.name + (args.accent ? " + custom colour" : ""), amount: themePrice },
  ];
  const subtotal = lines.reduce((a, l) => a + l.amount, 0);
  const tax = subtotal * VENUE.serviceTax;
  const total = subtotal + tax;
  return { lines, subtotal, tax, total, perGuest: args.guests ? total / args.guests : 0 };
}

export function whatsappLink(q: Quote, args: { eventName: string; guests: number; date: string; theme: string; mood: string; items: Placed[] }) {
  const counts: Record<string, number> = {};
  for (const i of args.items) counts[ITEMS[i.type].name] = (counts[ITEMS[i.type].name] ?? 0) + 1;
  const list = Object.entries(counts)
    .map(([n, c]) => `- ${c} × ${n}`)
    .join("\n");
  const msg = [
    `Hi The Lounge team, I designed an event in your 3D planner:`,
    ``,
    `Event: ${args.eventName}`,
    `Date: ${args.date || "flexible"}`,
    `Guests: ${args.guests}`,
    `Theme: ${args.theme} · ${args.mood}`,
    ``,
    `Layout:`,
    list,
    ``,
    `Estimate shown: ${rupiah(q.total)} (incl. service & tax)`,
    ``,
    `Is this date available?`,
  ].join("\n");
  return `https://wa.me/${VENUE.whatsapp}?text=${encodeURIComponent(msg)}`;
}
