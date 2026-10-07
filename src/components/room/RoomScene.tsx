"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import RoomModel from "./RoomModel";
import NavText from "./NavText";
import ContactBar from "./ContactBar";
import { LABEL_OF, Section } from "./roomNav";

// Blender camera was at (7.2, -7.4, 5.4) looking at (-0.1, 0.1, 1.15).
// glTF is Y-up, so Blender (x, y, z) becomes (x, z, -y). The landing view is
// pulled in closer than the Blender framing and aimed a little right of the
// room so the room sits left and the menu text right, like the reference.
const CAM_TARGET = new THREE.Vector3(0.75, 1.05, -0.75);
const CAM_END = new THREE.Vector3(6.6, 4.3, 5.6);
const CAM_START = new THREE.Vector3(14.5, 10.5, 13.0);
const INTRO_SECONDS = 2.6;

// Narrow screens get the menu under the room and a wider view.
const MOBILE_TARGET = new THREE.Vector3(0.0, 0.7, 0.0);
const MOBILE_END = new THREE.Vector3(8.6, 6.4, 8.4);

const BG = "#1f1b16";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function CameraIntro({
  controls,
  mobile,
}: {
  controls: React.RefObject<OrbitControlsImpl | null>;
  mobile: boolean;
}) {
  const { camera } = useThree();
  const t = useRef(0);
  const end = mobile ? MOBILE_END : CAM_END;
  const target = mobile ? MOBILE_TARGET : CAM_TARGET;

  useEffect(() => {
    camera.position.copy(CAM_START);
    t.current = 0;
    if (controls.current) {
      controls.current.target.copy(target);
      controls.current.enabled = false;
    }
  }, [camera, controls, target]);

  useFrame((_, dt) => {
    if (t.current >= 1) return;
    t.current = Math.min(1, t.current + dt / INTRO_SECONDS);
    const k = easeOutCubic(t.current);
    camera.position.lerpVectors(CAM_START, end, k);
    camera.lookAt(target);
    if (controls.current) {
      controls.current.target.copy(target);
      if (t.current >= 1) controls.current.enabled = true;
      controls.current.update();
    }
  });
  return null;
}

// A dark glossy ground below the room, like the reference: the room and the
// menu text reflect in it and fade out with distance.
function MirrorFloor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.101, 0]}>
      <planeGeometry args={[60, 60]} />
      <MeshReflectorMaterial
        resolution={1024}
        blur={[260, 80]}
        mixBlur={0.9}
        mixStrength={2.2}
        mixContrast={1}
        mirror={0.85}
        depthScale={0}
        color={BG}
        metalness={0.4}
        roughness={0.9}
      />
    </mesh>
  );
}

interface RoomSceneProps {
  onSelect: (s: Section) => void;
}

export default function RoomScene({ onSelect }: RoomSceneProps) {
  const [hovered, setHovered] = useState<Section | null>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth / window.innerHeight < 0.9);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="fixed inset-0" style={{ background: BG }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: CAM_START.toArray(), fov: 40, near: 0.1, far: 120 }}
        gl={{ antialias: true }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.NoToneMapping; // the bake is already tone-mapped
          scene.background = new THREE.Color(BG);
          scene.fog = new THREE.Fog(BG, 22, 45);
        }}
        style={{ cursor: hovered ? "pointer" : "default" }}
      >
        {/* Nearly everything is lit by its baked textures. These only shape
            the panda and the steam, which are animated and so not baked. */}
        <ambientLight intensity={0.9} color="#FFE7BF" />
        <directionalLight position={[2, 5, 3]} intensity={1.1} color="#FFE2B0" />

        <Suspense fallback={null}>
          <RoomModel hovered={hovered} onHover={setHovered} onSelect={onSelect} />
          <NavText
            mobile={mobile}
            hovered={hovered}
            onHover={setHovered}
            onSelect={onSelect}
          />
          <MirrorFloor />
          <CameraIntro controls={controls} mobile={mobile} />
        </Suspense>

        <OrbitControls
          ref={controls}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={4.5}
          maxDistance={16}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>

      {/* The reference cools its warm interior with a blue overlay in
          `overlay` blend mode. Kept light here so it doesn't darken the room. */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{ backgroundColor: "#82ADED", opacity: 0.18, mixBlendMode: "overlay" }}
      />

      <ContactBar />

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
