import { useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { author } from "../content";
import { getNav } from "../state/nav";
import { useRoomFrame } from "./room";

const damp = THREE.MathUtils.damp;

/** The author's portrait, mounted like a print and hung in warm window light. */
export function HeroRoom() {
  const frame = useRef<THREE.Group>(null!);
  const { pointer, viewport } = useThree();
  const map = useTexture(author.portrait);
  map.colorSpace = THREE.SRGBColorSpace;

  const ratio = 733 / 586; // height / width of portrait.jpg
  const narrow = viewport.aspect < 0.8;
  // On phones the print shrinks and sits between the name above and the intro below.
  const h = Math.min(2.6, viewport.height * (narrow ? 0.3 : 0.52), viewport.width * 0.62 * ratio);
  const w = h / ratio;
  const lift = narrow ? -viewport.height * 0.02 : 0;

  useRoomFrame((state, dt) => {
    const active = getNav().index === 0 ? 1 : 0;
    const g = frame.current;
    g.rotation.y = damp(g.rotation.y, pointer.x * 0.28 * active, 3.5, dt);
    g.rotation.x = damp(g.rotation.x, -pointer.y * 0.18 * active, 3.5, dt);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05 - 0.1 + lift;
  });

  return (
    <group ref={frame}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.36, h + 0.36, 0.04]} />
        <meshStandardMaterial color="#f6f0e6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[w + 0.42, h + 0.42, 0.02]} />
        <meshStandardMaterial color="#1d1712" roughness={0.5} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
    </group>
  );
}
