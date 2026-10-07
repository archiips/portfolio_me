"use client";

import { motion } from "motion/react";
import { aboutMe, projects } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";

const RESUME_PDF = assetPath("/Archit%20Jaiswal.pdf");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="border-b border-[#6f9aa6] pb-0.5 text-[13px] font-semibold uppercase tracking-wide text-[#3f7482]">
        {title}
      </h3>
      <div className="mt-1.5 space-y-2">{children}</div>
    </section>
  );
}

// The paper itself: the resume rendered from the site's data, so it stays in
// sync and stays crisp at any size.
function ResumePaper() {
  return (
    <div className="bg-[#F7F3EA] px-8 pb-24 pt-7 text-[11.5px] leading-snug text-[#2c2620]">
      <h2 className="text-center text-2xl font-bold tracking-wide">{aboutMe.name.toUpperCase()}</h2>
      <p className="mt-0.5 text-center text-[12px] text-[#5b5047]">
        {aboutMe.location} · {aboutMe.email} · linkedin.com/in/archit-jaiswal4
      </p>

      <Section title="Experience">
        {aboutMe.experience.map((e) => (
          <div key={e.company}>
            <div className="flex justify-between gap-4">
              <p>
                <span className="font-semibold">{e.company}</span> | <em>{e.title}</em>
              </p>
              <p className="shrink-0 font-semibold">{e.period}</p>
            </div>
            <p className="mt-0.5 pl-3 text-[#3e362f]">• {e.description}</p>
          </div>
        ))}
      </Section>

      <Section title="Education">
        {aboutMe.education.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Section>

      <Section title="Technical skills">
        <p>
          <span className="font-semibold">Languages:</span> {aboutMe.skills.languages.join(", ")}
        </p>
        <p>
          <span className="font-semibold">Frameworks:</span> {aboutMe.skills.frontendBackend.join(", ")}
        </p>
        <p>
          <span className="font-semibold">AI / Data:</span> {aboutMe.skills.aiData.join(", ")}
        </p>
      </Section>

      <Section title="Projects">
        {projects.slice(0, 3).map((p) => (
          <p key={p.id}>
            <span className="font-semibold">{p.title}</span> | <em>{p.technologies.slice(0, 4).join(", ")}</em>
          </p>
        ))}
      </Section>
    </div>
  );
}

export default function WorkOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose}>
      <motion.div
        className="relative h-[min(82vh,760px)] w-[min(92vw,640px)]"
        initial={{ y: "70vh", rotate: -3 }}
        animate={{ y: 0, rotate: 0, transition: { type: "spring", stiffness: 140, damping: 18 } }}
        exit={{ y: "80vh", rotate: 4, transition: { duration: 0.35, ease: "easeIn" } }}
      >
        {/* back wall of the box */}
        <div
          className="absolute inset-x-[4%] bottom-0 h-[52%] rounded-t-md bg-[#5a3f2d]"
          style={{ clipPath: "polygon(3% 0, 97% 0, 100% 100%, 0 100%)" }}
        />

        {/* a second sheet behind, slightly askew */}
        <motion.div
          className="absolute left-[16%] right-[10%] top-[10%] h-[60%] rounded-sm bg-[#e9e4d8] shadow-lg"
          initial={{ y: "45%", rotate: 0 }}
          animate={{ y: 0, rotate: 3, transition: { delay: 0.45, type: "spring", stiffness: 120, damping: 16 } }}
        />

        {/* the resume rises out of the box; hover lifts it, click opens the PDF */}
        <motion.a
          href={RESUME_PDF}
          target="_blank"
          rel="noreferrer"
          aria-label="Open resume PDF"
          className="absolute left-[11%] right-[13%] top-0 block h-[78%] cursor-pointer overflow-hidden rounded-sm shadow-[0_0_40px_rgba(255,236,190,0.35)]"
          initial={{ y: "55%" }}
          animate={{ y: 0, transition: { delay: 0.3, type: "spring", stiffness: 110, damping: 15 } }}
          whileHover={{ y: -18 }}
        >
          <ResumePaper />
        </motion.a>

        {/* front of the box, stitched leather */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] rounded-md bg-gradient-to-b from-[#7a5843] to-[#664834] shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-3 rounded border-2 border-dashed border-[#9c7a62]/70" />
          <p className="absolute inset-x-0 top-[22%] text-center text-3xl text-[#4a3324]/80 [font-family:var(--font-sniglet)] sm:text-4xl">
            click to view!
          </p>
          <div className="absolute left-1/2 top-[56%] h-9 w-16 -translate-x-1/2 rounded-sm bg-gradient-to-b from-[#e3c98d] to-[#b99a5c] shadow-md" />
        </div>
      </motion.div>
    </Overlay>
  );
}
