"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import BootSequence from "@/components/BootSequence";
import WelcomeScreen from "@/components/WelcomeScreen";
import { SECTIONS, type Section } from "@/components/room/roomNav";
import PhotoStack from "@/components/room/PhotoStack";
import AboutOverlay from "@/components/room/overlays/AboutOverlay";
import ContactOverlay from "@/components/room/overlays/ContactOverlay";
import EducationOverlay from "@/components/room/overlays/EducationOverlay";
import ProjectsOverlay from "@/components/room/overlays/ProjectsOverlay";
import WorkOverlay from "@/components/room/overlays/WorkOverlay";

// WebGL cannot render on the server, so the whole scene is client-only.
const RoomScene = dynamic(() => import("@/components/room/RoomScene"), { ssr: false });

type Phase = "boot" | "welcome" | "room";

export default function RoomPage() {
  // Boot screen -> "hello" -> room. The room mounts straight away underneath,
  // so the model downloads during the boot and the bar tracks that download.
  const [phase, setPhase] = useState<Phase>("boot");
  const [fading, setFading] = useState(false);
  const { progress, active } = useProgress();

  // Every section, from the 3D objects or the menu text, opens its own overlay.
  const [open, setOpen] = useState<Section | null>(null);
  const close = () => setOpen(null);

  const go = useCallback((next: Phase) => {
    setFading(true);
    setTimeout(() => {
      setPhase(next);
      setFading(false);
    }, 500);
  }, []);

  // Deep links (/room?open=projects) skip the intro and open the section.
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("open");
    const hit = SECTIONS.find((s) => s === want);
    if (hit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL once on mount
      setPhase("room");
      setOpen(hit);
    }
  }, []);

  // The bar follows the model download while one is running. Nothing running
  // means done (or cached); the boot's minimum time covers the moment before
  // the download starts.
  const loaded = active ? progress : 100;
  const toWelcome = useCallback(() => go("welcome"), [go]);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#1f1b16]">
      <RoomScene onSelect={setOpen} paused={open !== null} started={phase === "room"} />

      {phase === "boot" && <BootSequence loaded={loaded} onComplete={toWelcome} />}
      {phase === "welcome" && <WelcomeScreen onGetStarted={() => go("room")} />}

      {/* fade through black between the intro screens and the room */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] bg-black"
        style={{ opacity: fading ? 1 : 0, transition: "opacity 500ms ease-in-out" }}
      />

      <AboutOverlay open={open === "aboutme"} onClose={close} />
      <ProjectsOverlay open={open === "projects"} onClose={close} />
      <WorkOverlay open={open === "work"} onClose={close} />
      <EducationOverlay open={open === "education"} onClose={close} />
      <ContactOverlay open={open === "contact"} onClose={close} />
      <PhotoStack isOpen={open === "photos"} onClose={close} />
    </main>
  );
}
