"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { assetPath } from "@/lib/utils";
import Overlay from "./overlays/Overlay";
import { jsAnimated } from "./overlays/motion";

// Archit's photos, the same ones pinned on the garland in the room
// (public/photos, 800px). Captions can be added here.
const PHOTOS = Array.from({ length: 10 }, (_, i) => ({
  src: assetPath(`/photos/${String(i + 1).padStart(2, "0")}.jpg`),
  caption: "",
}));

// Photos fetched and decoded ahead of time, kept referenced so the browser
// holds on to the decoded pixels. Without this the first opening decoded
// every image in the middle of the fall and stuttered.
const decoded = new Map<string, Promise<void>>();
function loadPhoto(src: string) {
  let p = decoded.get(src);
  if (!p) {
    const img = new Image();
    img.src = src;
    p = img.decode().catch(() => {});
    decoded.set(src, p);
  }
  return p;
}

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
const SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 0.9 } as const;

function label(i: number) {
  return `${String(i + 1).padStart(2, "0")} / ${PHOTOS.length}`;
}

// A polaroid: white frame, square photo cropped from the original, number in
// the wide bottom margin.
function Polaroid({ i }: { i: number }) {
  return (
    <div className="flex h-full w-full flex-col rounded-[4px] bg-[#FBF8F2] p-[6%] pb-0 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PHOTOS[i].src}
        alt={PHOTOS[i].caption || `Photo ${i + 1}`}
        draggable={false}
        className="aspect-square w-full select-none rounded-[2px] object-cover"
      />
      <div className="flex flex-1 items-center justify-between px-1 text-sm text-[#5b4a3a] [font-family:var(--font-sniglet)]">
        <span>{PHOTOS[i].caption}</span>
        <span className="opacity-60">{label(i)}</span>
      </div>
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
  const isTop = depth === 0;
  const slot = SLOT[depth];
  // Every card owns its x, so moving between the top and the pile never
  // swaps the value driving it (which made cards jump).
  const x = useMotionValue(0);
  // Drag offset, kept apart from x so the tilt only follows the hand.
  const dragX = useMotionValue(0);
  // Tilt with the drag, like holding a photo by its bottom edge.
  const dragRotate = useTransform(dragX, [-300, 0, 300], [-16, 0, 16]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onSwipe(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) onSwipe(-1);
    else animate(dragX, 0, SPRING);
  };

  return (
    <motion.div
      {...jsAnimated}
      className="absolute inset-0"
      style={{ zIndex: VISIBLE - depth, x }}
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
          opacity: 1,
          transition: {
            ...SPRING,
            delay: intro ? (VISIBLE - 1 - depth) * 0.12 + 0.15 : 0,
          },
        },
        gone: (d: number) => ({
          x: d > 0 ? -560 : 560,
          rotate: d > 0 ? -24 : 24,
          opacity: 0,
          transition: { duration: 0.32, ease: [0.32, 0, 0.67, 0] },
        }),
      }}
      initial={intro ? "unpinned" : isTop && dir < 0 ? "returning" : "joining"}
      animate="rest"
      exit={isTop ? "gone" : { opacity: 0, transition: { duration: 0.2 } }}
    >
      {/* The hand-held layer: drags on its own value with no constraints, so
          letting go never fights the fly-off animation. */}
      <motion.div
        {...jsAnimated}
        className={`h-full w-full ${isTop ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ x: dragX, rotate: dragRotate }}
        drag={isTop ? "x" : false}
        dragMomentum={false}
        onDragEnd={isTop ? onDragEnd : undefined}
        whileDrag={{ scale: 1.03 }}
      >
        <Polaroid i={photo} />
      </motion.div>
    </motion.div>
  );
}

interface PhotoStackProps {
  isOpen: boolean;
  onClose: () => void;
  // True once the room is up: photos then load quietly in the background.
  preload?: boolean;
}

export default function PhotoStack({ isOpen, onClose, preload = false }: PhotoStackProps) {
  const n = PHOTOS.length;
  // [index of the top card, direction of the last move]
  const [[index, dir], setPage] = useState<[number, number]>([0, 0]);
  const [intro, setIntro] = useState(true);

  // Until the first few photos are decoded the pile stays empty, so the fall
  // starts a moment late rather than stuttering (waits at most a second).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (preload || isOpen) PHOTOS.forEach(({ src }) => loadPhoto(src));
  }, [preload, isOpen]);

  useEffect(() => {
    if (!isOpen || ready) return;
    let live = true;
    const first = Promise.all(PHOTOS.slice(0, VISIBLE).map(({ src }) => loadPhoto(src)));
    Promise.race([first, new Promise((r) => setTimeout(r, 1000))]).then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [isOpen, ready]);

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
            {ready &&
              pile
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
