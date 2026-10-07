"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { FileText, Github, Linkedin, Mail } from "lucide-react";
import { aboutMe } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";

const LINKS = [
  { label: "LinkedIn", href: aboutMe.linkedin, Icon: Linkedin },
  { label: "Email", href: `mailto:${aboutMe.email}`, Icon: Mail },
  { label: "GitHub", href: aboutMe.github, Icon: Github },
  { label: "Resume", href: assetPath("/Archit%20Jaiswal.pdf"), Icon: FileText },
];

// A paper business card. It flips in, then tilts toward the pointer with a
// soft sheen sliding across it.
export default function ContactOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-10, 10]), { stiffness: 200, damping: 18 });
  const sheen = useTransform(mx, [0, 1], ["0%", "100%"]);

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ perspective: 1100 }}>
        <motion.div
          initial={{ rotateY: -95, rotateZ: -6, y: 40, opacity: 0 }}
          animate={{ rotateY: 0, rotateZ: 0, y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 15 } }}
          exit={{ rotateY: 90, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
        >
          <motion.div
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              mx.set((e.clientX - r.left) / r.width);
              my.set((e.clientY - r.top) / r.height);
            }}
            onPointerLeave={() => {
              mx.set(0.5);
              my.set(0.5);
            }}
            style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
            className="relative flex w-[min(90vw,580px)] items-stretch justify-between overflow-hidden rounded-2xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)] sm:p-11"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#F1EAD6] via-[#DCD4C3] to-[#C5BCAE]" />
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              style={{ left: sheen, translateX: "-50%" }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold text-[#3b3129] sm:text-4xl">{aboutMe.name}</h2>
              <p className="mt-1 text-lg text-[#5a4e43]">CS &amp; Software Engineering @ UW Bothell</p>
              <p className="mt-7 text-lg text-[#4a4038]">{aboutMe.email}</p>
              <p className="text-lg text-[#4a4038]">{aboutMe.location}</p>
            </div>
            <div className="relative flex flex-col justify-between gap-3">
              {LINKS.map(({ label, href, Icon }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  aria-label={label}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.35 + i * 0.07 } }}
                  whileHover={{ scale: 1.15 }}
                  className="rounded-md bg-[#5c514a] p-1.5 text-[#EDE6DA] hover:bg-[#3b3129]"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Overlay>
  );
}
