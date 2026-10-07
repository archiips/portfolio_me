"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { assetPath } from "@/lib/utils";
import { Section } from "./roomNav";

const FONT = assetPath("/fonts/Sniglet-Regular.ttf");
const IDLE = new THREE.Color("#E9DFD0");
const HOVER = new THREE.Color("#FFDE85");

const ITEMS: { section: Section; label: string }[] = [
  { section: "aboutme", label: "about me" },
  { section: "projects", label: "projects" },
  { section: "work", label: "work experience" },
  { section: "education", label: "education" },
  { section: "contact", label: "contact me" },
];

const noRaycast = () => {};

interface ItemProps {
  ghost?: boolean;
  label: string;
  section: Section;
  y: number;
  hovered: boolean;
  onHover: (s: Section | null) => void;
  onSelect: (s: Section) => void;
  align: "left" | "center";
}

function Item({ label, section, y, hovered, onHover, onSelect, align, ghost }: ItemProps) {
  const ref = useRef<THREE.Mesh>(null);

  // Ease toward the hover colour and nudge the line out a little.
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.toneMapped = false; // UI colour, not scene light
    mat.color.lerp(hovered ? HOVER : IDLE, 0.2);
    const targetX = hovered && align === "left" ? 0.08 : 0;
    m.position.x += (targetX - m.position.x) * 0.2;
  });

  return (
    <Text
      ref={ref}
      font={FONT}
      fontSize={0.23}
      anchorX={align}
      anchorY="middle"
      position={[0, y, 0]}
      color={IDLE}
      {...(ghost
        ? { raycast: noRaycast }
        : {
            onPointerOver: (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover(section);
            },
            onPointerOut: () => onHover(null),
            onClick: (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onSelect(section);
            },
          })}
    >
      {label}
    </Text>
  );
}

interface NavTextProps {
  /** The mirrored copy in the floor: same look, never clickable. */
  ghost?: boolean;
  mobile: boolean;
  hovered: Section | null;
  onHover: (s: Section | null) => void;
  onSelect: (s: Section) => void;
}

// The name and the section list live in the 3D scene, beside the room, so they
// are part of the diorama and reflect in the floor like the reference.
export default function NavText({ ghost, mobile, hovered, onHover, onSelect }: NavTextProps) {
  const align = mobile ? "center" : "left";
  // Desktop: on the back wall's plane, continuing past the room's right edge,
  // so the lines run parallel to the wall like the reference.
  const position: [number, number, number] = mobile ? [0.2, 3.85, 0.2] : [2.65, 2.0, -1.98];
  const rotation: [number, number, number] = mobile ? [0, 0.8, 0] : [0, 0, 0];

  return (
    <group position={position} rotation={rotation}>
      <Text
        font={FONT}
        fontSize={0.42}
        anchorX={align}
        anchorY="middle"
        position={[0, 0.42, 0]}
        color="#F2E8DA"
        letterSpacing={0.02}
        material-toneMapped={false}
        raycast={noRaycast}
      >
        archit jaiswal
      </Text>
      {ITEMS.map((it, i) => (
        <Item
          key={it.section}
          {...it}
          y={-i * 0.31}
          hovered={hovered === it.section}
          onHover={onHover}
          onSelect={onSelect}
          align={align}
          ghost={ghost}
        />
      ))}
    </group>
  );
}
