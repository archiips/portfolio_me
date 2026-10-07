"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { aboutMe } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";
import { EASE_OUT, enter, leave } from "./motion";

// Work experience as collectible player cards, a nod to the Messi poster and
// the LeBron figure in the room. The front has the role and two headline
// stats; click a card to flip it over for the full story.

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

function initials(company: string) {
  return company
    .split(/[ ,]+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

const N = aboutMe.experience.length;
const MID = (N - 1) / 2;

function Card({ i }: { i: number }) {
  const e = aboutMe.experience[i];
  const [flipped, setFlipped] = useState(false);
  const [hover, setHover] = useState(false);
  const company = e.company.split(",")[0];
  const stats = STATS[e.company] ?? [];
  const fan = (i - MID) * 5;

  return (
    <motion.div
      className="relative h-[clamp(290px,40vh,360px)] w-[clamp(190px,17vw,230px)] shrink-0 cursor-pointer"
      // the hovered or flipped card comes to the front of the fan
      style={{ perspective: 1000, zIndex: hover || flipped ? 20 : 10 - Math.round(Math.abs(i - MID) * 2) }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      initial={{ y: 120, opacity: 0, rotate: 0 }}
      animate={{ y: Math.abs(i - MID) * 12, opacity: 1, rotate: fan, transition: enter(0.08 + i * 0.07, 0.6) }}
      exit={{ y: 80, opacity: 0, transition: leave(i * 0.03) }}
      whileHover={{ y: -14, rotate: fan * 0.4, transition: { duration: 0.25, ease: EASE_OUT } }}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
      >
        {/* front */}
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
            {stats.map(([big, small]) => (
              <div key={small}>
                <p className="text-2xl font-black leading-none">{big}</p>
                <p className="text-[11px] leading-tight opacity-75">{small}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] opacity-60">tap to flip</p>
        </div>

        {/* back */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[18px] bg-[#2a241f] p-5 text-[#EDE4D6] shadow-[0_18px_40px_rgba(0,0,0,0.5)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9A24D]">{e.period}</p>
          <p className="mt-1 font-bold leading-tight">{e.title}</p>
          <p className="text-sm text-[#B9AE9F]">{company}</p>
          <p className="mt-3 overflow-y-auto text-[13px] leading-relaxed text-[#D9CFC1]">{e.description}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function WorkOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose} hint="tap a card to flip it · click outside to close">
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-wrap items-start justify-center gap-4 lg:flex-nowrap lg:gap-0 lg:-space-x-6">
          {aboutMe.experience.map((e, i) => (
            <Card key={e.company} i={i} />
          ))}
        </div>
        <motion.a
          href={assetPath("/Archit%20Jaiswal.pdf")}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full bg-[#F4ECDD] px-5 py-2.5 text-sm text-[#3b3129] shadow-lg hover:bg-[#FFDE85]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: enter(0.45) }}
          exit={{ opacity: 0, transition: leave() }}
        >
          <FileText className="h-4 w-4" /> full resume
        </motion.a>
      </div>
    </Overlay>
  );
}
