"use client";

import { motion } from "motion/react";
import { FileText, Github, Linkedin, Mail } from "lucide-react";
import { aboutMe } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";
import { EASE_OUT, enter, leave, jsAnimated } from "./motion";

// Contact as a letter: the envelope slides in, the flap opens and the letter
// rises out with the ways to reach Archit. The stamp is the room's panda.

const LINKS = [
  { label: "Email", value: aboutMe.email, href: `mailto:${aboutMe.email}`, Icon: Mail },
  { label: "LinkedIn", value: "archit-jaiswal4", href: aboutMe.linkedin, Icon: Linkedin },
  { label: "GitHub", value: "archiips", href: aboutMe.github, Icon: Github },
  { label: "Resume", value: "PDF", href: assetPath("/Archit%20Jaiswal.pdf"), Icon: FileText },
];

const W = "min(90vw,520px)";

function PandaStamp() {
  return (
    <div className="absolute bottom-5 right-6 z-30 flex h-16 w-14 items-center justify-center bg-[#F7F1E4] p-1 border-2 border-dashed border-[#C9B79C] shadow">
      <div className="relative flex h-full w-full items-center justify-center bg-[#A9C7B5]">
        <div className="relative h-7 w-8 rounded-full bg-white">
          <span className="absolute -left-0.5 -top-1 h-3 w-3 rounded-full bg-[#1b1b1f]" />
          <span className="absolute -right-0.5 -top-1 h-3 w-3 rounded-full bg-[#1b1b1f]" />
          <span className="absolute left-1.5 top-2.5 h-2 w-1.5 rotate-12 rounded-full bg-[#1b1b1f]" />
          <span className="absolute right-1.5 top-2.5 h-2 w-1.5 -rotate-12 rounded-full bg-[#1b1b1f]" />
          <span className="absolute bottom-1.5 left-1/2 h-1 w-1.5 -translate-x-1/2 rounded-full bg-[#1b1b1f]" />
        </div>
      </div>
    </div>
  );
}

export default function ContactOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose}>
      <motion.div
        {...jsAnimated}
        className="relative pt-[200px]"
        style={{ width: W }}
        initial={{ x: -80, y: 30, opacity: 0, rotate: -8 }}
        animate={{ x: 0, y: 0, opacity: 1, rotate: 0, transition: enter(0, 0.55) }}
        exit={{ y: 40, opacity: 0, transition: leave() }}
      >
        {/* back of the envelope */}
        <div className="relative h-[clamp(210px,30vw,280px)] rounded-md bg-[#C9A982] shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
          {/* the letter rises out once the flap is open */}
          <motion.div
            {...jsAnimated}
            className="absolute inset-x-[6%] bottom-4 z-10 rounded-sm bg-[#FBF7EE] p-6 text-[#3b3129] shadow-md"
            initial={{ y: 0 }}
            animate={{ y: "-62%", transition: { delay: 0.75, duration: 0.6, ease: EASE_OUT } }}
          >
            <p className="text-2xl [font-family:var(--font-sniglet)]">let&apos;s talk!</p>
            <p className="mt-1 text-sm text-[#6b5b4d]">
              {aboutMe.name} · {aboutMe.location}
            </p>
            <div className="mt-4 grid gap-2">
              {LINKS.map(({ label, value, href, Icon }, k) => (
                <motion.a
                  key={label}
                  {...jsAnimated}
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-[#F1E6D2]"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0, transition: enter(1.0 + k * 0.06, 0.35) }}
                >
                  <Icon className="h-5 w-5 text-[#8a6446] group-hover:text-[#5a4033]" />
                  <span className="w-20 text-sm text-[#8a7766]">{label}</span>
                  <span className="truncate text-[15px]">{value}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* front pocket of the envelope, over the bottom of the letter */}
          <div
            className="pointer-events-none absolute inset-0 z-20 rounded-md bg-[#D8BC96]"
            style={{ clipPath: "polygon(0 22%, 50% 62%, 100% 22%, 100% 100%, 0 100%)" }}
          />
          <p className="pointer-events-none absolute bottom-5 left-6 z-20 text-sm text-[#6e5238] [font-family:var(--font-sniglet)]">
            to: you · from: Archit
          </p>
          <PandaStamp />

          {/* the flap, hinged at the top edge, swings open */}
          <motion.div
            {...jsAnimated}
            className="absolute inset-x-0 top-0 z-30 h-[58%] origin-top bg-[#BF9C73]"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", transformPerspective: 900 }}
            initial={{ rotateX: 0 }}
            animate={{
              rotateX: 180,
              zIndex: 0, // once open, the letter rises in front of it
              transition: {
                rotateX: { delay: 0.4, duration: 0.5, ease: EASE_OUT },
                zIndex: { delay: 0.9, duration: 0 },
              },
            }}
          />
        </div>
      </motion.div>
    </Overlay>
  );
}
