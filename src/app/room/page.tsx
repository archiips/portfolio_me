"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import RoomLoader from "@/components/room/RoomLoader";
import { SECTIONS, type Section } from "@/components/room/roomNav";
import PhotoStack from "@/components/room/PhotoStack";
import AboutOverlay from "@/components/room/overlays/AboutOverlay";
import ContactOverlay from "@/components/room/overlays/ContactOverlay";
import EducationOverlay from "@/components/room/overlays/EducationOverlay";
import ProjectsOverlay from "@/components/room/overlays/ProjectsOverlay";
import WorkOverlay from "@/components/room/overlays/WorkOverlay";

// WebGL cannot render on the server, so the whole scene is client-only.
const RoomScene = dynamic(() => import("@/components/room/RoomScene"), { ssr: false });

type Phase = "loading" | "room";

export default function RoomPage() {
  // Landing loader -> room. The room mounts straight away underneath, so the
  // model downloads while the loader shows, and its progress line tracks that.
  const [phase, setPhase] = useState<Phase>("loading");
  const [loaderGone, setLoaderGone] = useState(false);
  const { progress, active } = useProgress();

  // Every section, from the 3D objects or the menu text, opens its own overlay.
  const [open, setOpen] = useState<Section | null>(null);
  const close = () => setOpen(null);

  // "come on in": the camera zoom starts at once while the loader's light
  // opens up, and the loader unmounts when it has fully revealed the room.
  const enterRoom = useCallback(() => {
    setPhase("room");
    setTimeout(() => setLoaderGone(true), 1200);
  }, []);

  // Deep links (/room?open=projects) skip the intro and open the section.
  // /room?skipintro (local dev only) goes straight to the room for testing.
  /* eslint-disable react-hooks/set-state-in-effect -- reads the URL once on mount */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const hit = SECTIONS.find((s) => s === q.get("open"));
    const devSkip = process.env.NODE_ENV !== "production" && q.has("skipintro");
    if (hit || devSkip) {
      setPhase("room");
      setLoaderGone(true);
    }
    if (hit) setOpen(hit);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // The line follows the model download while one is running. Nothing running
  // means done (or cached); the loader's minimum time covers the moment
  // before the download starts.
  const loaded = active ? progress : 100;

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#1f1b16]">
      <RoomScene onSelect={setOpen} paused={open !== null} started={phase === "room"} />

      {!loaderGone && <RoomLoader loaded={loaded} onEnter={enterRoom} />}

      <AboutOverlay open={open === "aboutme"} onClose={close} />
      <ProjectsOverlay open={open === "projects"} onClose={close} />
      <WorkOverlay open={open === "work"} onClose={close} />
      <EducationOverlay open={open === "education"} onClose={close} />
      <ContactOverlay open={open === "contact"} onClose={close} />
      <PhotoStack isOpen={open === "photos"} onClose={close} />
    </main>
  );
}
