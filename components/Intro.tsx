"use client";

import { EVENTS, VENUE, rupiah } from "@/lib/data";
import { useSim } from "@/lib/store";
import { EventIcon } from "./ui/Icons";

const LINES = [["Plan", "your", "event"], ["in", "the", "room,"], ["before", "it", "happens."]];

export default function Intro() {
  const pickerOpen = useSim((s) => s.pickerOpen);
  const openPicker = useSim((s) => s.openPicker);
  const startEvent = useSim((s) => s.startEvent);
  let w = 0;

  return (
    <main className="intro">
      <div className="intro-slats" aria-hidden />
      <div className="intro-glow" aria-hidden />
      <header className="intro-top">
        <span className="brand">
          {VENUE.name} <em>by {VENUE.by}</em>
        </span>
        <span className="muted">{VENUE.area}</span>
      </header>

      <section className="intro-hero">
        <p className="kicker reveal" style={{ animationDelay: "0.1s" }}>
          Event planner · 3D
        </p>
        <h1 className="headline">
          {LINES.map((line, li) => (
            <span className="line" key={li}>
              {line.map((word) => {
                const d = 0.25 + w++ * 0.09;
                return (
                  <span className="word" key={word + li}>
                    <span style={{ animationDelay: `${d}s` }} className={word === "room," ? "accent" : undefined}>
                      {word}
                    </span>
                  </span>
                );
              })}
            </span>
          ))}
        </h1>
        <p className="lede reveal" style={{ animationDelay: "1.3s" }}>
          Lay out the tables, dress the room, invite your guests and see how The Lounge will feel on the day. Your estimate updates as you go.
        </p>
        <div className="reveal" style={{ animationDelay: "1.5s" }}>
          <button className="btn btn-primary btn-lg" onClick={() => openPicker(true)}>
            Make your event <span aria-hidden>→</span>
          </button>
        </div>
        <ul className="facts reveal" style={{ animationDelay: "1.7s" }}>
          <li>
            <strong>{VENUE.maxStanding}</strong> standing
          </li>
          <li>
            <strong>{VENUE.maxSeated}</strong> seated
          </li>
          <li>
            <strong>8am–10pm</strong> daily
          </li>
        </ul>
      </section>

      {pickerOpen && (
        <div className="picker-backdrop" onClick={() => openPicker(false)}>
          <div className="picker" role="dialog" aria-label="Choose your event" onClick={(e) => e.stopPropagation()}>
            <div className="picker-head">
              <div>
                <p className="kicker">Step 1 of 2</p>
                <h2>What are we celebrating?</h2>
              </div>
              <button className="icon-btn" aria-label="Close" onClick={() => openPicker(false)}>
                ✕
              </button>
            </div>
            <div className="picker-grid">
              {EVENTS.map((ev, i) => (
                <button key={ev.id} className="event-card" style={{ animationDelay: `${i * 0.06}s` }} onClick={() => startEvent(ev.id)}>
                  <span className="event-icon">
                    <EventIcon id={ev.id} />
                  </span>
                  <span className="event-name">{ev.name}</span>
                  <span className="event-blurb">{ev.blurb}</span>
                  <span className="event-from">
                    Venue from {rupiah(ev.venue)} / day
                  </span>
                </button>
              ))}
            </div>
            <p className="fine">Prices in this concept are examples.</p>
          </div>
        </div>
      )}
    </main>
  );
}
