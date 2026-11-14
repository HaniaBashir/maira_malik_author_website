import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { reducedMotion } from "../state/nav";
import { floorPool, softSprite } from "./paperTextures";
import { isPhone, useRoomFrame } from "./room";

const EMBERS = 60;

/** Sparks lifting off the candle and drifting up into the dark. */
function Embers() {
  const points = useRef<THREE.Points>(null!);
  const { geometry, seeds } = useMemo(() => {
    const seeds = Array.from({ length: EMBERS }, () => ({
      x: (Math.random() - 0.5) * 9,
      z: -Math.random() * 6 + 1,
      speed: 0.12 + Math.random() * 0.3,
      sway: Math.random() * Math.PI * 2,
      offset: Math.random() * 6,
    }));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(EMBERS * 3), 3));
    return { geometry: g, seeds };
  }, []);
  const sprite = useMemo(softSprite, []);

  useRoomFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    seeds.forEach((s, i) => {
      const y = ((s.offset + t * s.speed) % 6) - 2;
      attr.setXYZ(i, s.x + Math.sin(t * 0.6 + s.sway) * 0.3, y, s.z);
    });
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={sprite}
        color="#ffb35a"
        size={0.09}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
}

/** The candle itself; its light comes from the shared light rig, which flickers in step. */
function Candle() {
  const flame = useRef<THREE.Mesh>(null!);
  const halo = useMemo(softSprite, []);
  // Phones have no free corner for it among the text; the warm light stays, the candle goes.
  const narrow = useThree((st) => isPhone(st.size.width));

  useRoomFrame((state) => {
    if (!flame.current) return;
    const t = state.clock.elapsedTime;
    flame.current.scale.y = reducedMotion ? 1 : 0.85 + Math.sin(t * 11) * 0.05 + Math.sin(t * 23.7) * 0.06;
  });

  if (narrow) return null;
  return (
    <group position={[-1.15, -1.3, -0.5]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.44, 20]} />
        <meshStandardMaterial color="#f3e6cf" roughness={0.6} emissive="#ffb36a" emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={flame} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#ffe3a6" />
      </mesh>
      <sprite position={[0, 0.56, 0]} scale={0.9}>
        <spriteMaterial map={halo} color="#ffae4d" opacity={0.6} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

export function LampRoom({ children }: { index: number; children: React.ReactNode }) {
  const floor = useMemo(() => floorPool("rgba(120,70,32,0.95)", "rgba(58,36,20,0.7)"), []);
  return (
    <group>
      <Embers />
      <Candle />
      {children}
      {/* the writing desk, fading out at its edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial map={floor} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Where the candle flame sits, relative to its room, for the shared light rig. */
export const CANDLE_LIGHT: [number, number, number] = [-1.15, -0.6, -0.3];
