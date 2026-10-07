"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { assetPath } from "@/lib/utils";
import {
  HITBOX_OF,
  NAV_MESH_OF,
  SECTIONS,
  Section,
  sectionFromHitbox,
} from "./roomNav";

const MODEL_URL = assetPath("/models/room-baked.glb");
const DRACO_PATH = assetPath("/draco/");

const HOVER_EMISSIVE = 2.1; // baked materials sit at 1.0; this is the hover lift
const LERP = 0.18;

interface RoomModelProps {
  hovered: Section | null;
  onHover: (s: Section | null) => void;
  onSelect: (s: Section) => void;
}

export default function RoomModel({ hovered, onHover, onSelect }: RoomModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL, DRACO_PATH);
  const { actions } = useAnimations(animations, group);

  // Collect the hitboxes and the meshes they highlight. Hitboxes must stay
  // `visible` or the raycaster skips them, so the MATERIAL is hidden instead.
  const { hitboxes, navMeshes } = useMemo(() => {
    const hits: THREE.Mesh[] = [];
    const navs: Partial<Record<Section, THREE.Mesh[]>> = {};
    const hitNames = new Set(Object.values(HITBOX_OF));
    const navLookup = new Map<string, Section>(
      SECTIONS.map((s) => [NAV_MESH_OF[s], s] as const)
    );

    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (hitNames.has(o.name)) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          m.visible = false; // not drawn, still raycastable
        });
        o.renderOrder = -1;
        hits.push(o);
        return;
      }
      const section = navLookup.get(o.name);
      if (section) {
        (navs[section] ??= []).push(o);
      }
    });
    return { hitboxes: hits, navMeshes: navs };
  }, [scene]);

  // The bake wrote the lighting into emissive maps, so brightening the emissive
  // is the cheapest honest "highlight" - no extra render pass needed.
  const baseIntensity = useRef(new Map<THREE.Material, number>());
  useEffect(() => {
    SECTIONS.forEach((s) => {
      navMeshes[s]?.forEach((mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) {
            baseIntensity.current.set(m, m.emissiveIntensity);
          }
        });
      });
    });
  }, [navMeshes]);

  useEffect(() => {
    Object.values(actions).forEach((a) => {
      a?.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    });
    return () => {
      Object.values(actions).forEach((a) => a?.stop());
    };
  }, [actions]);

  useFrame(() => {
    SECTIONS.forEach((s) => {
      const target = hovered === s ? HOVER_EMISSIVE : 1;
      navMeshes[s]?.forEach((mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (!(m instanceof THREE.MeshStandardMaterial)) return;
          const base = baseIntensity.current.get(m) ?? 1;
          m.emissiveIntensity += (base * target - m.emissiveIntensity) * LERP;
        });
      });
    });
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
      {hitboxes.map((h) => (
        <primitive
          key={h.name}
          object={h}
          onPointerOver={(e: THREE.Event & { stopPropagation: () => void }) => {
            e.stopPropagation();
            onHover(sectionFromHitbox(h.name));
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e: THREE.Event & { stopPropagation: () => void }) => {
            e.stopPropagation();
            const s = sectionFromHitbox(h.name);
            if (s) onSelect(s);
          }}
        />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_URL, DRACO_PATH);
