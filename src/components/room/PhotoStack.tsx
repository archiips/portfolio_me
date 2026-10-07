"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { assetPath } from "@/lib/utils";
import Overlay from "./overlays/Overlay";

// Placeholder set: the 10 polaroids on the garland in the room. Swap in your
// own by replacing the files in public/photos (and adding captions here).
const PHOTOS = Array.from({ length: 10 }, (_, i) => ({
  src: assetPath(`/photos/${String(i + 1).padStart(2, "0")}.jpg`),
  caption: "",
}));

const VISIBLE = 4; // cards drawn in the pile
// Resting pose for each depth in the pile: a messy, slightly fanned stack.
const SLOT = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: -10, y: 12, rotate: -5, scale: 0.97 },
  { x: 12, y: 22, rotate: 4.5, scale: 0.94 },
  { x: -4, y: 30, rotate: -2, scale: 0.91 },
];
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 500;

function label(i: number) {
  return `${String(i + 1).padStart(2, "0")} / ${PHOTOS.length}`;
}

// The garland's photos are already polaroids (white border included), so the
// image is the whole card. Your own photos get the same treatment.
function Polaroid({ i }: { i: number }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[4px] bg-[#FBF8F2] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PHOTOS[i].src}
        alt={PHOTOS[i].caption || `Photo ${i + 1}`}
        draggable={false}
        className="h-full w-full select-none object-cover"
      />
      <span className="absolute bottom-3 right-4 text-sm text-[#5b4a3a]/70 [font-family:var(--font-sniglet)]">
        {PHOTOS[i].caption || label(i)}
      </span>
    </div>
  );
}

interface CardProps {
  photo: number;
  depth: number;
  dir: number;
  intro: boolean;
  onSwipe: (d: number) => void;
}

function Card({ photo, depth, dir, intro, onSwipe }: CardProps) {
  const x = useMotionValue(0);
  // Tilt with the drag, like holding a photo by its bottom edge.
  const dragRotate = useTransform(x, [-300, 0, 300], [-16, 0, 16]);
  const isTop = depth === 0;
  const slot = SLOT[depth];

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onSwipe(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) onSwipe(-1);
  };

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ zIndex: VISIBLE - depth, x: isTop ? x : undefined }}
      custom={dir}
      variants={{
        // On open, each card is unpinned from the garland above and falls
        // into the pile, deepest first.
        unpinned: { y: "-75vh", x: (photo % 3 - 1) * 140, rotate: (photo % 2 ? 1 : -1) * 25, scale: 0.55, opacity: 0 },
        // A previous card comes back in from the side it was swiped to.
        returning: { x: -420, y: 0, rotate: -18, scale: 1, opacity: 0 },
        // A new card joins the bottom of the pile from behind.
        joining: { ...SLOT[VISIBLE - 1], y: SLOT[VISIBLE - 1].y + 20, opacity: 0 },
        rest: {
          ...slot,
          x: isTop ? 0 : slot.x,
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 210,
            damping: 22,
            delay: intro ? (VISIBLE - 1 - depth) * 0.12 + 0.15 : 0,
          },
        },
        gone: (d: number) => ({
          x: d > 0 ? -560 : 560,
          rotate: d > 0 ? -24 : 24,
          opacity: 0,
          transition: { duration: 0.35, ease: "easeOut" },
        }),
      }}
      initial={intro ? "unpinned" : isTop && dir < 0 ? "returning" : "joining"}
      animate="rest"
      exit={isTop ? "gone" : { opacity: 0, transition: { duration: 0.2 } }}
      drag={isTop ? "x" : false}
      dragElastic={0.85}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? onDragEnd : undefined}
      whileDrag={{ scale: 1.03 }}
    >
      <motion.div className="h-full w-full" style={{ rotate: isTop ? dragRotate : 0 }}>
        <Polaroid i={photo} />
      </motion.div>
    </motion.div>
  );
}

interface PhotoStackProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoStack({ isOpen, onClose }: PhotoStackProps) {
  const n = PHOTOS.length;
  // [index of the top card, direction of the last move]
  const [[index, dir], setPage] = useState<[number, number]>([0, 0]);
  const [intro, setIntro] = useState(true);

  const paginate = useCallback(
    (d: number) => {
      setIntro(false);
      setPage(([i]) => [(i + d + n) % n, d]);
    },
    [n]
  );

  // Next time it opens, the photos fall from the garland again.
  const close = () => {
    onClose();
    setTimeout(() => setIntro(true), 400);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "ArrowLeft") paginate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, paginate]);

  const pile = Array.from({ length: VISIBLE }, (_, d) => (index + d) % n);

  return (
    <Overlay open={isOpen} onClose={close} hint="drag a photo left or right · click outside to close">
      <div className="flex flex-col items-center gap-8">
        <div className="relative aspect-[430/512] h-[min(62vh,500px)]">
          <AnimatePresence custom={dir} initial>
            {pile
              .map((photo, depth) => (
                <Card key={photo} photo={photo} depth={depth} dir={dir} intro={intro} onSwipe={paginate} />
              ))
              .reverse()}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-6 text-[#E9DFD0]">
          <button aria-label="Previous photo" onClick={() => paginate(-1)} className="rounded-full p-2 outline-none hover:text-[#FFDE85] focus-visible:ring-2 focus-visible:ring-[#FFDE85]/60">
            <ChevronLeft className="h-7 w-7" />
          </button>
          <span className="w-16 text-center text-sm opacity-80">{label(index)}</span>
          <button aria-label="Next photo" onClick={() => paginate(1)} className="rounded-full p-2 outline-none hover:text-[#FFDE85] focus-visible:ring-2 focus-visible:ring-[#FFDE85]/60">
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      </div>
    </Overlay>
  );
}
