import { useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { author } from "../content";
import { useBands } from "../state/layout";
import { getNav } from "../state/nav";
import { isPhone, useRoomFrame } from "./room";

const damp = THREE.MathUtils.damp;

/** The author's portrait, mounted like a print and hung in warm window light. */
export function HeroRoom() {
  const frame = useRef<THREE.Group>(null!);
  const { pointer, viewport, size } = useThree();
  const map = useTexture(author.portrait);
  map.colorSpace = THREE.SRGBColorSpace;

  const ratio = 733 / 586; // height / width of portrait.jpg
  const mat = 0.14; // mat and frame grow with the photo, as fractions of its height
  const edge = 0.16;
  const { hero: band } = useBands();

  // On desktop the print hangs centred in front of the name. On phones it is fitted into the
  // measured gap between the name and the intro, so it never covers text on any screen size.
  const px = viewport.height / size.height; // world units per CSS pixel at the portrait's depth
  let h = Math.min(2.6, viewport.height * 0.52, viewport.width * 0.62 * ratio);
  let centreY = -0.1;
  if (isPhone(size.width) && band && band.bottom > band.top) {
    h = Math.min(((band.bottom - band.top) * px) / (1 + edge), viewport.width * 0.62 * ratio);
    centreY = (size.height / 2 - (band.top + band.bottom) / 2) * px;
  }
  const w = h / ratio;

  useRoomFrame((state, dt) => {
    const active = getNav().index === 0 ? 1 : 0;
    const g = frame.current;
    g.rotation.y = damp(g.rotation.y, pointer.x * 0.28 * active, 3.5, dt);
    g.rotation.x = damp(g.rotation.x, -pointer.y * 0.18 * active, 3.5, dt);
    g.position.y = centreY + Math.sin(state.clock.elapsedTime * 0.8) * h * 0.02;
  });

  return (
    <group ref={frame}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + h * mat, h * (1 + mat), 0.04]} />
        <meshStandardMaterial color="#f6f0e6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[w + h * edge, h * (1 + edge), 0.02]} />
        <meshStandardMaterial color="#1d1712" roughness={0.5} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
    </group>
  );
}
