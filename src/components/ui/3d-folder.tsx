"use client";

import { useState, useRef } from "react";
import { Folder } from "lucide-react";
import { projects as libProjects } from "@/lib/projects";

interface AnimatedFolderProps {
  onOpenProjects: () => void;
}

const CARD_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

// Show max 4 projects on hover
const hoverProjects = libProjects.slice(0, 4).map((p, i) => ({
  id: p.id,
  color: CARD_COLORS[i],
  title: p.title,
}));

export default function AnimatedFolder({ onOpenProjects }: AnimatedFolderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setIsClicked(false);
    onOpenProjects();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsClicked(false);
  };

  const totalCards = hoverProjects.length;
  const middleIndex = (totalCards - 1) / 2;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center gap-2 cursor-pointer outline-none"
      onClick={() => setIsClicked(!isClicked)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered || isClicked ? "scale(1.15)" : "scale(1)",
        transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        {/* Fanned project cards */}
        {hoverProjects.map((project, index) => {
          const offsetFromMiddle = index - middleIndex;
          const active = isHovered || isClicked;

          return (
            <div
              key={project.id}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="absolute inset-0 rounded-xl overflow-hidden cursor-pointer"
              style={{
                background: project.color,
                transform: active
                  ? `translateY(${-80 - index * 15}px) translateX(${offsetFromMiddle * 60}px) rotate(${offsetFromMiddle * 8}deg) scale(0.9)`
                  : `translateY(${-index * 2}px) scale(${1 - index * 0.02})`,
                opacity: active ? 1 : 0,
                transition: `all 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 50}ms`,
                zIndex: totalCards - index,
                boxShadow: active
                  ? "0 8px 25px rgba(0, 0, 0, 0.35)"
                  : "0 2px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-1 left-1 right-1 text-white text-[10px] font-semibold truncate px-1">
                {project.title.split(" ").slice(0, 3).join(" ")}
              </span>
            </div>
          );
        })}

        {/* Folder icon base */}
        <div
          onClick={handleClick}
          className="absolute inset-0 rounded-2xl flex items-center justify-center text-white"
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)",
            boxShadow:
              isHovered || isClicked
                ? "0 12px 24px rgba(249, 115, 22, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)"
                : "0 4px 12px rgba(0, 0, 0, 0.3)",
            transform: isHovered || isClicked ? "rotateX(-15deg)" : "rotateX(0)",
            transformOrigin: "bottom center",
            transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <Folder
            className="w-8 h-8 md:w-10 md:h-10"
            style={{
              transform: isHovered || isClicked ? "scale(0.9)" : "scale(1)",
              transition: "transform 300ms ease",
            }}
          />
        </div>
      </div>

      <span
        className="text-white text-sm font-medium"
        style={{
          textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
          opacity: isHovered || isClicked ? 1 : 0.8,
        }}
      >
        Projects
      </span>
    </div>
  );
}
