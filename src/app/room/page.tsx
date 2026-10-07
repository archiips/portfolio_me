"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import ProjectsPanel from "@/components/ProjectsPanel";
import AboutPanel from "@/components/AboutPanel";
import type { Section } from "@/components/room/roomNav";

// WebGL cannot render on the server, so the whole scene is client-only.
const RoomScene = dynamic(() => import("@/components/room/RoomScene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#201910]">
      <p className="animate-pulse text-sm tracking-[0.3em] text-[#FFDE85]">
        LOADING ROOM
      </p>
    </div>
  ),
});

export default function RoomPage() {
  const [openPanel, setOpenPanel] = useState<"projects" | "about" | null>(null);

  // The room has five pickable objects; the site currently has two panels, and
  // AboutPanel already covers education, experience and contact.
  const handleSelect = (s: Section) =>
    setOpenPanel(s === "projects" ? "projects" : "about");

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#201910]">
      <RoomScene onSelect={handleSelect} />
      <ProjectsPanel
        isOpen={openPanel === "projects"}
        onClose={() => setOpenPanel(null)}
      />
      <AboutPanel isOpen={openPanel === "about"} onClose={() => setOpenPanel(null)} />
    </main>
  );
}
