"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// WASD / arrow keys move the camera around the room on the same orbit the
// mouse uses: W/S in and out, A/D around, Q/E higher or lower. Limits come
// from the OrbitControls, so keys and mouse can never disagree.

const ORBIT_SPEED = 1.2; // rad/s
const TILT_SPEED = 0.8; // rad/s
const ZOOM_SPEED = 1.1; // fraction of distance per second

const KEYMAP: Record<string, string> = {
  KeyW: "in", ArrowUp: "in",
  KeyS: "out", ArrowDown: "out",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right",
  KeyQ: "up",
  KeyE: "down",
};

interface Props {
  controls: React.RefObject<OrbitControlsImpl | null>;
  enabled: boolean;
  onUsed?: () => void;
}

export default function KeyboardControls({ controls, enabled, onUsed }: Props) {
  const { camera } = useThree();
  const held = useRef(new Set<string>());
  const sph = useRef(new THREE.Spherical());
  const offset = useRef(new THREE.Vector3());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const action = KEYMAP[e.code];
      if (!action || e.metaKey || e.ctrlKey || e.altKey) return;
      held.current.add(action);
      if (e.code.startsWith("Arrow")) e.preventDefault(); // don't scroll the page
      onUsed?.();
    };
    const up = (e: KeyboardEvent) => {
      const action = KEYMAP[e.code];
      if (action) held.current.delete(action);
    };
    const clear = () => held.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [onUsed]);

  useFrame((_, dtRaw) => {
    const c = controls.current;
    const keys = held.current;
    if (!enabled || !c || !c.enabled || keys.size === 0) return;
    const dt = Math.min(dtRaw, 0.05);

    offset.current.copy(camera.position).sub(c.target);
    const s = sph.current.setFromVector3(offset.current);
    if (keys.has("left")) s.theta -= ORBIT_SPEED * dt;
    if (keys.has("right")) s.theta += ORBIT_SPEED * dt;
    if (keys.has("up")) s.phi -= TILT_SPEED * dt;
    if (keys.has("down")) s.phi += TILT_SPEED * dt;
    if (keys.has("in")) s.radius *= 1 - ZOOM_SPEED * dt;
    if (keys.has("out")) s.radius *= 1 + ZOOM_SPEED * dt;
    s.phi = THREE.MathUtils.clamp(s.phi, c.minPolarAngle, c.maxPolarAngle);
    s.radius = THREE.MathUtils.clamp(s.radius, c.minDistance, c.maxDistance);
    s.makeSafe();

    camera.position.copy(c.target).add(offset.current.setFromSpherical(s));
    camera.lookAt(c.target);
    c.update();
  });

  return null;
}
