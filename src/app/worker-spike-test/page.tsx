"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { SceneConfig } from "@/lib/types";
import type { SimEvent } from "@/sim/engine";
import { getTotalDurationMs } from "@/components/arm-simulator/playback";

const Scene = dynamic(() => import("@/components/arm-simulator/Scene").then((m) => m.Scene), {
  ssr: false,
});

// Throwaway page to validate Scene.tsx against a hardcoded event list (plan task #21).
const SCENE: SceneConfig = {
  objects: [{ id: "block1", shape: "cube", position: [0, -160, 85], size: 30, color: "red" }],
  targetZones: [{ id: "zoneA", position: [70, -150, 90], radius: 40 }],
  armStart: {},
  sensorOrigin: [0, -160, 400],
};

const FAKE_EVENTS: SimEvent[] = [
  { type: "move", fromAngles: [120, 90, 0], toAngles: [120, 110, 49], tStart: 0, tEnd: 1500 },
  { type: "move", fromAngles: [120, 110, 49], toAngles: [120, 117, 56], tStart: 1500, tEnd: 2300 },
  { type: "pump", t: 2300, attachedObjectId: "block1" },
  { type: "move", fromAngles: [120, 117, 56], toAngles: [120, 89, 5], tStart: 3300, tEnd: 4300 },
  { type: "move", fromAngles: [120, 89, 5], toAngles: [95, 91, 5], tStart: 4300, tEnd: 5100 },
  { type: "move", fromAngles: [95, 91, 5], toAngles: [95, 116, 53], tStart: 5100, tEnd: 5900 },
  { type: "valveOn", t: 5900, releasedObjectId: "block1", releasePosition: [70, -150, 90] },
];

export default function WorkerSpikePage() {
  const [t, setT] = useState(0);
  const total = getTotalDurationMs(FAKE_EVENTS);

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - start;
      setT(Math.min(elapsed * 4, total)); // 4x speed for a quick visual check
      if (elapsed * 4 < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  return (
    <div style={{ padding: 20 }}>
      <p id="playback-time">t = {t.toFixed(0)}ms / {total}ms</p>
      <div style={{ height: 500, width: 700 }}>
        <Scene events={FAKE_EVENTS} sceneConfig={SCENE} playbackTimeMs={t} />
      </div>
    </div>
  );
}
