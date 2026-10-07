"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { assetPath } from "@/lib/utils";

// Placeholder set: the 10 polaroids on the garland in the room. Swap in your
// own by replacing the files in public/photos (and adding captions here).
const PHOTOS = Array.from({ length: 10 }, (_, i) => ({
  src: assetPath(`/photos/${String(i + 1).padStart(2, "0")}.jpg`),
  caption: "",
}));

// Tilts for the cards waiting underneath, so the deck reads as a messy pile.
const TILT = [0, -5, 4, -2.5];
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 500;

interface PhotoStackProps {
  isOpen: boolean;
  onClose: () => void;
}

function Polaroid({ src, caption, label }: { src: string; caption: string; label: string }) {
  return (
    <div className="flex h-full w-full flex-col rounded-[6px] bg-[#FBF8F2] p-3 pb-0 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={caption || label}
        draggable={false}
        className="aspect-[430/512] w-full select-none rounded-[2px] object-cover"
      />
      <div className="flex flex-1 items-center justify-between px-1 text-sm text-[#5b4a3a]">
        <span>{caption}</span>
        <span className="opacity-60">{label}</span>
      </div>
    </div>
  );
}

export default function PhotoStack({ isOpen, onClose }: PhotoStackProps) {
  const n = PHOTOS.length;
  // [index of the top card, direction of the last move]
  const [[index, dir], setPage] = useState<[number, number]>([0, 0]);

  const paginate = useCallback(
    (d: number) => setPage(([i]) => [(i + d + n) % n, d]),
    [n]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") paginate(1);
      if (e.key === "ArrowRight") paginate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, paginate]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) paginate(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) paginate(-1);
  };

  const label = (i: number) => `${String(i + 1).padStart(2, "0")} / ${n}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            aria-label="Close photos"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-2 text-[#E9DFD0] transition-colors hover:text-[#FFDE85]"
          >
            <X className="h-7 w-7" />
          </button>

          <div
            className="relative h-[min(72vh,560px)] w-[min(78vw,380px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The pile underneath. Each card flies up into place on open. */}
            {[3, 2, 1].map((k) => {
              const i = (index + k) % n;
              return (
                <motion.div
                  key={`under-${k}`}
                  className="absolute inset-0"
                  initial={{ y: 260, opacity: 0, rotate: TILT[k] * 3 }}
                  animate={{ y: k * 10, opacity: 1, rotate: TILT[k], scale: 1 - k * 0.035 }}
                  exit={{ y: 260, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26, delay: (3 - k) * 0.06 }}
                >
                  <Polaroid {...PHOTOS[i]} label={label(i)} />
                </motion.div>
              );
            })}

            {/* The top card: drag it left or right. */}
            <AnimatePresence initial={true} custom={dir}>
              <motion.div
                key={index}
                className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
                custom={dir}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.9}
                onDragEnd={onDragEnd}
                whileDrag={{ scale: 1.03 }}
                variants={{
                  enter: (d: number) =>
                    d === 0
                      ? { y: 300, opacity: 0, rotate: 10 }
                      : { y: 10, scale: 0.965, rotate: TILT[1], opacity: 1 },
                  center: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
                  exit: (d: number) => ({
                    x: d > 0 ? -520 : 520,
                    rotate: d > 0 ? -18 : 18,
                    opacity: 0,
                    transition: { duration: 0.32 },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 28, delay: dir === 0 ? 0.2 : 0 }}
                style={{ zIndex: 5 }}
              >
                <Polaroid {...PHOTOS[index]} label={label(index)} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-6 text-[#E9DFD0]"
            onClick={(e) => e.stopPropagation()}
          >
            <button aria-label="Next photo" onClick={() => paginate(1)} className="rounded-full p-2 hover:text-[#FFDE85]">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <span className="text-sm tracking-wide opacity-80">swipe or use the arrows</span>
            <button aria-label="Previous photo" onClick={() => paginate(-1)} className="rounded-full p-2 hover:text-[#FFDE85]">
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
