"use client";

import { useState } from "react";
import { Github, Linkedin } from "lucide-react";
import AnimatedFolder from "./ui/3d-folder";
import CartoonButton from "./ui/cartoon-button";
import GradientButton from "./ui/gradient-button";

interface DockProps {
  onOpenProjects: () => void;
  onOpenAbout: () => void;
}

interface IconDockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  color: string;
}

export default function Dock({ onOpenProjects, onOpenAbout }: DockProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  // Icon-based items (GitHub, LinkedIn only)
  const iconItems: IconDockItem[] = [
    {
      id: "github",
      label: "GitHub",
      icon: <Github className="w-10 h-10" />,
      action: "https://github.com/archiips",
      color: "from-gray-700 to-gray-900",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: <Linkedin className="w-10 h-10" />,
      action: "https://www.linkedin.com/in/archit-jaiswal4/",
      color: "from-blue-500 to-blue-700",
    },
  ];

  const handleIconClick = (item: IconDockItem) => {
    setClickedItem(item.id);
    setTimeout(() => setClickedItem(null), 150);
    window.open(item.action, "_blank");
  };

  return (
    <div
      className="grid grid-cols-3 md:flex items-center gap-4 md:gap-6 px-4 py-4 md:px-8 md:py-6 rounded-3xl"
      style={{
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Icon Items: GitHub, LinkedIn */}
      {iconItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleIconClick(item)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className="flex flex-col items-center gap-2 group outline-none"
          style={{
            transform: `scale(${clickedItem === item.id ? 0.9 : hoveredItem === item.id ? 1.15 : 1})`,
            transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Icon Container */}
          <div
            className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}
            style={{
              boxShadow:
                hoveredItem === item.id
                  ? "0 12px 24px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            {item.icon}
          </div>

          {/* Label */}
          <span
            className="text-white text-sm font-medium"
            style={{
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
              opacity: hoveredItem === item.id ? 1 : 0.8,
            }}
          >
            {item.label}
          </span>
        </button>
      ))}

      {/* Resume: Gradient Button */}
      <GradientButton
        label="Resume"
        onClick={() => window.open("/Archit Jaiswal.pdf", "_blank")}
      />

      {/* Projects: 3D Animated Folder */}
      <AnimatedFolder onOpenProjects={onOpenProjects} />

      {/* About Me: Cartoon Button */}
      <CartoonButton
        label="About Me"
        color="bg-orange-400"
        hasHighlight={true}
        onClick={onOpenAbout}
      />
    </div>
  );
}
