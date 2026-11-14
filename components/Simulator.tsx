"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { EXTRAS, ITEMS, ItemTypeId, MOODS, THEMES, VENUE, eventById, rupiah, themeById } from "@/lib/data";
import { useCounts, useSim } from "@/lib/store";
import { buildQuote, whatsappLink } from "@/lib/pricing";
import { ItemIcon } from "./ui/Icons";

const Scene = dynamic(() => import("./scene/Scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <span className="spinner" /> Setting up The Lounge…
    </div>
  ),
});

type Tab = "layout" | "decor" | "style" | "guests";
const TABS: { id: Tab; label: string }[] = [
  { id: "layout", label: "Layout" },
  { id: "decor", label: "Decor" },
  { id: "style", label: "Style" },
  { id: "guests", label: "Guests" },
];

const FURNITURE = (Object.keys(ITEMS) as ItemTypeId[]).filter((k) => ITEMS[k].group === "furniture");
const DECOR = (Object.keys(ITEMS) as ItemTypeId[]).filter((k) => ITEMS[k].group === "decor");

function Catalog({ list }: { list: ItemTypeId[] }) {
  const addItem = useSim((s) => s.addItem);
  const items = useSim((s) => s.items);
  return (
    <div className="catalog">
      {list.map((id) => {
        const t = ITEMS[id];
        const n = items.filter((i) => i.type === id).length;
        return (
          <button key={id} className="cat-item" onClick={() => addItem(id)} title={`Add ${t.name}`}>
            <span className="cat-icon">
              <ItemIcon id={id} />
            </span>
            <span className="cat-text">
              <span className="cat-name">
                {t.name}
                {n > 0 && <span className="count">×{n}</span>}
              </span>
              <span className="cat-note">{t.note}</span>
            </span>
            <span className="cat-price">{rupiah(t.price)}</span>
            <span className="cat-add" aria-hidden>
              +
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Vibe() {
  const guests = useSim((s) => s.guests);
  const items = useSim((s) => s.items);
  const extras = useSim((s) => s.extras);
  const mood = useSim((s) => s.mood);
  const eventId = useSim((s) => s.eventId);
  const decor = items.filter((i) => ITEMS[i.type].group === "decor").length;
  let score = Math.min(guests / VENUE.maxStanding, 1) * 45 + Math.min(decor, 6) * 4 + (extras.includes("stringLights") ? 10 : 0) + (extras.includes("sound") ? 10 : 0) + (mood === "night" ? 10 : mood === "sunset" ? 5 : 0) + (eventById(eventId).party ? 6 : 0);
  score = Math.round(Math.min(100, score));
  const label = score < 30 ? "Calm & focused" : score < 55 ? "Cosy & chatty" : score < 75 ? "Lively" : "Full party";
  return (
    <div className="vibe">
      <div className="vibe-head">
        <span>Atmosphere</span>
        <strong>{label}</strong>
      </div>
      <div className="vibe-bar">
        <span style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Panel({ tab }: { tab: Tab }) {
  const s = useSim();
  const { seats, standing } = useCounts();
  const theme = themeById(s.themeId);

  if (tab === "layout")
    return (
      <>
        <p className="hint">Tap to add, then drag it into place. Rotate or remove it from the bar below.</p>
        <Catalog list={FURNITURE} />
        <button className="btn btn-ghost btn-sm" onClick={s.resetLayout}>
          Reset to suggested layout
        </button>
      </>
    );
  if (tab === "decor")
    return (
      <>
        <Catalog list={DECOR} />
        <h4 className="sub">Add-ons</h4>
        <div className="toggles">
          {EXTRAS.map((e) => (
            <label key={e.id} className="toggle">
              <input type="checkbox" checked={s.extras.includes(e.id)} onChange={() => s.toggleExtra(e.id)} />
              <span className="toggle-ui" />
              <span className="toggle-text">
                <span>{e.name}</span>
                <small>{e.note}</small>
              </span>
              <span className="cat-price">
                {rupiah(e.price)}
                {e.id === "centerpieces" ? " / table" : ""}
              </span>
            </label>
          ))}
        </div>
      </>
    );
  if (tab === "style")
    return (
      <>
        <h4 className="sub">Theme</h4>
        <div className="themes">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme ${t.id === s.themeId ? "on" : ""}`} onClick={() => s.setTheme(t.id)}>
              <span className="swatches">
                <i style={{ background: t.cloth }} />
                <i style={{ background: t.chair }} />
                {t.accents.map((a, i) => (
                  <i key={i} style={{ background: a }} />
                ))}
              </span>
              <span className="theme-name">{t.name}</span>
              <span className="theme-price">{t.price ? `+ ${rupiah(t.price)}` : "Included"}</span>
            </button>
          ))}
        </div>
        <h4 className="sub">Your colour</h4>
        <div className="colour-row">
          <input type="color" value={s.accent ?? theme.accents[0]} onChange={(e) => s.setAccent(e.target.value)} aria-label="Accent colour" />
          <span>Runners, balloons, backdrop and flowers</span>
          {s.accent && (
            <button className="link" onClick={() => s.setAccent(null)}>
              Reset
            </button>
          )}
        </div>
        <h4 className="sub">Time of day</h4>
        <div className="seg">
          {MOODS.map((m) => (
            <button key={m.id} className={m.id === s.mood ? "on" : ""} onClick={() => s.setMood(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
      </>
    );
  // guests
  const over = s.guests > VENUE.maxStanding;
  const noSeat = Math.max(0, s.guests - seats);
  const seatedEvent = s.eventId === "meeting" || s.eventId === "dinner";
  return (
    <>
      <div className="guest-count">
        <button className="icon-btn" onClick={() => s.setGuests(Math.max(1, s.guests - 1))} aria-label="Fewer guests">
          −
        </button>
        <div>
          <strong>{s.guests}</strong>
          <span>guests</span>
        </div>
        <button className="icon-btn" onClick={() => s.setGuests(Math.min(100, s.guests + 1))} aria-label="More guests">
          +
        </button>
      </div>
      <input className="range" type="range" min={1} max={100} value={s.guests} onChange={(e) => s.setGuests(+e.target.value)} aria-label="Number of guests" />
      <div className="stats">
        <div>
          <strong>{seats}</strong>
          <span>chairs & sofa seats</span>
        </div>
        <div>
          <strong>{standing}</strong>
          <span>standing spots</span>
        </div>
      </div>
      {over && <p className="warn">That is more than The Lounge holds ({VENUE.maxStanding} standing / {VENUE.maxSeated} seated).</p>}
      {!over && seatedEvent && noSeat > 0 && (
        <p className="warn">
          {noSeat} guest{noSeat > 1 ? "s" : ""} without a chair. Add a table in Layout.
        </p>
      )}
      <Vibe />
    </>
  );
}

function Quote({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const s = useSim();
  const ev = eventById(s.eventId);
  const theme = themeById(s.themeId);
  const q = useMemo(
    () => buildQuote({ eventId: s.eventId, items: s.items, guests: s.guests, themeId: s.themeId, accent: s.accent, extras: s.extras }),
    [s.eventId, s.items, s.guests, s.themeId, s.accent, s.extras]
  );
  const wa = whatsappLink(q, { eventName: ev.name, guests: s.guests, date: s.date, theme: theme.name, mood: MOODS.find((m) => m.id === s.mood)!.name, items: s.items });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <aside className={`quote ${open ? "open" : ""}`}>
      <button className="quote-bar" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>
          <small>Estimate for 1 day</small>
          <strong>{rupiah(q.total)}</strong>
        </span>
        <span className="quote-toggle">{open ? "Hide" : "Details"}</span>
      </button>
      <div className="quote-body">
        <ul className="lines">
          {q.lines.map((l) => (
            <li key={l.label}>
              <span>
                {l.label}
                <small>{l.detail}</small>
              </span>
              <span>{l.amount ? rupiah(l.amount) : "—"}</span>
            </li>
          ))}
          <li className="taxline">
            <span>Service & tax (21%)</span>
            <span>{rupiah(q.tax)}</span>
          </li>
          <li className="total">
            <span>Total</span>
            <span>{rupiah(q.total)}</span>
          </li>
        </ul>
        <p className="per">≈ {rupiah(q.perGuest)} per guest</p>
        <label className="date">
          <span>Preferred date</span>
          <input type="date" min={today} value={s.date} onChange={(e) => s.setDate(e.target.value)} />
        </label>
        <a className="btn btn-primary btn-block" href={wa} target="_blank" rel="noopener">
          Send to The Lounge on WhatsApp
        </a>
        <p className="fine">Example prices for this concept. The team confirms availability and the final quote.</p>
      </div>
    </aside>
  );
}

function SelectionBar() {
  const s = useSim();
  const it = s.items.find((i) => i.id === s.selectedId);
  if (!it) return null;
  const t = ITEMS[it.type];
  return (
    <div className="selbar" role="toolbar" aria-label={`${t.name} tools`}>
      <span className="selname">{t.name}</span>
      <button onClick={s.rotateSelected} title="Rotate (R)">
        ⟳ Rotate
      </button>
      <button onClick={s.duplicateSelected} title="Duplicate (D)">
        ⧉ Copy
      </button>
      <button className="danger" onClick={s.deleteSelected} title="Remove (Delete)">
        ✕ Remove
      </button>
      <button className="close" onClick={() => s.select(null)} aria-label="Deselect">
        Done
      </button>
    </div>
  );
}

export default function Simulator() {
  const [tab, setTab] = useState<Tab>("layout");
  const [sheetOpen, setSheetOpen] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const s = useSim();
  const ev = eventById(s.eventId);
  const panelRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLElement>(null);

  // On phones the sheet and top bar cover part of the canvas: tell the 3D camera
  // so it frames the room inside the visible area.
  useEffect(() => {
    const measure = () => {
      const mobile = window.innerWidth <= 900;
      const top = mobile ? (topRef.current?.getBoundingClientRect().bottom ?? 0) : 0;
      const bottom = mobile && panelRef.current ? window.innerHeight - panelRef.current.getBoundingClientRect().top : 0;
      useSim.getState().setViewInset({ top, bottom });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (panelRef.current) ro.observe(panelRef.current);
    if (topRef.current) ro.observe(topRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) setSheetOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const st = useSim.getState();
      if (!st.selectedId) return;
      if (e.key === "r" || e.key === "R") st.rotateSelected();
      else if (e.key === "d" || e.key === "D") st.duplicateSelected();
      else if (e.key === "Delete" || e.key === "Backspace") st.deleteSelected();
      else if (e.key === "Escape") st.select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="sim">
      <div className="scene">
        <Scene />
      </div>

      <header className="sim-top" ref={topRef}>
        <button className="btn btn-glass btn-sm" onClick={s.backToIntro}>
          ← Events
        </button>
        <div className="sim-title">
          <small>{VENUE.name}</small>
          <strong>{ev.name}</strong>
        </div>
        <div className="seg seg-glass" role="group" aria-label="Camera">
          {(["overview", "guest", "top"] as const).map((c) => (
            <button key={c} className={s.camera === c ? "on" : ""} onClick={() => s.setCamera(c)}>
              {c === "overview" ? "3D" : c === "guest" ? "Guest view" : "Floor plan"}
            </button>
          ))}
        </div>
      </header>

      <section className={`panel ${sheetOpen ? "open" : ""}`} ref={panelRef}>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "on" : ""}
              onClick={() => {
                if (tab === t.id) setSheetOpen(!sheetOpen);
                else {
                  setTab(t.id);
                  setSheetOpen(true);
                }
              }}
            >
              {t.label}
              {t.id === "guests" && <span className="badge">{s.guests}</span>}
            </button>
          ))}
          {sheetOpen && (
            <button className="panel-close" onClick={() => setSheetOpen(false)} aria-label="Close panel">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
        <div className="panel-body">
          <Panel tab={tab} />
        </div>
      </section>

      <Quote open={quoteOpen} setOpen={setQuoteOpen} />
      <SelectionBar />
      <p className="credit">Concept by Bellmango</p>
    </div>
  );
}
