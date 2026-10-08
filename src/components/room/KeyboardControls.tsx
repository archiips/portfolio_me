"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// First-person style movement on top of the orbit camera.
//
// WASD / arrows move the camera where it is looking (W forward along the
// view, including up/down, S back, A/D strafe), Q/E straight down and up. The orbit target moves with it, so dragging still
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
  /** True while the landing zoom runs; cleared here when the user takes over. */
  intro: React.RefObject<boolean>;
  enabled: boolean;
  onUsed?: () => void;
  onShiftLock?: (on: boolean) => void;
  /** Shift was pressed but the browser wants a click before locking. */
  onArmed?: (armed: boolean) => void;
}

export default function KeyboardControls({ controls, intro, enabled, onUsed, onShiftLock, onArmed }: Props) {
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
      if (on) {
        intro.current = false; // stop the landing zoom where it is
        setArmed(false);
        settle = 2;
        look.current.dx = look.current.dy = 0;
      }
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
    // Chrome often reports a huge bogus jump in the first events after a
    // pointer lock (and occasionally later), which spun the camera on the
    // first Shift. Skip the first events and drop impossible jumps.
    let settle = 0;
    const onMove = (e: MouseEvent) => {
      if (!locked.current) return;
      if (settle > 0) {
        settle--;
        return;
      }
      if (Math.abs(e.movementX) > 160 || Math.abs(e.movementY) > 160) return;
      look.current.dx += e.movementX;
      look.current.dy += e.movementY;
    };
    // Browsers only grant pointer lock right after a user gesture, and Chrome
    // does not count a bare Shift press as one. Try anyway; if refused, arm
    // it so the next click on the room starts mouse look.
    let armed = false;
    const setArmed = (v: boolean) => {
      armed = v;
      onArmed?.(v);
    };
    const request = () => {
      try {
        // raw input (no OS acceleration) avoids the spikes where supported
        const req = canvas.requestPointerLock as unknown as (o?: object) => Promise<void> | undefined;
        const p = req.call(canvas, { unadjustedMovement: true });
        p?.catch?.(() => {
          // unadjustedMovement unsupported or no gesture: plain lock, else arm
          const p2 = req.call(canvas);
          p2?.catch?.(() => setArmed(true));
        });
      } catch {
        setArmed(true);
      }
    };
    const onShift = (e: KeyboardEvent) => {
      if ((e.code !== "ShiftLeft" && e.code !== "ShiftRight") || e.repeat) return;
      if (locked.current) document.exitPointerLock();
      else if (armed) setArmed(false); // second Shift cancels
      else if (enabled) request();
    };
    // The arming click only starts mouse look; it must not also select
    // whatever object sits under the cursor.
    const onArmedClick = (e: PointerEvent) => {
      if (!armed) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      setArmed(false);
      request();
      // the browser still fires a click after this press; eat that one too
      const eat = (c: Event) => {
        c.stopImmediatePropagation();
        c.preventDefault();
      };
      window.addEventListener("click", eat, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", eat, { capture: true }), 600);
    };
    canvas.addEventListener("pointerdown", onArmedClick, { capture: true });
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onShift);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onShift);
      canvas.removeEventListener("pointerdown", onArmedClick, { capture: true });
    };
  }, [gl, camera, controls, intro, enabled, onShiftLock, onArmed]);

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
    }

    if (keys.size === 0) return;
    if (intro.current) {
      // keys during the landing zoom: stop it here and hand over
      intro.current = false;
      c.enabled = true;
    }

    // W/S fly exactly where the camera looks (look down + W goes down);
    // A/D strafe stays level so sideways never drifts up or down
    const { fwd, right, move } = tmp.current;
    camera.getWorldDirection(fwd);
    right.crossVectors(fwd, camera.up);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.y = 0;
    right.normalize();
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
