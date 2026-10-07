"use client";

import { motion } from "motion/react";
import { aboutMe } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";

// Plain initials in the school colours rather than the official crests.
const CARDS = [
  {
    school: "University of Washington Bothell",
    lines: [
      "BS, Computer Science & Software Engineering",
      `GPA ${aboutMe.gpa}/4.0 · Dean's List`,
      "DSA (C++), Databases, Agile SE",
    ],
    footer: "Class of 2028",
    emblem: { text: "UW", bg: "#4B2E83", fg: "#E8D9A8" },
  },
  {
    school: "Udacity × AWS",
    lines: ["AWS AI Engineer Nanodegree", "Bedrock, SageMaker, RAG, Lambda", "Sept – Nov 2025"],
    footer: "Certificate",
    emblem: { text: "AI", bg: "#232F3E", fg: "#FF9900" },
  },
];

function Barcode() {
  return (
    <span className="flex h-5 items-stretch gap-[2px]" aria-hidden>
      {[2, 1, 3, 1, 2, 1, 1, 3, 1, 2].map((w, i) => (
        <span key={i} className="bg-[#3b3129]" style={{ width: w }} />
      ))}
    </span>
  );
}

export default function EducationOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="flex w-[min(92vw,600px)] flex-col gap-5">
        {CARDS.map((c, i) => (
          // Dealt in from the left one after another, overshooting a little.
          <motion.div
            key={c.school}
            initial={{ x: "-110vw", rotate: -14 }}
            animate={{
              x: 0,
              rotate: i % 2 ? 0.8 : -0.8,
              transition: { type: "spring", stiffness: 110, damping: 15, delay: 0.1 + i * 0.16 },
            }}
            exit={{ x: "110vw", rotate: 10, transition: { duration: 0.35, delay: i * 0.05, ease: "easeIn" } }}
            whileHover={{ rotate: 0, scale: 1.02 }}
            className="relative flex gap-6 overflow-hidden rounded-2xl p-7 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#EFE8D4] via-[#DDD5C3] to-[#C7BFB0]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath("/about/me.jpg")}
              alt=""
              className="relative h-32 w-28 shrink-0 rounded-lg object-cover shadow-md"
            />
            <div className="relative min-w-0 flex-1">
              <h3 className="text-2xl font-bold text-[#3b3129]">{aboutMe.name}</h3>
              <p className="text-[15px] text-[#4f443b]">{c.school}</p>
              <div className="mt-2 space-y-0.5 text-[15px] text-[#5a4e43]">
                {c.lines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-3 font-mono text-[15px] text-[#3b3129]">
                <Barcode />
                {c.footer}
              </p>
            </div>
            <div
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white/80 text-lg font-bold shadow"
              style={{ background: c.emblem.bg, color: c.emblem.fg }}
            >
              {c.emblem.text}
            </div>
          </motion.div>
        ))}
      </div>
    </Overlay>
  );
}
