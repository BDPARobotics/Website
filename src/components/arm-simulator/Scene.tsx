"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { forward, LINK, type Vec3 } from "@/sim/kinematics";
import type { SimEvent } from "@/sim/engine";
import type { SceneConfig } from "@/lib/types";
import { getAnglesAtTime, getObjectPositionAtTime } from "./playback";

// 1 three.js unit = 100mm — keeps the ~100-400mm arm reach in a sane camera range.
const SCALE = 0.01;

// Sim coords are mm, Z inverted (negative = up). three.js is Y-up.
function toThree([x, y, z]: Vec3): THREE.Vector3 {
  return new THREE.Vector3(x * SCALE, -z * SCALE, y * SCALE);
}

// Simplified visual: NOT a mechanically exact 2-link render (the real
// forward-kinematics only gives us a verified end-effector position, not an
// intermediate elbow position — see plan notes). One tapering segment from a
// shoulder pivot to the end effector is honest to what we've actually
// verified, while still reading clearly as "a robot arm reaching for something."
function ArmSegment({ angles }: { angles: [number, number, number] }) {
  const shoulder = useMemo(() => new THREE.Vector3(0, LINK.L0 * SCALE, 0), []);
  const end = useMemo(() => toThree(forward(angles)), [angles]);

  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(end, shoulder);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(shoulder, end).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { position: mid, quaternion: q, length: len };
  }, [shoulder, end]);

  return (
    <>
      <mesh position={shoulder}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#1B3965" />
      </mesh>
      <mesh position={position} quaternion={quaternion}>
        <cylinderGeometry args={[0.1, 0.06, length, 12]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      <mesh position={end}>
        <coneGeometry args={[0.12, 0.3, 16]} />
        <meshStandardMaterial color="#233242" />
      </mesh>
    </>
  );
}

function SceneObjectMesh({
  shape,
  size,
  color,
  position,
}: {
  shape: "cube" | "cylinder" | "sphere";
  size: number;
  color: string;
  position: Vec3;
}) {
  const s = (size * SCALE) / 2;
  return (
    <mesh position={toThree(position)}>
      {shape === "cube" && <boxGeometry args={[s * 2, s * 2, s * 2]} />}
      {shape === "cylinder" && <cylinderGeometry args={[s, s, s * 2, 16]} />}
      {shape === "sphere" && <sphereGeometry args={[s, 16, 16]} />}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function TargetZoneRing({ position, radius }: { position: Vec3; radius: number }) {
  return (
    <mesh position={toThree(position)} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * SCALE * 0.75, radius * SCALE, 32]} />
      <meshBasicMaterial color="#51b56d" transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Plain prop-driven re-render (not a useFrame/ref mutation loop) — the scene
// here is a handful of meshes and the event lists are short, so React's
// reconciliation cost is negligible. A perf pass can revisit this if the
// simulator ever needs many simultaneous objects or very long runs.
function AnimatedContents({
  events,
  sceneConfig,
  playbackTimeMs,
}: {
  events: SimEvent[];
  sceneConfig: SceneConfig;
  playbackTimeMs: number;
}) {
  const angles = getAnglesAtTime(events, playbackTimeMs);

  return (
    <group>
      <ArmSegment angles={angles} />
      {sceneConfig.objects.map((obj) => (
        <SceneObjectMesh
          key={obj.id}
          shape={obj.shape}
          size={obj.size}
          color={obj.color ?? "#888888"}
          position={getObjectPositionAtTime(events, obj.id, obj.position, playbackTimeMs)}
        />
      ))}
      {sceneConfig.targetZones.map((zone) => (
        <TargetZoneRing key={zone.id} position={zone.position} radius={zone.radius} />
      ))}
    </group>
  );
}

export function Scene({
  events,
  sceneConfig,
  playbackTimeMs,
}: {
  events: SimEvent[];
  sceneConfig: SceneConfig;
  playbackTimeMs: number;
}) {
  return (
    <div className="h-[480px] w-full overflow-hidden rounded-lg bg-[#0f1420]">
      <Canvas camera={{ position: [4, 3, 4], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <Grid args={[10, 10]} cellColor="#334155" sectionColor="#475569" position={[0, 0, 0]} />
        <mesh position={[0, (LINK.L0 * SCALE) / 2, 0]}>
          <cylinderGeometry args={[0.4, 0.4, LINK.L0 * SCALE, 24]} />
          <meshStandardMaterial color="#1B3965" />
        </mesh>
        <AnimatedContents events={events} sceneConfig={sceneConfig} playbackTimeMs={playbackTimeMs} />
        <OrbitControls target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}
