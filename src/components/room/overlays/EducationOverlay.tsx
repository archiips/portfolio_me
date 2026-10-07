"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { aboutMe } from "@/lib/projects";
import Overlay from "./Overlay";
import { EASE_OUT, enter, leave } from "./motion";

// Education as a page in a spiral notebook: lined paper, a red margin, the
// GPA circled in red ink and a gold star sticker for the Dean's List. Tabs on
// the side switch between the degree and the certificate.

const TABS = [
  {
    id: "uw",
    tab: "UW",
    color: "#B9A6DE",
    heading: "University of Washington Bothell",
    sub: "BS, Computer Science & Software Engineering",
    when: "Sept 2024 – expected June 2028",
    gpa: aboutMe.gpa as string | null,
    sticker: "Dean's List",
    notes: [
      "Data Structures & Algorithms (C++)",
      "Parallel & Distributed Computing",
      "Network Design & Programming",
      "Databases · Agile Software Engineering",
    ],
  },
  {
    id: "club",
    tab: "club",
    color: "#9FC9B0",
    heading: aboutMe.leadership.org.split(",")[0],
    sub: `${aboutMe.leadership.title}, University of Washington`,
    when: aboutMe.leadership.period,
    gpa: null,
    sticker: "president",
    notes: [
      "Donation drive for Seattle Children's",
      "Hygiene kits for unhoused neighbours",
      "Building tiny homes",
      "Habitat restoration with Whale Scout",
    ],
  },
];

const LINE = 32; // px between ruled lines

function Circle() {
  return (
    <svg className="pointer-events-none absolute -inset-x-1.5 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+12px)]" viewBox="0 0 120 60" preserveAspectRatio="none">
      <motion.path
        d="M8 32 C 6 12, 60 4, 104 14 C 122 20, 116 48, 70 54 C 30 58, 4 48, 14 24"
        fill="none"
        stroke="#C8433A"
        strokeWidth="2.6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, transition: { duration: 0.7, delay: 0.75, ease: "easeInOut" } }}
      />
    </svg>
  );
}

function Page({ t }: { t: (typeof TABS)[number] }) {
  // Each line of "handwriting" fades in after the one before it.
  const line = (k: number) => ({
    initial: { opacity: 0, x: -6 },
    animate: { opacity: 1, x: 0, transition: enter(0.2 + k * 0.08, 0.4) },
  });
  return (
    <motion.div
      key={t.id}
      className="relative pl-16 pr-8 text-[#2f3b55] [font-family:var(--font-sniglet)]"
      style={{ lineHeight: `${LINE}px`, paddingTop: LINE * 2 - 6 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <motion.p {...line(0)} className="text-2xl">{t.heading}</motion.p>
      <motion.p {...line(1)} className="text-lg text-[#46526e]">{t.sub}</motion.p>
      <motion.p {...line(2)} className="text-[#6b7590]">{t.when}</motion.p>
      {t.gpa && (
        <motion.p {...line(3)} className="text-lg">
          GPA <span className="relative inline-block px-1 text-xl">{t.gpa}<Circle /></span> / 4.0
        </motion.p>
      )}
      <motion.p {...line(4)} className="mt-[32px] text-sm uppercase tracking-[0.2em] text-[#8a93a8]">
        notes
      </motion.p>
      {t.notes.map((n, k) => (
        <motion.p key={n} {...line(5 + k)} className="flex items-center gap-3">
          <span className="text-[#C8433A]">✓</span>
          {n}
        </motion.p>
      ))}

      {/* gold star sticker, slapped on at an angle */}
      <motion.div
        className="absolute right-8 top-10 flex h-24 w-24 items-center justify-center text-center text-[12px] font-bold leading-tight text-[#6b4a12]"
        initial={{ scale: 1.6, opacity: 0, rotate: -40 }}
        animate={{ scale: 1, opacity: 1, rotate: 12, transition: { delay: 0.95, duration: 0.35, ease: EASE_OUT } }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 drop-shadow-md">
          <path d="M50 4 61 36 96 37 68 57 78 92 50 71 22 92 32 57 4 37 39 36Z" fill="#F2C94C" stroke="#D9A82E" strokeWidth="3" />
        </svg>
        <span className="relative mt-2 w-14">{t.sticker}</span>
      </motion.div>
    </motion.div>
  );
}

export default function EducationOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  return (
    <Overlay open={open} onClose={onClose}>
      <motion.div
        className="relative flex"
        initial={{ y: 70, opacity: 0, rotate: 2 }}
        animate={{ y: 0, opacity: 1, rotate: -1, transition: enter(0, 0.55) }}
        exit={{ y: 50, opacity: 0, transition: leave() }}
      >
        <div
          className="relative h-[min(78vh,560px)] w-[min(86vw,600px)] overflow-hidden rounded-r-lg rounded-l-sm bg-[#FBF8F1] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent 52px, #E7A3A0 52px, #E7A3A0 54px, transparent 54px), repeating-linear-gradient(transparent 0 ${LINE - 1}px, #C9D6E8 ${LINE - 1}px ${LINE}px)`,
          }}
        >
          {/* spiral holes */}
          <div className="absolute inset-y-4 left-3 flex flex-col justify-between">
            {Array.from({ length: 12 }, (_, k) => (
              <div key={k} className="h-3.5 w-3.5 rounded-full bg-[#2a241f] shadow-inner" />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <Page key={TABS[tab].id} t={TABS[tab]} />
          </AnimatePresence>
        </div>

        {/* index tabs */}
        <div className="-ml-1 mt-10 flex flex-col gap-2">
          {TABS.map((t, k) => (
            <motion.button
              key={t.id}
              onClick={() => setTab(k)}
              className="rounded-r-md px-3 py-3 text-sm font-semibold text-[#3b3129] shadow"
              style={{ background: t.color }}
              animate={{ x: tab === k ? 6 : 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {t.tab}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </Overlay>
  );
}
