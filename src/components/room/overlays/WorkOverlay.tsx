"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { aboutMe } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";
import { EASE_OUT, enter, leave, jsAnimated } from "./motion";

// Work experience as collectible player cards, a nod to the Messi poster and
// the LeBron figure in the room. Click a card: it lifts out of the fan to the
// middle, grows, and flips to the full story in readable type. Click again
// (or around it) to put it back. Under the fan, the resume peeks out of a
// manila folder.

const STATS: Record<string, [string, string][]> = {
  "Quadrant Technologies": [["7s", "answers (was 124s)"], ["−80%", "cloud cost"]],
  "DAIS Research Group, University of Washington": [["SER", "emotion from voice"], ["NSF", "backed research"]],
  Catalog: [["Live", "cat social app"], ["OAuth", "+ JWT secured"]],
  "Apexiel, Inc.": [["+40%", "faster stories"], ["−60%", "content complexity"]],
  "Genmark AI": [["+50%", "feature coverage"], ["−40%", "manual work"]],
};

const FOILS = [
  "linear-gradient(150deg,#F3DFA2 0%,#C9A24D 45%,#F5E3A8 60%,#B88A3A 100%)",
  "linear-gradient(150deg,#E9E4DA 0%,#AFA79B 45%,#F1ECE3 60%,#8F877C 100%)",
  "linear-gradient(150deg,#E8B98F 0%,#A96B3F 45%,#F0C9A3 60%,#8A5432 100%)",
  "linear-gradient(150deg,#BFD6C8 0%,#6F9483 45%,#D4E6DB 60%,#557565 100%)",
  "linear-gradient(150deg,#C9C3E6 0%,#7C72A8 45%,#DCD7F1 60%,#5E5590 100%)",
];

const N = aboutMe.experience.length;
const MID = (N - 1) / 2;
const RESUME_PDF = assetPath("/Archit%20Jaiswal.pdf");

function initials(company: string) {
  return company
    .split(/[ ,]+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function Front({ i }: { i: number }) {
  const e = aboutMe.experience[i];
  const company = e.company.split(",")[0];
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-[18px] p-5 text-[#2b2118] shadow-[0_18px_40px_rgba(0,0,0,0.5)] [backface-visibility:hidden]"
      style={{ background: FOILS[i % FOILS.length] }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-4xl font-black leading-none">{e.period.match(/\d{4}/)?.[0]}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest opacity-75">since</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#2b2118]/40 text-lg font-black">
          {initials(company)}
        </div>
      </div>
      <div className="mt-4 flex-1">
        <p className="text-xl font-extrabold leading-tight">{company}</p>
        <p className="mt-1 text-sm font-medium opacity-80">{e.title}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-[#2b2118]/25 pt-3">
        {(STATS[e.company] ?? []).map(([big, small]) => (
          <div key={small}>
            <p className="text-2xl font-black leading-none">{big}</p>
            <p className="text-[11px] leading-tight opacity-75">{small}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] opacity-60">tap to read</p>
    </div>
  );
}

// The back, shown only on the enlarged card, so it is laid out for reading.
function Back({ i }: { i: number }) {
  const e = aboutMe.experience[i];
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[22px] bg-[#2a241f] p-8 text-[#EDE4D6] shadow-[0_30px_70px_rgba(0,0,0,0.6)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div className="h-1.5 w-16 rounded-full" style={{ background: FOILS[i % FOILS.length] }} />
      <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#C9A24D]">{e.period}</p>
      <p className="mt-2 text-2xl font-bold leading-tight">{e.title}</p>
      <p className="text-base text-[#B9AE9F]">{e.company}</p>
      <p className="mt-5 overflow-y-auto text-[16px] leading-relaxed text-[#E2D9CC]">{e.description}</p>
      <p className="mt-auto pt-4 text-center text-[10px] uppercase tracking-[0.3em] text-[#8a7f72]">tap to put back</p>
    </div>
  );
}

const CARD_SIZE = "h-[clamp(290px,40vh,360px)] w-[clamp(190px,17vw,230px)]";

function FanCard({ i, onPick, returning }: { i: number; onPick: () => void; returning: boolean }) {
  const [hover, setHover] = useState(false);
  const fan = (i - MID) * 5;
  return (
    <motion.button
      {...jsAnimated}
      layoutId={`card-${i}`}
      onClick={onPick}
      className={`relative ${CARD_SIZE} shrink-0 cursor-pointer text-left outline-none`}
      style={{ zIndex: hover ? 20 : 10 - Math.round(Math.abs(i - MID) * 2) }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      // a card coming back from the middle glides home (layoutId) instead of
      // replaying the deal-in from below
      initial={returning ? false : { y: 120, opacity: 0, rotate: 0 }}
      animate={{ y: Math.abs(i - MID) * 12, opacity: 1, rotate: fan }}
      exit={{ y: 80, opacity: 0, transition: leave(i * 0.03) }}
      transition={{ ...enter(0.08 + i * 0.07, 0.6), layout: { duration: 0.45, ease: EASE_OUT } }}
      whileHover={{ y: -14, rotate: fan * 0.4, transition: { duration: 0.25, ease: EASE_OUT } }}
    >
      <Front i={i} />
    </motion.button>
  );
}

// The picked card, enlarged in the middle. It travels from its place in the
// fan (shared layoutId), then flips to the back.
function FocusCard({ i, onClose }: { i: number; onClose: () => void }) {
  return (
    <motion.div
      {...jsAnimated}
      className="fixed inset-0 z-40 flex items-center justify-center"
      initial={{ backgroundColor: "rgba(20,17,14,0)" }}
      animate={{ backgroundColor: "rgba(20,17,14,0.55)" }}
      exit={{ backgroundColor: "rgba(20,17,14,0)" }}
      onClick={onClose}
    >
      <motion.div
        {...jsAnimated}
        layoutId={`card-${i}`}
        className="relative h-[min(72vh,540px)] w-[min(86vw,400px)] cursor-pointer"
        style={{ perspective: 1400 }}
        transition={{ layout: { duration: 0.45, ease: EASE_OUT } }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          {...jsAnimated}
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 180, transition: { delay: 0.3, duration: 0.55, ease: EASE_OUT } }}
          exit={{ rotateY: 0, transition: { duration: 0.25 } }}
        >
          <Front i={i} />
          <Back i={i} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// A manila folder with the resume sticking out of it, big enough to read the
// heading. Hover pulls the page up; click opens the PDF.
function ResumeFolder() {
  return (
    <motion.a
      {...jsAnimated}
      href={RESUME_PDF}
      target="_blank"
      rel="noreferrer"
      aria-label="Open resume PDF"
      className="group relative block h-[230px] w-[min(86vw,360px)]"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0, transition: enter(0.5, 0.6) }}
      exit={{ opacity: 0, y: 20, transition: leave() }}
      whileHover="pull"
    >
      {/* back of the folder and its tab */}
      <div className="absolute left-0 top-6 h-8 w-28 rounded-t-lg bg-[#C9A56A]" />
      <div className="absolute inset-x-0 bottom-0 top-12 rounded-lg rounded-tl-none bg-[#C9A56A] shadow-[0_18px_40px_rgba(0,0,0,0.45)]" />

      {/* the resume, peeking out */}
      <motion.div
        {...jsAnimated}
        className="absolute inset-x-6 top-0 h-[190px] rounded-sm bg-[#FBF8F1] px-5 pt-4 shadow-md"
        variants={{ pull: { y: -34, rotate: -1.5 } }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
      >
        <p className="text-center text-lg font-bold tracking-wide text-[#2c2620]">ARCHIT JAISWAL</p>
        <p className="text-center text-[10px] text-[#6b5f55]">Seattle, WA · {aboutMe.email}</p>
        <div className="mt-2 border-b border-[#6f9aa6] pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#3f7482]">
          Experience
        </div>
        <div className="mt-1.5 space-y-1">
          {[90, 75, 84, 62, 80, 70].map((w, k) => (
            <div key={k} className="h-1.5 rounded-full bg-[#2c2620]/15" style={{ width: `${w}%` }} />
          ))}
        </div>
      </motion.div>

      {/* front of the folder */}
      <div className="absolute inset-x-0 bottom-0 h-[118px] rounded-lg bg-gradient-to-b from-[#E2C389] to-[#D2B072] shadow-[0_-4px_14px_rgba(0,0,0,0.18)]">
        <div className="absolute left-5 top-4 rounded-sm bg-[#FBF8F1]/90 px-3 py-1 text-sm text-[#5a4033] [font-family:var(--font-sniglet)]">
          resume.pdf
        </div>
        <p className="absolute bottom-4 right-5 text-sm text-[#5a4033]/80 group-hover:text-[#3b2a14] [font-family:var(--font-sniglet)]">
          click to open →
        </p>
      </div>
    </motion.a>
  );
}

export default function WorkOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [focused, setFocused] = useState<number | null>(null);
  const [returning, setReturning] = useState<number | null>(null);
  const putBack = () => {
    setReturning(focused);
    setFocused(null);
  };
  const close = () => {
    onClose();
    setTimeout(() => {
      setFocused(null);
      setReturning(null);
    }, 350);
  };

  return (
    <Overlay
      open={open}
      onClose={close}
      hint={focused === null ? "tap a card to read it · click outside to close" : "tap the card to put it back"}
    >
      <LayoutGroup>
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-wrap items-start justify-center gap-4 lg:flex-nowrap lg:gap-0 lg:-space-x-6">
            {aboutMe.experience.map((e, i) =>
              focused === i ? (
                // keep the gap in the fan while the card is out
                <div key={e.company} className={`${CARD_SIZE} shrink-0`} />
              ) : (
                <FanCard key={e.company} i={i} returning={returning === i} onPick={() => setFocused(i)} />
              )
            )}
          </div>
          <ResumeFolder />
        </div>
        <AnimatePresence>
          {focused !== null && <FocusCard key="focus" i={focused} onClose={putBack} />}
        </AnimatePresence>
      </LayoutGroup>
    </Overlay>
  );
}
