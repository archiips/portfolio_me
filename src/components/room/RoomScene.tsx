"use client";
/* eslint-disable react-hooks/immutability -- the camera and controls are
   three.js objects driven imperatively from useFrame, as R3F intends. */

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, OrbitControls, Preload } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import RoomModel from "./RoomModel";
import NavText from "./NavText";
import ContactBar from "./ContactBar";
import { LABEL_OF, Section } from "./roomNav";

// Blender camera was at (7.2, -7.4, 5.4) looking at (-0.1, 0.1, 1.15).
// glTF is Y-up, so Blender (x, y, z) becomes (x, z, -y). The landing view is
// pulled in closer than the Blender framing and aimed a little right of the
// room so the room sits left and the menu text right, like the reference.
// Solved so the room's front-left corner and the end of the name both fit at
// a 1.6 aspect; narrower windows back the camera off proportionally.
const CAM_TARGET = new THREE.Vector3(1.6, 1.1, -0.4);
const CAM_DIR = new THREE.Vector3(0.636, 0.353, 0.69).normalize();
const CAM_DIST = 7.6;
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
  started,
}: {
  controls: React.RefObject<OrbitControlsImpl | null>;
  mobile: boolean;
  /** The room loads behind the boot screen; the zoom waits for this. */
  started: boolean;
}) {
  const { camera, size } = useThree();
  const t = useRef(0);
  const aspect = size.width / Math.max(size.height, 1);
  const end = mobile
    ? MOBILE_END
    : CAM_TARGET.clone().addScaledVector(CAM_DIR, CAM_DIST * Math.max(1, 1.6 / aspect));
  const target = mobile ? MOBILE_TARGET : CAM_TARGET;

  useEffect(() => {
    camera.position.copy(CAM_START);
    t.current = 0;
    if (controls.current) {
      controls.current.target.copy(target);
      controls.current.enabled = false;
    }
  }, [camera, controls, target, started]);

  useFrame((_, dt) => {
    if (!started || t.current >= 1) return;
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

// The ground is invisible except for what it reflects, like the reference: an
// unlit surface in exactly the background colour (the background is not
// tone-mapped, so neither is this), with the blurred reflection on top. Lit
// and fogged, it showed up as a shiny band across the back.
function MirrorFloor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.101, 0]}>
      <planeGeometry args={[200, 200]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[200, 60]}
        mixBlur={0.8}
        mixStrength={1.6}
        mixContrast={1}
        mirror={0.7}
        depthScale={0}
        color="#000000"
        emissive={BG}
        emissiveIntensity={1}
        metalness={0}
        roughness={1}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}

interface RoomSceneProps {
  onSelect: (s: Section) => void;
  /** False while the boot/hello screens cover the room. */
  started?: boolean;
  /** An overlay is open: stop rendering and blur the frozen frame. */
  paused?: boolean;
}

export default function RoomScene({ onSelect, paused = false, started = true }: RoomSceneProps) {
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
        // Frozen while an overlay is open, so the overlay's animation has the
        // GPU to itself and the blur below is applied to a still image.
        frameloop={paused ? "never" : "always"}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 1.5]}
        camera={{ position: CAM_START.toArray(), fov: 40, near: 0.1, far: 120 }}
        onCreated={({ gl, scene }) => {
          // Same view transform the Blender scene is graded in (AgX, -0.3 EV).
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = 0.85;
          scene.background = new THREE.Color(BG);
        }}
        style={{
          cursor: hovered ? "pointer" : "default",
          filter: paused ? "blur(7px) brightness(0.75)" : "none",
          transition: "filter 350ms ease-out",
        }}
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
          <CameraIntro controls={controls} mobile={mobile} started={started} />
          {/* Compile every shader and upload every texture as soon as the
              model arrives (during the boot screen), not on first view. */}
          <Preload all />
        </Suspense>

        <OrbitControls
          ref={controls}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.4}
          zoomToCursor
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
