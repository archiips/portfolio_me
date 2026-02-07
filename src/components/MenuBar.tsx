"use client";

import { useEffect, useState } from "react";
import { Apple, Wifi, Battery, Search } from "lucide-react";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className = "" }: MenuBarProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-12 md:h-7 flex items-center justify-between px-4 z-50 ${className}`}
      style={{
        background: "rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Left Side */}
      <div className="flex items-center gap-3 md:gap-5">
        <Apple className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-semibold">
          Archit&apos;s Portfolio
        </span>
        <div className="hidden md:flex items-center gap-4 text-white/80 text-sm">
          <span className="hover:text-white cursor-default">File</span>
          <span className="hover:text-white cursor-default">Edit</span>
          <span className="hover:text-white cursor-default">View</span>
          <span className="hover:text-white cursor-default">Go</span>
          <span className="hover:text-white cursor-default">Window</span>
          <span className="hover:text-white cursor-default">Help</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-3 text-white">
        <Battery className="w-5 h-5" />
        <Wifi className="w-4 h-4" />
        <Search className="w-4 h-4" />
        <span className="text-sm">
          {currentDate} {currentTime}
        </span>
      </div>
    </div>
  );
}
