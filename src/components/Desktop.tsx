"use client";

import { useState } from "react";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import ProjectsPanel from "./ProjectsPanel";
import AboutPanel from "./AboutPanel";
import ProfileSection from "./ProfileSection";

export default function Desktop() {
  const [showProjects, setShowProjects] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div
      className="fixed inset-0 z-20"
      style={{
        backgroundImage: "url(/wallpaper.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Menu Bar */}
      <MenuBar />

      {/* Main Content Area - Profile and Dock */}
      <div className="fixed inset-0 flex flex-col items-center justify-start md:justify-center gap-4 md:gap-8 pt-16 md:pt-0 pb-4 overflow-y-auto md:overflow-hidden pointer-events-none z-30">
        {/* Profile Section */}
        <div className="pointer-events-auto">
          <ProfileSection />
        </div>

        {/* Dock */}
        <div className="pointer-events-auto">
          <Dock
            onOpenProjects={() => setShowProjects(true)}
            onOpenAbout={() => setShowAbout(true)}
          />
        </div>
      </div>

      {/* Projects Panel */}
      <ProjectsPanel
        isOpen={showProjects}
        onClose={() => setShowProjects(false)}
      />

      {/* About Panel */}
      <AboutPanel isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
