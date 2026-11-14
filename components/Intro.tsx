"use client";

import { EVENTS, rupiah } from "@/lib/data";
import { useSim } from "@/lib/store";
import { EventIcon } from "./ui/Icons";
import Story from "./Story";

export default function Intro() {
  const pickerOpen = useSim((s) => s.pickerOpen);
  const openPicker = useSim((s) => s.openPicker);
  const startEvent = useSim((s) => s.startEvent);

  return (
    <main className="intro-story">
      <Story />

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
                  <span className="event-from">Venue from {rupiah(ev.venue)} / day</span>
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
