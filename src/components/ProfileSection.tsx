"use client";

import { assetPath } from "@/lib/utils";

export default function ProfileSection() {
  return (
    <div
      className="flex flex-col items-center gap-4 p-6 rounded-2xl"
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Profile Photo */}
      <div
        className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/20"
        style={{
          boxShadow:
            "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(79, 70, 229, 0.2)",
        }}
      >
        <img
          src={assetPath("/profile.jpg")}
          alt="Archit Jaiswal"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name */}
      <h2
        className="text-xl md:text-2xl font-semibold text-white"
        style={{
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        Archit Jaiswal
      </h2>
    </div>
  );
}
