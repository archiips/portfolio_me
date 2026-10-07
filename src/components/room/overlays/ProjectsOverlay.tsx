"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ExternalLink, Github, Undo2 } from "lucide-react";
import { projects, type Project } from "@/lib/projects";
import Overlay from "./Overlay";
import { EASE_OUT, enter, leave } from "./motion";

// Projects as records in a crate, a nod to the Talk To You vinyl on the wall.
// Flip through the sleeves, pull one out and the record slides out and spins
// next to its liner notes (description and a "tracklist" of the stack).

const ART: [string, string, string][] = [
  ["#E7B46A", "#B4572E", "#2C1D16"],
  ["#8FB8C9", "#3D5A80", "#F4E9D8"],
  ["#C7D59F", "#5C7A3A", "#20281A"],
  ["#E9A6A6", "#8C3B4A", "#FCEFE6"],
  ["#B9A7D9", "#4E3D7A", "#F3EEFA"],
  ["#F2D27A", "#2F6F6A", "#13201F"],
  ["#D9C2A7", "#6B4F3A", "#FFF6EA"],
  ["#9EC9B6", "#2E4F5C", "#EAF4EF"],
];

function shortTitle(t: string) {
  return t.replace(/ (System|Platform|Engine|Tool|Agent)$/, "");
}

// Generated cover art: a gradient, a sun/disc and a few stripes, varied per
// project so every sleeve in the crate is distinct.
function Sleeve({ p, i, big = false }: { p: Project; i: number; big?: boolean }) {
  const [a, b, ink] = ART[i % ART.length];
  const cx = 30 + ((i * 37) % 45);
  const cy = 26 + ((i * 23) % 35);
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[3px] shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
      style={{ background: `linear-gradient(${120 + i * 25}deg, ${a}, ${b})` }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: "46%",
          height: "46%",
          left: `${cx - 23}%`,
          top: `${cy - 23}%`,
          background: ink,
          opacity: 0.85,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-[22%] h-[18%]"
        style={{
          background: `repeating-linear-gradient(0deg, ${ink}55 0 3px, transparent 3px 9px)`,
        }}
      />
      <p
        className={`absolute left-[7%] top-[6%] uppercase tracking-[0.2em] ${big ? "text-[11px]" : "text-[8px]"}`}
        style={{ color: ink }}
      >
        archit jaiswal
      </p>
      {/* title on a paper sticker so it reads over any cover art */}
      <p
        className={`absolute left-[6%] top-[15%] rounded-sm bg-[#F7F1E4] px-1.5 py-0.5 font-semibold leading-tight text-[#2b211b] shadow-sm ${big ? "max-w-[88%] text-lg" : "max-w-[58%] text-[11px]"}`}
      >
        {shortTitle(p.title)}
      </p>
    </div>
  );
}

function Record({ i, title }: { i: number; title: string }) {
  const [a] = ART[i % ART.length];
  return (
    <motion.div
      className="relative h-full w-full rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
      style={{
        background:
          "radial-gradient(circle, #1a1a1a 0 18%, transparent 18%), repeating-radial-gradient(circle, #151515 0 2px, #222 2px 4px)",
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
    >
      <div
        className="absolute left-1/2 top-1/2 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-center text-[9px] leading-tight text-[#2b211b]"
        style={{ background: a }}
      >
        <span className="px-2">{shortTitle(title)}</span>
        <div className="absolute h-2 w-2 rounded-full bg-[#111]" />
      </div>
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_30deg,transparent_0_20%,rgba(255,255,255,0.08)_25%,transparent_30%_70%,rgba(255,255,255,0.06)_75%,transparent_80%)]" />
    </motion.div>
  );
}

function Crate({ onPick }: { onPick: (i: number) => void }) {
  return (
    <motion.div
      key="crate"
      className="relative mx-auto w-[min(94vw,900px)] pt-16"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0, transition: enter(0, 0.5) }}
      exit={{ opacity: 0, y: 20, transition: leave() }}
    >
      <p className="mb-3 text-center text-[#E9DFD0]/80 [font-family:var(--font-sniglet)]">
        my-projects · {projects.length} records, pick one out
      </p>
      <div className="relative h-[clamp(150px,22vw,230px)]">
        {/* the records, standing in the crate */}
        <div className="absolute inset-x-[2%] bottom-0 flex items-end justify-center">
          {projects.map((p, i) => (
            <motion.button
              key={p.id}
              layoutId={`sleeve-${p.id}`}
              onClick={() => onPick(i)}
              aria-label={`Open ${p.title}`}
              className="relative -mx-[clamp(14px,2.2vw,28px)] aspect-square w-[clamp(110px,17vw,190px)] shrink-0 outline-none"
              style={{ zIndex: i }}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 18, opacity: 1, rotate: (i - 3.5) * 1.2, transition: enter(0.12 + i * 0.045, 0.5) }}
              whileHover={{ y: -42, rotate: 0, transition: { duration: 0.25, ease: EASE_OUT } }}
            >
              <Sleeve p={p} i={i} />
            </motion.button>
          ))}
        </div>
        {/* front of the crate, in front of the bottom of the sleeves */}
        <div
          className="pointer-events-none absolute -inset-x-[3%] -bottom-6 z-20 h-[34%] rounded-md shadow-[0_-6px_20px_rgba(0,0,0,0.35)]"
          style={{
            background:
              "repeating-linear-gradient(0deg, #8a6446 0 22%, #6e4d34 22% 25%), linear-gradient(#8a6446, #6e4d34)",
          }}
        >
          <div className="absolute left-1/2 top-[28%] h-[30%] w-[22%] -translate-x-1/2 rounded-full bg-[#3a281c]/70" />
        </div>
      </div>
    </motion.div>
  );
}

function Detail({ i, onBack }: { i: number; onBack: () => void }) {
  const p = projects[i];
  return (
    <motion.div
      key="detail"
      className="mx-auto flex w-[min(94vw,980px)] flex-col items-center gap-8 md:flex-row md:items-start"
      exit={{ opacity: 0, transition: leave() }}
    >
      <div className="relative aspect-square w-[min(70vw,320px)] shrink-0">
        {/* the record slides out from behind the sleeve, then keeps spinning */}
        <motion.div
          className="absolute inset-[4%]"
          initial={{ x: 0 }}
          animate={{ x: "38%", transition: enter(0.35, 0.7) }}
        >
          <Record i={i} title={p.title} />
        </motion.div>
        <motion.div layoutId={`sleeve-${p.id}`} className="absolute inset-0 z-10" transition={{ duration: 0.5, ease: EASE_OUT }}>
          <Sleeve p={p} i={i} big />
        </motion.div>
      </div>

      {/* liner notes */}
      <motion.div
        className="max-w-lg rounded-md bg-[#F4ECDD] p-6 text-[#3b3129] shadow-xl md:ml-24"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0, transition: enter(0.3) }}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-[#8a7766]">side a · liner notes</p>
        <h3 className="mt-1 text-2xl font-bold">{p.title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[#4f443b]">{p.description}</p>
        <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[#8a7766]">tracklist</p>
        <ol className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[14px]">
          {p.technologies.map((t, k) => (
            <motion.li
              key={t}
              className="flex gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: enter(0.45 + k * 0.04, 0.4) }}
            >
              <span className="w-6 text-[#8a7766]">A{k + 1}</span>
              {t}
            </motion.li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          {p.githubUrl && (
            <a href={p.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-[#3b3129] px-4 py-2 text-sm text-[#F4ECDD] hover:bg-[#5a4a3d]">
              <Github className="h-4 w-4" /> Code
            </a>
          )}
          {p.liveUrl && (
            <a href={p.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-[#E7B46A] px-4 py-2 text-sm text-[#2b211b] hover:bg-[#FFDE85]">
              <ExternalLink className="h-4 w-4" /> Listen live
            </a>
          )}
          <button onClick={onBack} className="ml-auto flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#6b5b4d] hover:text-[#3b3129]">
            <Undo2 className="h-4 w-4" /> back in the crate
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProjectsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState<number | null>(null);
  const close = () => {
    onClose();
    setTimeout(() => setCurrent(null), 350);
  };

  return (
    <Overlay open={open} onClose={close}>
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {current === null ? (
            <Crate key="crate" onPick={setCurrent} />
          ) : (
            <Detail key="detail" i={current} onBack={() => setCurrent(null)} />
          )}
        </AnimatePresence>
      </LayoutGroup>
    </Overlay>
  );
}
