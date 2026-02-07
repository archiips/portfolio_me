"use client";

import { useState, useEffect } from "react";
import BootSequence from "@/components/BootSequence";
import WelcomeScreen from "@/components/WelcomeScreen";
import Desktop from "@/components/Desktop";

type Screen = "boot" | "welcome" | "desktop";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("boot");
  const [transitioning, setTransitioning] = useState(false);

  const handleTransition = (nextScreen: Screen) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(nextScreen);
      setTransitioning(false);
    }, 500);
  };

  // Add Pacifico font for cursive "hello" text
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Pacifico&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <main className="min-h-screen w-screen overflow-y-auto md:h-screen md:overflow-hidden bg-black">
      {/* Fade overlay for transitions */}
      <div
        className="fixed inset-0 bg-black pointer-events-none z-[100]"
        style={{
          opacity: transitioning ? 1 : 0,
          transition: "opacity 500ms ease-in-out",
        }}
      />

      {/* Boot Sequence */}
      {currentScreen === "boot" && (
        <BootSequence onComplete={() => handleTransition("welcome")} />
      )}

      {/* Welcome Screen */}
      {currentScreen === "welcome" && (
        <WelcomeScreen onGetStarted={() => handleTransition("desktop")} />
      )}

      {/* Desktop */}
      {currentScreen === "desktop" && <Desktop />}
    </main>
  );
}
