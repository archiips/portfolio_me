"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ExternalLink, Github } from "lucide-react";
import { projects, type Project } from "@/lib/projects";
import Overlay from "./Overlay";

// A colour per project for the card peeking out of its folder.
const PALETTE = ["#7FA7C9", "#C98F7F", "#8DB58A", "#C9B27F", "#A58FC9", "#7FC9BE", "#C97FA2", "#9AA0A8"];

function shortTitle(t: string) {
  return t.replace(/ (System|Platform|Engine|Tool|Agent)$/, "");
}

function Folder({ p, i, onOpen }: { p: Project; i: number; onOpen: () => void }) {
  return (
    <motion.button
      onClick={onOpen}
      className="group flex flex-col items-center gap-2 text-center outline-none"
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.55 + i * 0.05, type: "spring", stiffness: 260, damping: 20 } }}
      whileHover="hover"
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative h-24 w-32 sm:h-28 sm:w-36">
        {/* back of the folder and its tab */}
        <div className="absolute left-0 top-0 h-5 w-14 rounded-t-md bg-[#D2B871]" />
        <div className="absolute inset-x-0 bottom-0 top-3 rounded-md bg-[#D9BF78]" />
        {/* the project card, which slides up out of the folder on hover */}
        <motion.div
          className="absolute inset-x-4 top-4 h-16 rounded-sm p-1.5 text-left shadow"
          style={{ background: PALETTE[i % PALETTE.length] }}
          variants={{ hover: { y: -16, rotate: -3 } }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <div className="h-1.5 w-10 rounded-full bg-white/70" />
          <div className="mt-1 h-1 w-14 rounded-full bg-white/45" />
          <div className="mt-1 h-1 w-8 rounded-full bg-white/45" />
        </motion.div>
        {/* front flap tips open a little on hover */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[72%] origin-bottom rounded-md bg-[#F4D98F] shadow-[0_-2px_6px_rgba(0,0,0,0.12)]"
          variants={{ hover: { rotateX: 18 } }}
          style={{ transformPerspective: 400 }}
        />
      </div>
      <span className="max-w-36 text-[15px] leading-tight text-[#EDE6DA] group-hover:text-[#FFDE85]">
        {shortTitle(p.title)}
      </span>
    </motion.button>
  );
}

function Detail({ p, onBack }: { p: Project; onBack: () => void }) {
  return (
    <motion.div
      key={p.id}
      className="h-full overflow-y-auto p-6 text-[#E9E3D8] sm:p-8"
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-[#C9BFAF] hover:text-[#FFDE85]">
        <ChevronLeft className="h-4 w-4" /> back
      </button>
      <h3 className="text-2xl font-semibold">{p.title}</h3>
      <p className="mt-3 max-w-2xl leading-relaxed text-[#CFC7BA]">{p.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {p.technologies.map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.03 } }}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-[#E9E3D8]"
          >
            {t}
          </motion.span>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        {p.githubUrl && (
          <a href={p.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
            <Github className="h-4 w-4" /> Code
          </a>
        )}
        {p.liveUrl && (
          <a href={p.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-[#F4D98F] px-4 py-2 text-[#3b3129] hover:bg-[#FFDE85]">
            <ExternalLink className="h-4 w-4" /> Live
          </a>
        )}
      </div>
    </motion.div>
  );
}

// The room's monitor, blown up: it rises and powers on, then shows a file
// browser with a folder per project. Opening one shows it inside the window.
export default function ProjectsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState<Project | null>(null);
  const close = () => {
    onClose();
    setTimeout(() => setCurrent(null), 400);
  };

  return (
    <Overlay open={open} onClose={close}>
      <motion.div
        className="flex flex-col items-center"
        initial={{ y: 80, scale: 0.7, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 17 } }}
        exit={{ y: 60, scale: 0.8, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      >
        {/* bezel */}
        <div className="rounded-[22px] border border-[#E9C9A5]/60 bg-[#1b1916] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:p-5">
          {/* screen powers on: a brief bright flash that settles */}
          <motion.div
            className="relative flex h-[min(64vh,560px)] w-[min(90vw,920px)] flex-col overflow-hidden rounded-xl bg-[#2a2826]"
            initial={{ filter: "brightness(0)" }}
            animate={{ filter: ["brightness(0)", "brightness(1.6)", "brightness(1)"], transition: { duration: 0.7, delay: 0.25, times: [0, 0.4, 1] } }}
          >
            <div className="flex min-h-0 flex-1">
              {/* sidebar */}
              <div className="hidden w-48 shrink-0 flex-col gap-2 bg-[#3a3734] p-4 sm:flex">
                <p className="mb-1 text-xs uppercase tracking-wider text-[#9b9288]">Favourites</p>
                {["Desktop", "my-projects", "Downloads"].map((n) => (
                  <div key={n} className={`rounded-md px-3 py-1.5 text-sm ${n === "my-projects" ? "bg-white/10 text-[#EDE6DA]" : "text-[#B9B0A5]"}`}>
                    {n}
                  </div>
                ))}
                <p className="mb-1 mt-4 text-xs uppercase tracking-wider text-[#9b9288]">Links</p>
                <a href="https://github.com/archiips" target="_blank" rel="noreferrer" className="rounded-md px-3 py-1.5 text-sm text-[#B9B0A5] hover:bg-white/10">
                  GitHub
                </a>
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                {/* path bar */}
                <div className="m-3 rounded-md bg-[#3a3734] px-4 py-2 text-[15px] text-[#EDE6DA]">
                  <button onClick={() => setCurrent(null)} className="hover:text-[#FFDE85]">desktop &gt; my-projects</button>
                  {current && <span> &gt; {shortTitle(current.title)}</span>}
                </div>
                <div className="relative min-h-0 flex-1">
                  <AnimatePresence mode="wait">
                    {current ? (
                      <Detail key="detail" p={current} onBack={() => setCurrent(null)} />
                    ) : (
                      <motion.div
                        key="grid"
                        className="grid h-full grid-cols-2 content-start gap-x-6 gap-y-7 overflow-y-auto p-6 sm:grid-cols-3 lg:grid-cols-4"
                        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                      >
                        {projects.map((p, i) => (
                          <Folder key={p.id} p={p} i={i} onOpen={() => setCurrent(p)} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            {/* dock */}
            <div className="flex h-12 items-center gap-2 bg-[#BDB4A7] px-5">
              <div className="h-6 w-40 rounded-full bg-[#DCD5CB]" />
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className={`h-7 w-7 bg-[#DCD5CB] ${k % 2 ? "rounded-md" : "rounded-full"}`} />
              ))}
            </div>
          </motion.div>
        </div>
        {/* stand */}
        <div className="h-10 w-40 bg-gradient-to-b from-[#4e4b43] to-[#5f5c53]" style={{ clipPath: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)" }} />
        <div className="h-4 w-72 rounded-t-3xl bg-[#5f5c53]" />
      </motion.div>
    </Overlay>
  );
}
