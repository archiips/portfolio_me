"use client";

import { motion, type Variants } from "motion/react";
import { Star } from "lucide-react";
import { aboutMe } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";

const board: Variants = {
  hidden: { y: 60, opacity: 0, rotate: -2 },
  shown: {
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 160, damping: 20, staggerChildren: 0.09, delayChildren: 0.25 },
  },
  gone: { y: 40, opacity: 0, transition: { duration: 0.25 } },
};

// Each item is "pinned" onto the board: it drops in slightly too big and
// twisted, then settles at its own small tilt.
const pin = (tilt: number): Variants => ({
  hidden: { scale: 1.25, opacity: 0, rotate: tilt * 4, y: -12 },
  shown: { scale: 1, opacity: 1, rotate: tilt, y: 0, transition: { type: "spring", stiffness: 260, damping: 17 } },
});

function Photo({ src, alt, tilt, className = "" }: { src: string; alt: string; tilt: number; className?: string }) {
  return (
    <motion.div
      variants={pin(tilt)}
      whileHover={{ scale: 1.04, rotate: 0 }}
      className={`rounded-[4px] bg-[#5c4a3d] p-3 shadow-[0_8px_18px_rgba(60,40,25,0.35)] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full rounded-[2px] object-cover" />
    </motion.div>
  );
}

function Note({ children, tilt, star }: { children: React.ReactNode; tilt: number; star?: "left" | "right" }) {
  return (
    <motion.div
      variants={pin(tilt)}
      className="relative bg-[#F6E9D7] px-4 py-3 text-[15px] leading-relaxed text-[#5a4636] shadow-[0_6px_14px_rgba(60,40,25,0.18)]"
    >
      {children}
      {star && (
        <Star
          className={`absolute -bottom-3 h-8 w-8 fill-[#F4CF7C] text-[#E8B95A] ${star === "right" ? "-right-3 rotate-12" : "-left-4 -rotate-12"}`}
        />
      )}
    </motion.div>
  );
}

export default function AboutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose}>
      <motion.div
        variants={board}
        initial="hidden"
        animate="shown"
        exit="gone"
        className="w-[min(92vw,520px)] rounded-md p-7 shadow-2xl sm:p-9"
        style={{
          backgroundColor: "#E6D3B4",
          backgroundImage:
            "linear-gradient(rgba(140,110,80,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(140,110,80,0.13) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <motion.h2
          variants={pin(-2)}
          className="mb-5 text-center text-3xl text-[#5a4033] [font-family:var(--font-sniglet)]"
        >
          about me !!
        </motion.h2>

        <div className="grid grid-cols-2 items-center gap-5">
          <Photo src={assetPath("/about/profile.jpg")} alt="Archit" tilt={-2} className="aspect-square" />
          <Note tilt={1.5} star="right">
            Hi! I&apos;m Archit, a CS &amp; Software Engineering student at UW Bothell.
          </Note>

          <Note tilt={-1.5}>
            I build ML systems and full-stack apps, and I love turning ideas into things people can
            click on.
          </Note>
          <Photo src={assetPath("/about/me.jpg")} alt="Archit" tilt={2.5} className="aspect-[4/5]" />

          <Note tilt={1}>
            Right now: {aboutMe.experience[0].title} at {aboutMe.experience[0].company.split(",")[0]}.
          </Note>
          <Note tilt={-2} star="left">
            Thanks for checking out my room! Click around, everything glowing does something.
          </Note>
        </div>
      </motion.div>
    </Overlay>
  );
}
