"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SECTIONS, type Section } from "@/components/room/roomNav";
import PhotoStack from "@/components/room/PhotoStack";
import AboutOverlay from "@/components/room/overlays/AboutOverlay";
import ContactOverlay from "@/components/room/overlays/ContactOverlay";
import EducationOverlay from "@/components/room/overlays/EducationOverlay";
import ProjectsOverlay from "@/components/room/overlays/ProjectsOverlay";
import WorkOverlay from "@/components/room/overlays/WorkOverlay";

// WebGL cannot render on the server, so the whole scene is client-only.
const RoomScene = dynamic(() => import("@/components/room/RoomScene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1f1b16]">
      <p className="animate-pulse text-sm tracking-[0.3em] text-[#FFDE85]">LOADING ROOM</p>
    </div>
  ),
});

export default function RoomPage() {
  // Every section, from the 3D objects or the menu text, opens its own overlay.
  const [open, setOpen] = useState<Section | null>(null);
  const close = () => setOpen(null);

  // Deep links: /room?open=projects opens straight onto a section.
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("open");
    const hit = SECTIONS.find((s) => s === want);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL once on mount
    if (hit) setOpen(hit);
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#1f1b16]">
      <RoomScene onSelect={setOpen} />
      <AboutOverlay open={open === "aboutme"} onClose={close} />
      <ProjectsOverlay open={open === "projects"} onClose={close} />
      <WorkOverlay open={open === "work"} onClose={close} />
      <EducationOverlay open={open === "education"} onClose={close} />
      <ContactOverlay open={open === "contact"} onClose={close} />
      <PhotoStack isOpen={open === "photos"} onClose={close} />
    </main>
  );
}
