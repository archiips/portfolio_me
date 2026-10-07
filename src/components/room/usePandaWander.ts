import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// The panda wanders the open floor: pick a reachable spot, turn to face it,
// waddle there, then idle and look around before choosing the next one.
// Everything is in glTF space (Y-up; Blender y becomes -z).

type Rect = [x0: number, x1: number, z0: number, z1: number];

const BOUNDS: Rect = [-1.5, 1.95, -0.2, 1.8];
const RADIUS = 0.12; // body half-width plus a little clearance

// Floor-level furniture, from the Blender scene's bounding boxes.
const OBSTACLES: Rect[] = [
  [-2.0, -0.91, -2.0, 0.1], // bed
  [-2.18, -1.86, 0.05, 0.55], // bedside table
  [-2.04, -1.68, 1.13, 1.91], // bench
  [-0.9, -0.54, 0.25, 0.55], // slippers
  [0.93, 1.67, -1.12, -0.32], // desk chair
];

const WALK_SPEED = 0.16; // m/s, small animal pace
const TURN_SPEED = 2.6; // rad/s
const STEP_HZ = 3.4;

function blocked(x: number, z: number) {
  const [bx0, bx1, bz0, bz1] = BOUNDS;
  if (x < bx0 || x > bx1 || z < bz0 || z > bz1) return true;
  return OBSTACLES.some(
    ([x0, x1, z0, z1]) =>
      x > x0 - RADIUS && x < x1 + RADIUS && z > z0 - RADIUS && z < z1 + RADIUS
  );
}

function pathClear(a: THREE.Vector3, b: THREE.Vector3) {
  const steps = Math.ceil(a.distanceTo(b) / 0.05);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

function pickTarget(from: THREE.Vector3) {
  const [bx0, bx1, bz0, bz1] = BOUNDS;
  for (let i = 0; i < 60; i++) {
    const p = new THREE.Vector3(
      bx0 + Math.random() * (bx1 - bx0),
      0,
      bz0 + Math.random() * (bz1 - bz0)
    );
    const d = p.distanceTo(from);
    if (d > 0.5 && d < 2.2 && !blocked(p.x, p.z) && pathClear(from, p)) return p;
  }
  return from.clone();
}

function angleDelta(a: number, b: number) {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

const HEAD_PARTS = ["Panda_Head", "Panda_EarL", "Panda_EarR", "Panda_EyeL", "Panda_EyeR", "Panda_Snout"];

export function usePandaWander(scene: THREE.Object3D, shadow: React.RefObject<THREE.Mesh | null>) {
  const panda = useMemo(() => scene.getObjectByName("Panda") ?? null, [scene]);

  // Rest positions of the parts, so the gait is an offset from them. The
  // parts are scaled spheres, so the body's rest scale is kept too.
  const rest = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    panda?.traverse((o) => m.set(o.name, o.position.clone()));
    return m;
  }, [panda]);
  const bodyScale = useMemo(
    () => panda?.getObjectByName("Panda_Body")?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    [panda]
  );

  // The head and its features turn together around the neck.
  const head = useMemo(() => {
    if (!panda) return null;
    const pivot = new THREE.Group();
    const h = panda.getObjectByName("Panda_Head");
    if (!h) return null;
    pivot.position.copy(h.position);
    panda.add(pivot);
    HEAD_PARTS.forEach((n) => {
      const o = panda.getObjectByName(n);
      if (o) pivot.attach(o);
    });
    return pivot;
  }, [panda]);

  const state = useRef({
    mode: "idle" as "idle" | "turn" | "walk",
    target: new THREE.Vector3(),
    idleLeft: 1.5,
    heading: 0,
    phase: 0,
    lookSeed: Math.random() * 10,
  });

  useEffect(() => {
    if (!panda) return;
    panda.position.y = 0;
    state.current.heading = panda.rotation.y;
    panda.rotation.set(0, state.current.heading, 0);
  }, [panda]);

  useFrame((clock, dtRaw) => {
    if (!panda) return;
    const dt = Math.min(dtRaw, 0.05);
    const s = state.current;
    const pos = panda.position;

    if (s.mode === "idle") {
      s.idleLeft -= dt;
      if (s.idleLeft <= 0) {
        s.target = pickTarget(pos);
        s.mode = "turn";
      }
    }

    const toTarget = new THREE.Vector3().subVectors(s.target, pos).setY(0);
    const wantHeading = Math.atan2(toTarget.x, toTarget.z); // forward is +z
    const dh = angleDelta(s.heading, wantHeading);

    if (s.mode === "turn") {
      s.heading += Math.sign(dh) * Math.min(Math.abs(dh), TURN_SPEED * dt);
      s.phase += dt * STEP_HZ * 0.6; // shuffle while turning
      if (Math.abs(dh) < 0.12) s.mode = "walk";
    } else if (s.mode === "walk") {
      // keep steering gently so curved approaches look natural
      s.heading += dh * Math.min(1, dt * 4);
      const dist = toTarget.length();
      const ease = Math.min(1, dist / 0.25); // slow down on arrival
      const step = Math.min(dist, WALK_SPEED * (0.35 + 0.65 * ease) * dt);
      pos.x += Math.sin(s.heading) * step;
      pos.z += Math.cos(s.heading) * step;
      s.phase += dt * STEP_HZ * (0.4 + 0.6 * ease);
      if (dist < 0.02) {
        s.mode = "idle";
        s.idleLeft = 2 + Math.random() * 4;
      }
    }

    const moving = s.mode !== "idle";
    const swing = Math.sin(s.phase * Math.PI * 2);
    const lift = (side: number) => (moving ? Math.max(0, swing * side) * 0.018 : 0);

    // Waddle: body rolls toward the planted foot and bobs once per step.
    panda.rotation.set(0, s.heading, 0);
    panda.rotation.z = moving ? swing * 0.07 : 0;
    pos.y = moving ? Math.abs(Math.cos(s.phase * Math.PI * 2)) * 0.006 : 0;

    const setOffset = (name: string, dy: number, dz: number) => {
      const o = panda.getObjectByName(name);
      const r = rest.get(name);
      if (!o || !r || o.parent !== panda) return;
      o.position.set(r.x, r.y + dy, r.z + dz);
    };
    setOffset("Panda_LegL", lift(1), moving ? swing * 0.016 : 0);
    setOffset("Panda_LegR", lift(-1), moving ? -swing * 0.016 : 0);
    setOffset("Panda_ArmL", 0, moving ? -swing * 0.012 : 0);
    setOffset("Panda_ArmR", 0, moving ? swing * 0.012 : 0);

    // Breathing when still, and a slow look around.
    const t = clock.clock.elapsedTime;
    const body = panda.getObjectByName("Panda_Body");
    if (body) {
      const breathe = moving ? 1 : 1 + Math.sin(t * 2.2) * 0.018;
      body.scale.set(bodyScale.x, bodyScale.y * breathe, bodyScale.z);
    }
    if (head) {
      const look = moving ? 0 : Math.sin(t * 0.7 + s.lookSeed) * 0.6;
      head.rotation.y += (look - head.rotation.y) * Math.min(1, dt * 3);
      head.rotation.x = moving ? Math.abs(swing) * 0.05 : Math.sin(t * 0.5) * 0.04;
    }

    if (shadow.current) {
      shadow.current.position.set(pos.x, 0.006, pos.z);
      const sc = moving ? 1 - Math.abs(Math.cos(s.phase * Math.PI * 2)) * 0.06 : 1;
      shadow.current.scale.setScalar(sc);
    }
  });

  return !!panda;
}
