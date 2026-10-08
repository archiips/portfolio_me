"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music2 } from "lucide-react";
import { aboutMe } from "@/lib/projects";
import { assetPath } from "@/lib/utils";
import Overlay from "./Overlay";
import { enter, leave } from "./motion";

// "About me" as a conversation, after the Talk To You record on the wall: the
// visitor asks, Archit answers, with typing dots before each of his replies.

type Msg = { from: "them" | "me"; text?: string; img?: string };

const SCRIPT: Msg[] = [
  { from: "them", text: "hey! whose room is this?" },
  { from: "me", text: "hi, I'm Archit 👋" },
  { from: "me", text: "CS & Software Engineering student at UW Bothell, living in Seattle" },
  { from: "me", img: "/about/archit.jpg" },
  { from: "them", text: "what are you working on?" },
  { from: "me", text: "ML research at UW's DAIS group: teaching a mental-health chatbot to pick up emotion from your voice" },
  { from: "me", text: "this summer I built the AI side of an HR portal at Quadrant, and got its answers from 124s down to 7s" },
  { from: "them", text: "and outside of code?" },
  { from: "me", text: "I lead Helping Handz, a volunteer org at UW. tiny homes, hygiene kits, habitat restoration" },
  { from: "them", text: "nice, how do I reach you?" },
  { from: "me", text: "the envelope under \"contact me\", or just email me :)" },
];

const TYPING_MS = 750;
const GAP_MS = 380;

function Bubble({ m }: { m: Msg }) {
  const mine = m.from === "me";
  return (
    <motion.div
      className={`flex ${mine ? "justify-start" : "justify-end"}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: enter(0, 0.35) }}
      layout="position"
    >
      {m.img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetPath(m.img)} alt="Archit" className="w-44 rounded-2xl rounded-bl-md object-cover shadow" />
      ) : (
        <p
          className={`max-w-[78%] rounded-2xl px-4 py-2 text-[15px] leading-snug ${
            mine ? "rounded-bl-md bg-[#EFE6D6] text-[#3b3129]" : "rounded-br-md bg-[#C9A24D] text-[#2b2118]"
          }`}
        >
          {m.text}
        </p>
      )}
    </motion.div>
  );
}

function Typing() {
  return (
    <motion.div
      className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-[#EFE6D6] py-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
    >
      {[0, 1, 2].map((k) => (
        <motion.span
          key={k}
          className="h-1.5 w-1.5 rounded-full bg-[#8a7766]"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: k * 0.12 }}
        />
      ))}
    </motion.div>
  );
}

function Conversation() {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (shown >= SCRIPT.length) return;
    const next = SCRIPT[shown];
    const wait = shown === 0 ? 450 : GAP_MS;
    let t2: ReturnType<typeof setTimeout>;
    const t1 = setTimeout(() => {
      if (next.from === "me") {
        setTyping(true);
        t2 = setTimeout(() => {
          setTyping(false);
          setShown((n) => n + 1);
        }, TYPING_MS);
      } else {
        setShown((n) => n + 1);
      }
    }, wait);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [shown]);

  // Follow the conversation down as it grows (new bubbles, typing dots, the
  // photo loading in), unless the visitor has scrolled up to reread.
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const lastTop = useRef(0);

  useEffect(() => {
    const box = scroller.current;
    if (!box || !content.current) return;
    const ro = new ResizeObserver(() => {
      if (following.current) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    });
    ro.observe(content.current);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    // Only a move up means the visitor took over; our own smooth scrolls only
    // go down. Reaching the bottom again picks the conversation back up.
    const box = scroller.current!;
    if (box.scrollTop < lastTop.current) following.current = false;
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 60) following.current = true;
    lastTop.current = box.scrollTop;
  };

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div ref={content} className="flex flex-col gap-2">
        {SCRIPT.slice(0, shown).map((m, k) => (
          <Bubble key={k} m={m} />
        ))}
        <AnimatePresence>{typing && <Typing key="typing" />}</AnimatePresence>
      </div>
    </div>
  );
}

export default function AboutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Overlay open={open} onClose={onClose}>
      <motion.div
        className="flex h-[min(80vh,700px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-[38px] border-[10px] border-[#1d1916] bg-[#2a241f] shadow-[0_30px_70px_rgba(0,0,0,0.6)]"
        initial={{ y: 60, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0, transition: enter(0, 0.55) }}
        exit={{ y: 40, opacity: 0, transition: leave() }}
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#211c18] px-5 pb-3 pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/about/archit.jpg")} alt="" className="h-10 w-10 rounded-full object-cover object-[50%_25%]" />
          <div className="min-w-0">
            <p className="font-semibold text-[#EFE6D6]">{aboutMe.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-[#9b8f80]">
              <Music2 className="h-3 w-3" /> Talk To You · Ricky Montgomery
            </p>
          </div>
        </div>
        <Conversation />
      </motion.div>
    </Overlay>
  );
}
