"use client";

import Intro from "@/components/Intro";
import Simulator from "@/components/Simulator";
import { useSim } from "@/lib/store";

export default function Home() {
  const screen = useSim((s) => s.screen);
  // test hook for QA scripts
  if (typeof window !== "undefined") (window as unknown as { __sim: typeof useSim }).__sim = useSim;
  return screen === "intro" ? <Intro /> : <Simulator />;
}
