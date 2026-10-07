"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// First-person style movement on top of the orbit camera.
//
// WASD / arrows move the camera where it is looking (W forward, S back, A/D
// strafe), Q/E down and up. The orbit target moves with it, so dragging still
// orbits from wherever you end up.
//
// Shift toggles mouse look: the pointer locks and moving the mouse turns the
// view in place, like a first-person game, while WASD flies. Orbit is off in
// that mode (its polar limits would fight looking up). Leaving it puts the
// orbit target a few metres in front of you, so nothing jumps.

const MOVE_SPEED = 2.4; // m/s
const LOOK_SPEED = 0.0024; // rad per pixel
const BOUNDS = new THREE.Box3(new THREE.Vector3(-10, 0.15, -10), new THREE.Vector3(10, 9, 10));
const ORBIT_DIST = 4; // target distance when handing back to orbit

const KEYMAP: Record<string, string> = {
  KeyW: "fwd", ArrowUp: "fwd",
  KeyS: "back", ArrowDown: "back",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right",
  KeyQ: "down",
  KeyE: "up",
};

interface Props {
  controls: React.RefObject<OrbitControlsImpl | null>;
  enabled: boolean;
  onUsed?: () => void;
  onShiftLock?: (on: boolean) => void;
}

export default function KeyboardControls({ controls, enabled, onUsed, onShiftLock }: Props) {
  const { camera, gl } = useThree();
  const held = useRef(new Set<string>());
  const look = useRef({ dx: 0, dy: 0 });
  const locked = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const tmp = useRef({ fwd: new THREE.Vector3(), right: new THREE.Vector3(), move: new THREE.Vector3() });

  // Mouse look (pointer lock)
  useEffect(() => {
    const canvas = gl.domElement;
    const onLockChange = () => {
      const on = document.pointerLockElement === canvas;
      locked.current = on;
      const c = controls.current;
      if (on) {
        euler.current.setFromQuaternion(camera.quaternion, "YXZ");
        if (c) c.enabled = false;
      } else if (c) {
        // Hand back to orbit: target straight ahead, tipped slightly
        // downward so it sits inside the orbit's polar limits.
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = Math.min(dir.y, -0.08);
        dir.normalize();
        c.target.copy(camera.position).addScaledVector(dir, ORBIT_DIST);
        c.enabled = true;
        c.update();
      }
      onShiftLock?.(on);
    };
    const onMove = (e: MouseEvent) => {
      if (!locked.current) return;
      look.current.dx += e.movementX;
      look.current.dy += e.movementY;
    };
    const onShift = (e: KeyboardEvent) => {
      if ((e.code !== "ShiftLeft" && e.code !== "ShiftRight") || e.repeat) return;
      if (locked.current) document.exitPointerLock();
      else if (enabled) canvas.requestPointerLock?.();
    };
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onShift);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onShift);
    };
  }, [gl, camera, controls, enabled, onShiftLock]);

  // An overlay opening (or the loader) releases the lock.
  useEffect(() => {
    if (!enabled && document.pointerLockElement) document.exitPointerLock();
  }, [enabled]);

  // Keys
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
    if (!enabled || !c) return;
    const dt = Math.min(dtRaw, 0.05);
    const keys = held.current;

    // turn the head (mouse look only)
    if (locked.current) {
      const { dx, dy } = look.current;
      look.current.dx = look.current.dy = 0;
      if (dx || dy) {
        const e = euler.current;
        e.y -= dx * LOOK_SPEED;
        e.x = THREE.MathUtils.clamp(e.x - dy * LOOK_SPEED, -1.45, 1.45);
        camera.quaternion.setFromEuler(e);
      }
    } else if (!c.enabled) {
      return; // camera intro still running
    }

    if (keys.size === 0) return;

    // walk where the camera faces, level with the floor
    const { fwd, right, move } = tmp.current;
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
    fwd.normalize();
    right.crossVectors(fwd, camera.up).normalize();
    move.set(0, 0, 0);
    if (keys.has("fwd")) move.add(fwd);
    if (keys.has("back")) move.sub(fwd);
    if (keys.has("right")) move.add(right);
    if (keys.has("left")) move.sub(right);
    if (keys.has("up")) move.y += 1;
    if (keys.has("down")) move.y -= 1;
    if (move.lengthSq() === 0) return;
    move.normalize().multiplyScalar(MOVE_SPEED * dt);

    // move, kept inside the play area; the orbit target travels by the same
    // amount so dragging afterwards still orbits around what's in front
    const before = camera.position.clone();
    camera.position.add(move);
    BOUNDS.clampPoint(camera.position, camera.position);
    const applied = camera.position.clone().sub(before);
    c.target.add(applied);
    if (!locked.current) c.update();
  });

  return null;
}
