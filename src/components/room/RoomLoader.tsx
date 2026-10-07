"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, animate, useMotionTemplate } from "motion/react";
import { sniglet } from "./fonts";
import { EASE_OUT, enter } from "./overlays/motion";

// The landing screen, in the room's own language: a record spinning while the
// room loads, the panda walking along the progress line, a few cozy status
// lines, then "come on in" - and the lights come up from the middle.

const BG = "#1f1b16";
const LINES = [
  "dusting the shelves…",
  "brewing the coffee…",
  "feeding the panda…",
  "tuning the record player…",
  "fluffing the pillows…",
  "racing the hot wheels…",
];
const MIN_MS = 1400; // even when cached, long enough to read

function Panda() {
  // the same little panda as the envelope stamp, walking
  return (
    <motion.div
      className="relative h-6 w-7"
      animate={{ y: [0, -2, 0], rotate: [-4, 4, -4] }}
      transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }}
    >
      <div className="absolute inset-x-0 bottom-0 h-5 rounded-full bg-[#F4F1EA]" />
      <span className="absolute -top-0.5 left-0 h-2.5 w-2.5 rounded-full bg-[#1b1b1f]" />
      <span className="absolute -top-0.5 right-0 h-2.5 w-2.5 rounded-full bg-[#1b1b1f]" />
      <span className="absolute left-1.5 top-2 h-1.5 w-1.5 rotate-12 rounded-full bg-[#1b1b1f]" />
      <span className="absolute right-1.5 top-2 h-1.5 w-1.5 -rotate-12 rounded-full bg-[#1b1b1f]" />
      <span className="absolute bottom-1 left-1/2 h-1 w-1.5 -translate-x-1/2 rounded-full bg-[#1b1b1f]" />
    </motion.div>
  );
}

function Record({ ready }: { ready: boolean }) {
  return (
    <motion.div
      className="relative h-44 w-44 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:h-52 sm:w-52"
      style={{
        background:
          "repeating-radial-gradient(circle, #151311 0 2px, #211d1a 2px 4px)",
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: ready ? 1.8 : 3.4, ease: "linear" }}
    >
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_20deg,transparent_0_18%,rgba(255,236,190,0.10)_24%,transparent_30%_68%,rgba(255,236,190,0.07)_74%,transparent_80%)]" />
      <div className="absolute left-1/2 top-1/2 flex h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#C9A24D]">
        <span className="text-[10px] tracking-[0.2em] text-[#3b2a14]">AJ</span>
        <span className="absolute h-2 w-2 rounded-full bg-[#151311]" />
      </div>
    </motion.div>
  );
}

interface RoomLoaderProps {
  /** Real loading progress, 0-100. */
  loaded: number;
  /** Called once the lights are up and the room should take over. */
  onEnter: () => void;
}

export default function RoomLoader({ loaded, onEnter }: RoomLoaderProps) {
  const [minDone, setMinDone] = useState(false);
  const [line, setLine] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Never keep a visitor here on a slow or failed download.
  const done = loaded >= 100 || timedOut;
  const ready = minDone && done;
  // The panda walks at least as slowly as the minimum time, so a cached load
  // doesn't teleport it to the end, and never passes the real download.
  const [ramp, setRamp] = useState(0);
  const shown = ready ? 100 : Math.min(loaded, ramp, 92);

  // The "lights on" reveal: a hole in the loader that opens from the centre.
  // Starts fully closed: the soft edge sits entirely at negative radius.
  const hole = useMotionValue(-18);
  const mask = useMotionTemplate`radial-gradient(circle at 50% 50%, transparent ${hole}vmax, black calc(${hole}vmax + 18vmax))`;

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_MS);
    const cap = setTimeout(() => setTimedOut(true), 8000);
    const start = performance.now();
    const r = setInterval(() => setRamp(((performance.now() - start) / MIN_MS) * 100), 120);
    const i = setInterval(() => setLine((n) => (n + 1) % LINES.length), 1300);
    return () => {
      clearTimeout(t);
      clearTimeout(cap);
      clearInterval(r);
      clearInterval(i);
    };
  }, []);

  const go = () => {
    if (!ready || leaving) return;
    setLeaving(true);
    onEnter(); // start the camera zoom while the light opens up
    animate(hole, 160, { duration: 1.1, ease: EASE_OUT });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Enter" && go();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${sniglet.className}`}
      style={{
        background: `radial-gradient(ellipse at 50% 45%, #2b241d 0%, ${BG} 60%)`,
        WebkitMaskImage: mask,
        maskImage: mask,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 14 }}
        animate={leaving ? { opacity: 0, scale: 0.94 } : { opacity: 1, y: 0 }}
        transition={leaving ? { duration: 0.35 } : enter(0.1, 0.7)}
      >
        <Record ready={ready} />

        <h1 className="mt-10 text-4xl text-[#F2E8DA] sm:text-5xl">archit jaiswal</h1>

        {/* progress line with the panda walking along it */}
        <div className="relative mt-8 h-8 w-64 sm:w-72">
          <div className="absolute bottom-1 left-0 right-0 h-[2px] rounded-full bg-[#F2E8DA]/15" />
          <motion.div
            className="absolute bottom-1 left-0 h-[2px] rounded-full bg-[#FFDE85]"
            animate={{ width: `${shown}%` }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          />
          <motion.div
            className="absolute bottom-1.5"
            animate={{ left: `calc(${shown}% - 14px)` }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <Panda />
          </motion.div>
        </div>

        <div className="mt-6 h-12">
          <AnimatePresence mode="wait">
            {ready ? (
              <motion.button
                key="enter"
                onClick={go}
                className="rounded-full border border-[#FFDE85]/60 px-7 py-2.5 text-lg text-[#FFDE85] hover:bg-[#FFDE85] hover:text-[#2b211b]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={enter(0, 0.4)}
                whileTap={{ scale: 0.96 }}
              >
                come on in →
              </motion.button>
            ) : (
              <motion.p
                key={line}
                className="pt-2 text-[#C9BFAF]/80"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                {LINES[line]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
