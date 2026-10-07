"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { clone as cloneWithSkeletons } from "three/examples/jsm/utils/SkeletonUtils.js";
import { DRACO_PATH, MODEL_URL } from "./RoomModel";

// The floor below the room is a mirror: a flipped copy of the room under the
// floor plane, seen through a sheet of the background colour. Cheaper and
// more controllable than a reflector pass.
//
// The room's slab bottom is at y = -0.1, so mirroring about that plane maps
// y -> -0.2 - y.
export const MIRROR_Y = -0.1;
const SHEET_OPACITY = 0.8; // how much of the background lies over the reflection

const NOT_REFLECTED = /^(Panda|steam_)|hitbox$/; // animated or invisible bits

export function Mirrored({ children }: { children: React.ReactNode }) {
  return (
    <group position={[0, 2 * MIRROR_Y, 0]} scale={[1, -1, 1]}>
      {children}
    </group>
  );
}

export function RoomReflection() {
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);
  const copy = useMemo(() => {
    // Shares geometry and materials with the real room, so hover glow and
    // the brightness lift show in the reflection too, at no memory cost.
    // SkeletonUtils rebinds any rigged mesh to the copied bones; a plain
    // clone() would leave it drawn on top of the real room.
    const c = cloneWithSkeletons(scene);
    const drop: THREE.Object3D[] = [];
    c.traverse((o) => {
      if (NOT_REFLECTED.test(o.name)) drop.push(o);
      o.raycast = () => {}; // never pickable
    });
    drop.forEach((o) => o.removeFromParent());
    return c;
  }, [scene]);

  return (
    <Mirrored>
      <primitive object={copy} />
    </Mirrored>
  );
}

// The sheet the reflection is seen through: background colour, unlit and not
// tone-mapped so it matches the page exactly where nothing is reflected.
export function MirrorSheet({ color }: { color: string }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, MIRROR_Y - 0.002, 0]} renderOrder={2}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={SHEET_OPACITY}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
