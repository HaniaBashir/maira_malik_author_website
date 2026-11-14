import { useMemo, useRef } from "react";
import * as THREE from "three";
import { reducedMotion } from "../state/nav";
import { useRoomFrame } from "./room";

const SHEETS = 6;

/** Loose manuscript pages drifting in still air at the edges of the author's room. */
export function PoetRoom() {
  const group = useRef<THREE.Group>(null!);
  const seeds = useMemo(
    () =>
      Array.from({ length: SHEETS }, (_, i) => ({
        // Keep the middle clear for the text; pages drift at the edges.
        x: (i % 2 ? 1 : -1) * (4.6 + Math.random() * 3.5),
        y: (Math.random() - 0.5) * 4.5,
        z: -2.5 - Math.random() * 4,
        spin: 0.15 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useRoomFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    group.current.children.forEach((m, i) => {
      const s = seeds[i];
      m.position.set(s.x + Math.sin(t * 0.2 + s.phase) * 0.4, s.y + Math.sin(t * 0.35 + s.phase) * 0.35, s.z);
      m.rotation.set(Math.sin(t * s.spin + s.phase) * 0.6, t * s.spin * 0.5 + s.phase, Math.cos(t * s.spin) * 0.3);
    });
  });

  return (
    <group ref={group}>
      {seeds.map((_, i) => (
        <mesh key={i}>
          <planeGeometry args={[0.7, 1]} />
          <meshLambertMaterial color="#fbf6ee" emissive="#e8dccb" emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
