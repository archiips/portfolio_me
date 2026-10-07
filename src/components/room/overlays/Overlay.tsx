"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { sniglet } from "../fonts";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  hint?: string;
}

// Shared shell: blurred room behind, "click anywhere to close!" on top, Esc
// closes too. Clicks inside the content don't bubble out.
export default function Overlay({
  open,
  onClose,
  children,
  hint = "click anywhere to close!",
}: OverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`room-ui fixed inset-0 z-40 flex items-center justify-center overflow-y-auto px-4 py-16 ${sniglet.variable}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.1 } }}
          onClick={onClose}
        >
          <motion.div
            className="fixed inset-0 bg-black/45"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(10px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
          />
          <motion.p
            className="pointer-events-none fixed left-1/2 top-6 z-10 -translate-x-1/2 whitespace-nowrap text-lg text-[#ECE3D3] [font-family:var(--font-sniglet)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 0.9, y: 0, transition: { delay: 0.5 } }}
            exit={{ opacity: 0 }}
          >
            {hint}
          </motion.p>
          <div className="relative z-10 my-auto" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
