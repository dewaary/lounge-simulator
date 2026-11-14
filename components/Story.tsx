"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VENUE } from "@/lib/data";
import { useSim } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

// ---- story assets ----
// Frames from the 3 joined AI clips (facade → entrance → cafe → stairs), 12 fps.
const FRAME_COUNT = 326;
const frameSrc = (i: number) => `story/f_${String(i + 1).padStart(3, "0")}.webp`;
// Stills for the upstairs part, animated with a slow push-in until their clips exist.
const STILLS = ["story/K4.webp", "story/K5.webp", "story/K6.webp"];

// ---- scroll timeline (0..1) ----
const VIDEO_END = 0.7;
const STILL_RANGES: [number, number][] = [
  [0.7, 0.8], // stairs
  [0.8, 0.89], // lounge
  [0.89, 1.0], // lounge set for an event
];
const FADE = 0.03;
const CTA_AT = 0.92;

const CAPTIONS: { from: number; to: number; title: string; sub?: string }[] = [
  { from: 0, to: 0.12, title: "Kerobokan, after dark.", sub: "Jl. Raya Kerobokan 264, Kerobokan Kelod" },
  { from: 0.22, to: 0.38, title: "Through the timber doors.", sub: "Meet me Cafe is open 8am to 10pm, every day." },
  { from: 0.45, to: 0.62, title: "Coffee first.", sub: "Food and drinks for your event come from this kitchen." },
  { from: 0.67, to: 0.79, title: "Then, upstairs." },
  { from: 0.81, to: 0.89, title: "The Lounge.", sub: "Timber ceiling, green walls, quiet and air-conditioned." },
];

const LINES = [["Make", "it"], ["your", "event."]];

function captionStyle(p: number, from: number, to: number) {
  const span = to - from;
  const edge = Math.min(0.025, span / 3);
  let o = 0;
  if (p >= from && p <= to) {
    if (from === 0) o = p > to - edge ? (to - p) / edge : 1;
    else o = Math.min(1, (p - from) / edge, (to - p) / edge);
  }
  const y = (1 - o) * 18 * (p < (from + to) / 2 ? 1 : -1);
  return { opacity: o, transform: `translateY(${y}px)` };
}

export default function Story() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cta = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(0);
  const openPicker = useSim((s) => s.openPicker);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    const stills: (HTMLImageElement | null)[] = [null, null, null];
    const state = { p: 0 };
    let alive = true;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      draw();
    };

    // draw an image with object-fit: cover, optional zoom around a focus point
    const cover = (img: HTMLImageElement, alpha = 1, zoom = 1, fx = 0.5, fy = 0.5) => {
      const cw = cv.width;
      const ch = cv.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * zoom;
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - w) * fx, (ch - h) * fy, w, h);
      ctx.globalAlpha = 1;
    };

    const nearestFrame = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    };

    function draw() {
      const p = state.p;
      ctx.fillStyle = "#14120f";
      ctx.fillRect(0, 0, cv.width, cv.height);
      if (p < VIDEO_END + FADE) {
        const i = Math.min(FRAME_COUNT - 1, Math.round((Math.min(p, VIDEO_END) / VIDEO_END) * (FRAME_COUNT - 1)));
        const f = nearestFrame(i);
        if (f) cover(f);
      }
      STILL_RANGES.forEach(([a, b], k) => {
        const img = stills[k];
        if (!img || p < a || p > b + FADE) return;
        const t = (p - a) / (b - a);
        const alpha = Math.min(1, (p - a) / FADE);
        // slow push-in, as if the camera keeps walking
        cover(img, alpha, 1 + Math.min(t, 1.3) * 0.14, 0.5, 0.55);
      });

      // overlays
      CAPTIONS.forEach((c, k) => {
        const el = capRefs.current[k];
        if (!el) return;
        const st = captionStyle(p, c.from, c.to);
        el.style.opacity = String(st.opacity);
        el.style.transform = st.transform;
      });
      const ctaO = Math.max(0, Math.min(1, (p - CTA_AT) / 0.04));
      if (cta.current) {
        cta.current.style.opacity = String(ctaO);
        cta.current.style.pointerEvents = ctaO > 0.6 ? "auto" : "none";
        cta.current.classList.toggle("in", ctaO > 0.3);
      }
      if (shade.current) shade.current.style.opacity = String(0.35 + ctaO * 0.65);
      if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p / 0.03));
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    }

    // progressive loading: every 8th frame first, then fill the gaps
    const order: number[] = [];
    const seen = new Set<number>();
    for (const step of [8, 4, 2, 1])
      for (let i = 0; i < FRAME_COUNT; i += step)
        if (!seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
    let count = 0;
    const loadOne = (src: string) =>
      new Promise<HTMLImageElement | null>((res) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = src;
      });
    (async () => {
      const queue = [...order];
      const workers = Array.from({ length: 6 }, async () => {
        while (alive && queue.length) {
          const i = queue.shift()!;
          frames[i] = await loadOne(frameSrc(i));
          count++;
          if (count % 10 === 0 || count === FRAME_COUNT) {
            setLoaded(count);
            raf = requestAnimationFrame(draw);
          }
        }
      });
      STILLS.forEach(async (s, k) => {
        stills[k] = await loadOne(s);
      });
      await Promise.all(workers);
    })();

    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      onUpdate: draw,
    });

    window.addEventListener("resize", resize);
    resize();

    // coming back from the planner: land on the final scene
    if (useSim.getState().pickerOpen) {
      requestAnimationFrame(() => window.scrollTo(0, document.documentElement.scrollHeight));
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener("resize", resize);
    };
  }, []);

  const skip = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  let w = 0;

  return (
    <div className="story" ref={wrap}>
      <div className="story-stage">
        <canvas ref={canvas} className="story-canvas" aria-label="A walk from the street into The Lounge" />
        <div className="story-shade" ref={shade} />

        <header className="story-top">
          <span className="brand">
            {VENUE.name} <em>by {VENUE.by}</em>
          </span>
          <button className="btn btn-glass btn-sm" onClick={skip}>
            Skip to planner
          </button>
        </header>

        {CAPTIONS.map((c, k) => (
          <div key={k} className="story-cap" ref={(el) => {
            capRefs.current[k] = el;
          }} style={{ opacity: k === 0 ? 1 : 0 }}>
            <h2>{c.title}</h2>
            {c.sub && <p>{c.sub}</p>}
          </div>
        ))}

        <div className="story-cta" ref={cta} style={{ opacity: 0, pointerEvents: "none" }}>
          <p className="kicker">Event planner · 3D</p>
          <h1 className="headline">
            {LINES.map((line, li) => (
              <span className="line" key={li}>
                {line.map((word) => {
                  const d = w++ * 0.08;
                  return (
                    <span className="word" key={word + li}>
                      <span style={{ transitionDelay: `${d}s` }} className={word === "your" ? "accent" : undefined}>
                        {word}
                      </span>
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>
          <p className="lede">Lay out the tables, dress the room, invite your guests and see the estimate update as you go.</p>
          <button className="btn btn-primary btn-lg" onClick={() => openPicker(true)}>
            Make your event <span aria-hidden>→</span>
          </button>
          <ul className="facts">
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
        </div>

        <div className="story-hint" ref={hint}>
          <span>Scroll to step inside</span>
          <i />
        </div>
        <div className="story-bar">
          <span ref={bar} />
        </div>
        {loaded < 40 && (
          <div className="story-loading">
            <span className="spinner" /> Loading the walk-through…
          </div>
        )}
      </div>
    </div>
  );
}
