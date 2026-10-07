"use client";

import { Suspense, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import RoomModel from "./RoomModel";
import { LABEL_OF, Section } from "./roomNav";

// Blender camera was at (7.2, -7.4, 5.4) looking at (-0.1, 0.1, 1.15), FOV 42.
// glTF is Y-up, so Blender (x, y, z) becomes (x, z, -y).
const CAM_POS: [number, number, number] = [7.2, 5.4, 7.4];
const CAM_TARGET: [number, number, number] = [-0.1, 1.15, -0.1];

interface RoomSceneProps {
  onSelect: (s: Section) => void;
}

export default function RoomScene({ onSelect }: RoomSceneProps) {
  const [hovered, setHovered] = useState<Section | null>(null);

  return (
    <div className="fixed inset-0 bg-[#201910]">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: CAM_POS, fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.NoToneMapping; // the bake is already tone-mapped
          scene.background = new THREE.Color("#201910");
        }}
        style={{ cursor: hovered ? "pointer" : "default" }}
      >
        {/* Nearly everything is lit by its baked textures. This only exists for
            the panda and the steam, which are animated and so were left out. */}
        <ambientLight intensity={0.55} color="#FFE7BF" />

        <Suspense fallback={null}>
          <RoomModel hovered={hovered} onHover={setHovered} onSelect={onSelect} />
        </Suspense>

        <OrbitControls
          target={CAM_TARGET}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={5}
          maxDistance={16}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>

      {/* The reference cools its warm interior with a blue overlay in `overlay`
          blend mode. Pointer-events off so it never eats a click. */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          backgroundColor: "#82ADED",
          opacity: 0.45,
          mixBlendMode: "overlay",
        }}
      />

      {hovered && (
        <div className="pointer-events-none fixed bottom-10 left-1/2 z-20 -translate-x-1/2">
          <span className="rounded-full bg-black/55 px-4 py-2 text-sm tracking-wide text-[#FFDE85] backdrop-blur-sm">
            {LABEL_OF[hovered]}
          </span>
        </div>
      )}
    </div>
  );
}
